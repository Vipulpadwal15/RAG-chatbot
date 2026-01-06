# 🤖 RAG Chatbot - Local AI Powerhouse

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg) ![Node](https://img.shields.io/badge/Backend-Node.js-339933.svg) ![Ollama](https://img.shields.io/badge/AI-Ollama-white.svg)

A powerful, privacy-focused **Retrieval Augmented Generation (RAG)** chatbot that runs **entirely locally**.
By leveraging **Ollama**, this application allows you to chat with your PDF documents and websites without sending data to the cloud.

---

## 🚀 Features

### 🔒 100% Local Intelligence
- **No Cloud APIs:** Powered by `llama3` and `nomic-embed-text` running on your machine via Ollama.
- **Privacy First:** Your documents never leave your local network.

### 🧠 Advanced RAG Capabilities
- **PDF Ingestion:** Upload and chat with multiple PDFs simultaneously.
- **Web Scraping:** Ingest website URLs and extract knowledge.
- **Context-Aware:** Responses are grounded strictly in your provided documents (Zero Hallucinations).
- **Multi-Language:** Supports English, Hindi, and Marathi query/response.

### ✨ Modern UI/UX
- **Glassmorphism Design:** A sleek, premium dark-mode interface.
- **Chat History:** Save, resume, and delete chat sessions.
- **Tools Panel:**
    - **Summarizer:** Auto-generate summaries of uploaded docs.
    - **Similarity Check:** See exactly which document chunks matched your query.
- **Streaming Responses:** Real-time AI typing effect.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Fast, responsive UI with CSS Cards/Glass effects. |
| **Backend** | Node.js + Express | REST API for chat, upload, and history management. |
| **Database** | MongoDB | Stores vector embeddings, chat history, and metadata. |
| **AI Engine** | Ollama | Runs local LLMs (`llama3`) and Embedding models. |
| **Vector Search** | Cosine Similarity | Custom implementation for ranking document chunks. |

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js**: [Download Here](https://nodejs.org/)
2.  **MongoDB**: [Download Community Server](https://www.mongodb.com/try/download/community)
3.  **Ollama**: [Download Here](https://ollama.com/)

---

## 📦 Installation & Setup

### 1. Prepare AI Models
Open your terminal and pull the required Ollama models:
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

### 2. Clone Repository
```bash
git clone https://github.com/Vipulpadwal15/RAG-chatbot.git
cd RAG-chatbot
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
# Your MongoDB connection string
MONGO_URI=mongodb://localhost:27017/rag_chatbot
```

Start the backend server:
```bash
npm start
# Server runs on http://localhost:5000
```

### 4. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm start
# App opens at http://localhost:3000
```

---

## 🎮 Usage Guide

1.  **Upload Data:**
    *   Click the **Paperclip Icon** to upload a PDF.
    *   Or enter a URL in the "Add Data" section to scrape a website.
2.  **Wait for Processing:**
    *   The system chunks and embeds your data. Wait for the success notification.
3.  **Chat:**
    *   Type your question in the box.
    *   The AI will search your docs and answer based *only* on them.
4.  **Use Tools:**
    *   **Summarize:** Get a quick overview of the current document.
    *   **Similarity:** Debug exactly what the AI "read" to answer you.

---

## 📁 Project Structure

```bash
RAG-chatbot/
├── backend/
│   ├── models/         # MongoDB Schemas (Chat, Chunk, Document)
│   ├── routes/         # API Routes (history, upload, chat)
│   ├── utils/          # AI Logic (ollama.js, vector-search)
│   └── server.js       # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/ # ChatBox, HistorySidebar, ToolsPanel
│   │   ├── api.js      # Axios endpoints
│   │   └── App.css     # Global styles
│
└── README.md
```

## 📜 License
This project is licensed under the MIT License.

