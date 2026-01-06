const mongoose = require("mongoose");

const ChatSessionSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        title: { type: String, default: "New Chat" },
        messages: [
            {
                role: { type: String, required: true }, // 'user' or 'model'
                content: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
                attachments: [
                    {
                        type: { type: String }, // 'image'
                        url: { type: String }   // base64 or stored url
                    }
                ]
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
