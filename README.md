# 🤖 RAG Chatbot - Local AI Powerhouse

![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg) ![Node](https://img.shields.io/badge/Backend-Node.js-339933.svg) ![Ollama](https://img.shields.io/badge/AI-Ollama-white.svg)

A powerful, privacy-focused **Retrieval Augmented Generation (RAG)** chatbot that runs **entirely locally**.
By leveraging **Ollama**, this application allows you to chat with your PDF documents and websites without sending data to the cloud.

---

## 🚀 Key Features

### ✨ Premium "Product-Grade" UI
- **Context-Aware Design:** The interface knows what you are reading. Input bars show active documents.
- **Glassmorphism & Obsidian Theme:** A refined, minimal dark mode designed for focus.
- **Starter Cards:** Smart suggestions ("Summarize", "Find Dates") appear when you open a new chat.
- **Markdown Rich Text:** Beautifully rendered tables, code blocks, and lists.

### 🧠 Advanced Analysis Tools
Turn your documents into actionable data with one click:
- **📊 SWOT Analysis:** Generate strategic Strengths, Weaknesses, Opportunities, and Threats reports.
- **📝 Action Plan:** Convert document text into a tactical step-by-step checklist.
- **🎓 Quiz Generator:** Test your knowledge with AI-generated multiple-choice questions.
- **🔍 Extract Key Info:** Instantly pull dates, names, and monetary values.

### 🔒 100% Local Intelligence
- **No Cloud APIs:** Powered by `llama3` and `nomic-embed-text` running on your machine via Ollama.
- **Privacy First:** Your documents never leave your local network.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Production-grade UI with `lucide-react` icons and `react-markdown`. |
| **Backend** | Node.js + Express | REST API for chat, upload, and history management. |
| **Database** | MongoDB | Stores vector embeddings, chat history, and metadata. |
| **AI Engine** | Ollama | Runs local LLMs (`llama3`) and Embedding models. |
| **Vector Search** | Cosine Similarity | Custom implementation for ranking document chunks. |

---

## ⚙️ Prerequisites

1.  **Node.js** (v18+)
2.  **MongoDB** (Running locally or Community Server)
3.  **Ollama**: [Download Here](https://ollama.com/)

---

## 📦 Installation & Setup

### 1. Prepare AI Models
Open your terminal and pull the required models:
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
Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rag_chatbot
```
Start the server:
```bash
npm start
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 🎮 Usage Guide

1.  **Add Knowledge:**
    *   Upload a **PDF** or ingest a **Website URL**.
    *   The system creates "Context Pillars" automatically.
2.  **Analyze:**
    *   Select a document.
    *   Use the **Tools Panel** on the right to run a *SWOT Analysis* or *Summarize* the text.
3.  **Chat:**
    *   Ask complex questions about your documents.
    *   The AI will answer based *strictly* on the provided context.

---

## 📁 Project Structure

```bash
RAG-chatbot/
├── backend/
│   ├── routes/         # API Routes (ragRoutes.js)
│   ├── utils/          # Ollama Logic (ollama.js)
│   └── server.js       # Express Server
│
├── frontend/
│   ├── src/
│   │   ├── components/ # ChatBox, ToolsPanel, HistorySidebar
│   │   ├── App.css     # The "Obsidian" Design System
│   │   └── App.js      # Main Layout
│
└── README.md
```
