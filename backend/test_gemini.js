require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function testSimple() {
    console.log("\n--- Testing Simple Chat (gemini-2.0-flash-exp) ---");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const chat = model.startChat();
        const result = await chat.sendMessage("Hello");
        console.log("✅ Simple Response:", result.response.text());
    } catch (error) {
        console.error("❌ Simple Error:", error);
    }
}

async function testStreamWithSystemInstruction() {
    console.log("\n--- Testing Stream + System Instruction ---");
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are a helpful assistant."
        });
        const chat = model.startChat({
            history: [{ role: "user", parts: [{ text: "Hi" }] }, { role: "model", parts: [{ text: "Hello" }] }]
        });
        const result = await chat.sendMessageStream("How are you?");
        let text = "";
        for await (const chunk of result.stream) {
            text += chunk.text();
        }
        console.log("✅ Stream Response:", text);
    } catch (error) {
        console.error("❌ Stream Error:", error.message);
    }
}

async function testTools() {
    console.log("\n--- Testing Tools (Google Search) with gemini-1.5-flash ---");
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            tools: [{ googleSearch: {} }]
        });
        const chat = model.startChat();
        const result = await chat.sendMessage("What is the stock price of Google?");
        console.log("✅ Tool Response:", result.response.text());
    } catch (error) {
        console.error("❌ Tool Error:", error.message);
    }
}

(async () => {
    await testSimple();
    await testStreamWithSystemInstruction();
    // await testTools();
})();
