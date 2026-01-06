const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Get embedding vector for a text chunk.
 */
async function getEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Generate answer using RAG context with Streaming and Grounding.
 */
async function generateAnswerStream({
  question,
  contextText,
  useWebSearch,
  previousMessages = [],
  imagePart = null,
  onToken,    // Callback for streaming tokens
  onComplete, // Callback when done
}) {

  // System instruction for RAG behavior
  const systemInstruction = `
You are a helpful RAG assistant.
RULES:
1. If CONTEXT is provided, use it as the primary source of truth.
2. If CONTEXT is missing or irrelevant, and Web Search is ENABLED, you may use it.
3. If Web Search is DISABLED and context is insufficient, say "I don't know based on the provided documents."
4. Always answer in the same language as the Question.
5. Be concise and helpful.
`;

  // 1. Select Model
  // User requested "2.5 flash" -> Mapping to "gemini-2.0-flash-exp"
  // NOTE: This key appears to REQUIRE tools (Grounding) to work, otherwise it throws "supported methods" error.
  const modelName = "gemini-2.0-flash-exp";
  const modelParams = {
    model: modelName,
    systemInstruction: systemInstruction,
    tools: [{ googleSearch: {} }] // Enforcing tools
  };

  // if (useWebSearch) {
  //     modelParams.tools = [{ googleSearch: {} }];
  // }

  const model = genAI.getGenerativeModel(modelParams);

  // 2. Construct Prompt history
  let history = previousMessages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // 3. Current Message Construction
  const parts = [];

  if (contextText) {
    parts.push({ text: `CONTEXT:\n${contextText}\n\n` });
  }

  parts.push({ text: `QUESTION:\n${question}` });

  if (imagePart) {
    parts.push(imagePart);
  }

  try {
    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessageStream(parts);

    let fullText = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        if (onToken) onToken(chunkText);
      }
    }

    if (onComplete) onComplete(fullText);
    return fullText;

  } catch (err) {
    console.error("Gemini Stream Error:", err);
    // Fallback or error rethrow
    if (onToken) onToken("Error generating response.");
    if (onComplete) onComplete("Error generating response.");
    return "Error.";
  }
}

/**
 * Summarize long text content.
 */
async function summarizeLongText(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
Summarize the following document into 8-12 concise bullet points.
Document:
${text}
`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = {
  getEmbedding,
  generateAnswerStream,
  summarizeLongText,
};
