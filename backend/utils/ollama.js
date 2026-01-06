const axios = require("axios");

const OLLAMA_BASE_URL = "http://localhost:11434/api";

// Validated models
const CHAT_MODEL = "llama3";
const EMBED_MODEL = "nomic-embed-text";

/**
 * Get embedding vector for a text chunk using Ollama.
 * Uses 'nomic-embed-text' model.
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
 * Uses 'llama3' model.
 */
async function generateAnswerStream({
    question,
    contextText,
    previousMessages = [],
    onToken,
    onComplete,
}) {
    const systemPrompt = `
You are a helpful RAG assistant.
RULES:
1. Use the provided CONTEXT to answer the question.
2. If the answer is not in the context, say "I don't know based on the provided documents."
3. Be concise and helpful.
`;

    // Construct prompt history
    // Ollama expects "messages" array in chat endpoint
    let messages = [
        { role: "system", content: systemPrompt }
    ];

    // Add history
    previousMessages.forEach(msg => {
        messages.push({ role: msg.role, content: msg.content });
    });

    // Add current context + question
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

            response.data.on('data', chunk => {
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.message && json.message.content) {
                            const content = json.message.content;
                            fullText += content;
                            if (onToken) onToken(content);
                        }
                        if (json.done) {
                            if (onComplete) onComplete(fullText);
                            // Don't resolve here, wait for stream end
                        }
                    } catch (e) {
                        // Ignore parse errors for partial chunks
                    }
                }
            });

            response.data.on('end', () => {
                resolve(fullText);
            });

            response.data.on('error', (err) => {
                reject(err);
            });

        } catch (error) {
            console.error("Error connecting to Ollama:", error.message);
            const errMsg = "Error connecting to local AI. Is Ollama running?";
            if (onToken) onToken(errMsg);
            if (onComplete) onComplete(errMsg);
            resolve(errMsg); // Resolve with error message so we don't crash DB save
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
