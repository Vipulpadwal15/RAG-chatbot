const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");

const Document = require("../models/Document");
const Chunk = require("../models/Chunk");
const {
  getEmbedding,
  generateAnswerWithContext,
  summarizeLongText,
} = require("../utils/gemini");

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

//
// =================== 📄 PDF Upload ===================
//
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
    res.status(500).json({ error: "PDF processing failed" });
  }
});

//
// =================== 🌐 Website Ingestion ===================
router.post("/ingest/url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const resp = await axios.get(url, { headers:{ "User-Agent":"Mozilla" }});
    let text = resp.data.toString()
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

    const result = await ingest(text, {
      title:`Web: ${new URL(url).hostname}`,
      originalName:url,
      category:"Web",
      tags:["web"]
    });

    res.json({ message:`Website indexed (${result.chunks} chunks)`, documentId:result.id });
  } catch {
    res.status(500).json({ error:"Failed to fetch website text" });
  }
});

//
// =================== 🤖 Chat Query ===================
router.post("/chat", async (req,res)=>{
  try{
    const { question, documentId } = req.body;
    if(!question) return res.status(400).json({error:"Enter a question"});

    const filter = documentId ? { document:documentId } : {};
    const chunks = await Chunk.find(filter);

    const q = await getEmbedding(question);
    const sorted = chunks
      .map(c => ({ ...c._doc, score:cosineSim(q,c.embedding)}))
      .sort((a,b)=>b.score-a.score)
      .slice(0,5);

    const context = sorted.map(s=>s.text).join("\n\n");
    const reply = await generateAnswerWithContext(question, context);

    res.json({ answer:reply, sources:sorted });
  }catch{
    res.status(500).json({ error:"Chat failed" });
  }
});

//
// =================== Summary ===================
router.post("/summarize", async(req,res)=>{
  try{
    const chunks = await Chunk.find(req.body.documentId ? {document:req.body.documentId} : {});
    const combined = chunks.slice(0,40).map(c=>c.text).join("\n");
    const summary = await summarizeLongText(combined);
    res.json({ summary });
  }catch{
    res.status(500).json({ error:"Summary failed" });
  }
});

//
// =================== Doc List ===================
router.get("/documents", async(req,res)=>{
  const docs = await Document.find().lean();
  res.json(docs);
});

//
// =================== Rename / Tags ===================
router.patch("/document/:id", async(req,res)=>{
  const doc = await Document.findByIdAndUpdate(req.params.id, req.body, {new:true});
  res.json(doc);
});

//
// =================== Delete ===================
router.delete("/document/:id", async(req,res)=>{
  await Chunk.deleteMany({ document:req.params.id });
  await Document.findByIdAndDelete(req.params.id);
  res.json({ message:"Removed" });
});

module.exports = router;
