const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set in environment variables");
}

/**
 * Get embedding vector for a text chunk.
 * Uses text-embedding-004 which is multilingual (works across languages).
 */
async function getEmbedding(text) {
  const url = `${GEMINI_BASE}/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

  const resp = await axios.post(url, {
    content: { parts: [{ text }] },
  });

  const values = resp.data.embedding.values;
  return values;
}

/**
 * Generate answer using RAG context.
 * Multi-language behaviour:
 *  - Detect the language of the QUESTION (English / Hindi / Marathi / other).
 *  - Use CONTEXT (may be English) only as factual source.
 *  - Reply in the SAME LANGUAGE as the QUESTION.
 *  - If answer not present in CONTEXT, say you don't know, in that language.
 */
async function generateAnswerWithContext(question, contextText) {
  const url = `${GEMINI_BASE}/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
You are a Retrieval-Augmented Generation (RAG) assistant.

RULES:
1. First, internally detect the language of the QUESTION. It may be:
   - English
   - Hindi (हिंदी)
   - Marathi (मराठी)
   - or a mix.
2. ALWAYS answer in the SAME LANGUAGE as the QUESTION.
   - If question is in Hindi, answer completely in Hindi.
   - If question is in Marathi, answer completely in Marathi.
   - If question is in English, answer completely in English.
3. Use ONLY the information from CONTEXT to answer the question.
4. If the answer is not clearly found in CONTEXT:
   - Say "I don't know based on the document." translated into the question's language.
   - Do NOT invent facts.
5. Keep the answer clear and concise but helpful.

CONTEXT (may be in English or other language):
${contextText}

QUESTION (language of this controls your answer language):
${question}
`;

  const resp = await axios.post(url, {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  });

  const candidates = resp.data.candidates || [];
  const text =
    candidates[0]?.content?.parts?.map((p) => p.text).join("") ||
    "No answer.";
  return text;
}

/**
 * Summarize long text content.
 * (Currently default is English; you can extend later with language options.)
 */
async function summarizeLongText(text) {
  const url = `${GEMINI_BASE}/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
You are a helpful assistant.

Summarize the following document into 8-12 concise bullet points.
Focus on key ideas, important definitions, and core concepts.
Write the summary in clear, simple English.

DOCUMENT:
${text}
`;

  const resp = await axios.post(url, {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  });

  const candidates = resp.data.candidates || [];
  const summary =
    candidates[0]?.content?.parts?.map((p) => p.text).join("") ||
    "No summary.";
  return summary;
}

module.exports = {
  getEmbedding,
  generateAnswerWithContext,
  summarizeLongText,
};
