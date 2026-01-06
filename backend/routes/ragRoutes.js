const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");

const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const ChatSession = require("../models/ChatSession");

const {
  getEmbedding,
  generateAnswerStream,
  summarizeLongText,
} = require("../utils/ollama");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ------------------ Chunking ------------------
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

// ------------------ Cosine Similarity ------------------
function cosineSim(a, b) {
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    nA += a[i] * a[i];
    nB += b[i] * b[i];
  }
  nA = Math.sqrt(nA);
  nB = Math.sqrt(nB);
  return nA && nB ? dot / (nA * nB) : 0;
}

// ------------------ Create DB Document ------------------
async function ingest(text, meta) {
  if (!text || !text.trim()) throw new Error("No text found");

  const doc = await Document.create(meta);
  const chunks = chunkText(text);

  for (const chunk of chunks) {
    const embed = await getEmbedding(chunk);
    await Chunk.create({ document: doc._id, text: chunk, embedding: embed });
  }

  return { id: doc._id, chunks: chunks.length };
}

// =================== 📄 PDF Upload ===================
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });

    const text = (await pdfParse(req.file.buffer)).text;
    const result = await ingest(text, {
      title: req.file.originalname,
      originalName: req.file.originalname,
      category: "PDF",
      tags: []
    });

    res.json({ message: `PDF indexed (${result.chunks} chunks)`, documentId: result.id });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "PDF processing failed" });
  }
});

// =================== 🌐 Website Ingestion ===================
router.post("/ingest/url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const resp = await axios.get(url, { headers: { "User-Agent": "Mozilla" } });
    let text = resp.data.toString()
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

    const result = await ingest(text, {
      title: `Web: ${new URL(url).hostname}`,
      originalName: url,
      category: "Web",
      tags: ["web"]
    });

    res.json({ message: `Website indexed (${result.chunks} chunks)`, documentId: result.id });
  } catch {
    res.status(500).json({ error: "Failed to fetch website text" });
  }
});

// =================== 🤖 STREAMING Chat (Enhanced) ===================
router.post("/chat", async (req, res) => {
  try {
    const {
      question,
      documentId,
      sessionId,       // NEW
      useWebSearch,    // NEW
      imageData        // NEW (base64)
    } = req.body;

    // Use a custom event style on the frontend or just chunks

    // 1. Setup Response Headers for Streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    if (!question && !imageData) {
      res.write("Error: Enter a question or image");
      return res.end();
    }

    let context = "";

    // 2. Retrieve Context if Document ID is present (and no web search override logic needed mostly)
    if (documentId) {
      // If we have an image, we might skip doc context or combine it. 
      // For now, let's just get chunks if text is present.
      const filter = { document: documentId };
      const chunks = await Chunk.find(filter);

      if (chunks.length > 0 && question) {
        const qEmbed = await getEmbedding(question);
        const sorted = chunks
          .map(c => ({ ...c._doc, score: cosineSim(qEmbed, c.embedding) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        context = sorted.map(s => s.text).join("\n\n");
      }
    }

    // 3. Load or Create Session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ sessionId });
    }
    if (!session) {
      session = new ChatSession({
        sessionId: sessionId || `sess_${Date.now()}`,
        title: question ? question.substring(0, 30) : "New Chat"
      });
    }

    // 4. Prepare Image Part if exists
    let imagePart = null;
    if (imageData) {
      // expect imageData to be "data:image/png;base64,..."
      // Gemini expects base64 without prefix usually in part
      const base64Data = imageData.split(",")[1];
      const mimeType = imageData.split(";")[0].split(":")[1];
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    }

    // 5. Call Gemini Wrapper
    const finalText = await generateAnswerStream({
      question: question || "Describe this image",
      contextText: context,
      useWebSearch: !!useWebSearch,
      previousMessages: session.messages.slice(-6), // last 6 messages
      imagePart: imagePart,
      onToken: (token) => {
        res.write(token); // Stream
      }
    });

    // 6. Save to DB (after stream is done)
    session.messages.push({ role: 'user', content: question || "[Image Upload]" });
    session.messages.push({ role: 'model', content: finalText });
    await session.save();

    res.end(); // Close stream

  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: "Chat failed" });
    else res.end("\n[Error generating response]");
  }
});

// =================== 📜 Chat History ===================
router.get("/history", async (req, res) => {
  const sessions = await ChatSession.find().sort({ updatedAt: -1 }).select("sessionId title updatedAt");
  res.json(sessions);
});

router.get("/history/:sessionId", async (req, res) => {
  const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
  res.json(session);
});

router.delete("/history/:sessionId", async (req, res) => {
  try {
    console.log("DELETE Request for session:", req.params.sessionId);
    const result = await ChatSession.findOneAndDelete({ sessionId: req.params.sessionId });
    console.log("Delete result:", result);
    if (!result) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// =================== Summary ===================
router.post("/summarize", async (req, res) => {
  try {
    const chunks = await Chunk.find(req.body.documentId ? { document: req.body.documentId } : {});
    const combined = chunks.slice(0, 40).map(c => c.text).join("\n");
    const summary = await summarizeLongText(combined);
    res.json({ summary });
  } catch {
    res.status(500).json({ error: "Summary failed" });
  }
});

// =================== Doc List ===================
router.get("/documents", async (req, res) => {
  const docs = await Document.find().lean();
  res.json(docs);
});

// =================== Rename / Tags ===================
router.patch("/document/:id", async (req, res) => {
  const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
});

// =================== Delete ===================
router.delete("/document/:id", async (req, res) => {
  await Chunk.deleteMany({ document: req.params.id });
  await Document.findByIdAndDelete(req.params.id);
  res.json({ message: "Removed" });
});

module.exports = router;
