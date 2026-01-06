const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const fs = require("fs");

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

// =================== 🤖 STREAMING Chat ===================
router.post("/chat", async (req, res) => {
  const logFile = "C:\\Users\\Vipul\\.gemini\\antigravity\\brain\\479781bb-8a27-496f-ba0d-c14560d8a161\\debug.txt";
  const log = (msg) => { try { fs.appendFileSync(logFile, msg + "\n"); } catch (e) { console.error(e); } };
  log(`--> /chat request START CWD: ${process.cwd()}`);
  try {
    const {
      question,
      documentId,
      sessionId
    } = req.body;

    if (!question) {
      res.write("Error: Enter a question");
      return res.end();
    }

    // Set headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    let context = "";

    // 1. Retrieve Context
    if (documentId) {
      const chunks = await Chunk.find({ document: documentId });
      if (chunks.length > 0) {
        // Simple search
        const qEmbed = await getEmbedding(question);
        const sorted = chunks
          .map(c => ({ ...c._doc, score: cosineSim(qEmbed, c.embedding) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        context = sorted.map(s => s.text).join("\n\n");
      }
    }

    // 2. Load History
    let messages = [];
    if (sessionId) {
      const session = await ChatSession.findOne({ sessionId });
      if (session) messages = session.messages.slice(-6);
    }

    // 3. Call Ollama
    console.log("Calling generateAnswerStream...");
    const finalText = await generateAnswerStream({
      question,
      contextText: context,
      previousMessages: messages,
      onToken: (token) => {
        // Safeguard write
        if (!res.writableEnded) res.write(token);
      }
    });

    // 4. Save to DB
    if (sessionId) {
      let session = await ChatSession.findOne({ sessionId });
      if (!session) {
        session = new ChatSession({
          sessionId,
          title: question ? question.substring(0, 30) : "Chat"
        });
      }
      session.messages.push({ role: 'user', content: question });
      session.messages.push({ role: 'model', content: finalText });
      // Update title if it's the default
      if (session.title === "New Chat" || session.title === "New Session") {
        session.title = question.substring(0, 50) + (question.length > 50 ? "..." : "");
      }
      await session.save();
    }

    res.end();

  } catch (err) {
    const logFile = "C:\\Users\\Vipul\\.gemini\\antigravity\\brain\\479781bb-8a27-496f-ba0d-c14560d8a161\\debug.txt";
    try { fs.appendFileSync(logFile, "FAIL: " + err.stack + "\n"); } catch (e) { }
    console.error("CHAT ERROR:", err);
    if (!res.headersSent) res.status(500).json({ error: "Server Error: " + err.message });
    else res.end("\n[ERROR DETAILS: " + err.stack + "]");
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
  await ChatSession.findOneAndDelete({ sessionId: req.params.sessionId });
  res.json({ message: "Deleted" });
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

router.patch("/document/:id", async (req, res) => {
  const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
});

router.delete("/document/:id", async (req, res) => {
  await Chunk.deleteMany({ document: req.params.id });
  await Document.findByIdAndDelete(req.params.id);
  res.json({ message: "Removed" });
});

module.exports = router;
