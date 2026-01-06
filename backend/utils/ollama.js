const axios = require("axios");

const OLLAMA_BASE_URL = "http://localhost:11434/api";

// Models
const CHAT_MODEL = "llama3";
const EMBED_MODEL = "nomic-embed-text";

/**
 * Get embedding vector for a text chunk using Ollama.
 */
async function getEmbedding(text) {
    try {
        const response = await axios.post(`${OLLAMA_BASE_URL}/embeddings`, {
            model: EMBED_MODEL,
            prompt: text,
        });
        return response.data.embedding;
    } catch (error) {
        console.error("Error getting embedding from Ollama:", error.message);
        throw error;
    }
}

/**
 * Generate answer using RAG context with Streaming from Ollama.
 * Pure text-based RAG.
 */
async function generateAnswerStream({
    question,
    contextText,
    previousMessages = [],
    onToken,
    onComplete,
}) {
    console.log(`[Ollama] Generating answer for: "${question}"`);

    const systemPrompt = `
You are a helpful RAG assistant.
RULES:
1. Use the provided CONTEXT to answer the question.
2. If the answer is not in the context, say "I don't know based on the provided documents."
3. Be concise and helpful.
`;

    // Construct prompt history
    let messages = [
        { role: "system", content: systemPrompt }
    ];

    previousMessages.forEach(msg => {
        // Filter out any messages with null content or image fields just in case
        if (msg.content) {
            messages.push({ role: msg.role, content: msg.content });
        }
    });

    const finalUserContent = contextText
        ? `CONTEXT:\n${contextText}\n\nQUESTION:\n${question}`
        : `QUESTION:\n${question}`;

    messages.push({ role: "user", content: finalUserContent });

    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.post(`${OLLAMA_BASE_URL}/chat`, {
                model: CHAT_MODEL,
                messages: messages,
                stream: true,
            }, {
                responseType: 'stream'
            });

            let fullText = "";
            let buffer = "";

            response.data.on('data', chunk => {
                buffer += chunk.toString();

                let lines = buffer.split('\n');
                buffer = lines.pop(); // Keep partial line

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.message && json.message.content) {
                            const content = json.message.content;
                            fullText += content;
                            if (onToken) onToken(content);
                        }
                        if (json.done) {
                            if (onComplete) onComplete(fullText);
                        }
                    } catch (e) { }
                }
            });

            response.data.on('end', () => {
                if (buffer.trim()) {
                    try {
                        const json = JSON.parse(buffer);
                        if (json.message && json.message.content && onToken) {
                            onToken(json.message.content);
                        }
                    } catch (e) { }
                }
                console.log("[Ollama] Stream finished.");
                resolve(fullText);
            });

            response.data.on('error', (err) => {
                console.error("[Ollama] Stream error:", err);
                reject(err);
            });

        } catch (error) {
            console.error("Error connecting to Ollama:", error.message);
            const errMsg = "Error connecting to local AI. Is Ollama running? (Run 'ollama serve')";
            if (onToken) onToken(errMsg);
            if (onComplete) onComplete(errMsg);
            resolve(errMsg);
        }
    });
}

/**
 * Summarize long text content.
 */
async function summarizeLongText(text) {
    try {
        const prompt = `Summarize the following document into 8-12 concise bullet points:\n\n${text}`;
        const response = await axios.post(`${OLLAMA_BASE_URL}/generate`, {
            model: CHAT_MODEL,
            prompt: prompt,
            stream: false
        });
        return response.data.response;
    } catch (error) {
        console.error("Summarization error:", error.message);
        return "Failed to summarize.";
    }
}

module.exports = {
    getEmbedding,
    generateAnswerStream,
    summarizeLongText,
};
