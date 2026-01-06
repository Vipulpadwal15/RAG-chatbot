# 🤖 RAG Chatbot - Local & Hybrid AI Powerhouse

![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg) ![Node](https://img.shields.io/badge/Backend-Node.js-339933.svg) ![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-blue.svg)

A powerful, **Retrieval Augmented Generation (RAG)** chatbot that combines local privacy with the power of **Gemini 1.5 Flash**. Analyze PDFs, scrape websites, and generate deep insights with a "Product-Grade" user experience.

---

## 🚀 Key Features

### ✨ Premium "SaaS-Level" UI
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

### 🌐 Hybrid Intelligence
- **RAG Engine:** Chat with your local PDFs using vector search.
- **Web Search Grounding:** Toggle "Web Search" to let the AI browse the internet for up-to-date info.
- **Image Analysis:** Upload images for instant description and analysis sharing the context of your docs.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | Production-grade UI with `lucide-react` icons and `react-markdown`. |
| **Backend** | Node.js + Express | Robust API handling streams and sessions. |
| **Database** | MongoDB | Stores vector chunks, chat history, and document metadata. |
| **AI Model** | Gemini 1.5 Flash | Fast, multimodal LLM for high-quality reasoning. |
| **Vector DB** | MongoDB Atlas / Local | Custom cosine similarity implementation. |

---

## ⚙️ Prerequisites

1.  **Node.js** (v18+)
2.  **MongoDB** (Running locally or Atlas)
3.  **Google Gemini API Key** (Set in `.env`)

---

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/Vipulpadwal15/RAG-chatbot.git
cd RAG-chatbot
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rag_chatbot
GEMINI_API_KEY=your_google_api_key_here
```
Start the server:
```bash
npm start
```

### 3. Frontend Setup
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
3.  **Chat & Create:**
    *   Ask complex questions.
    *   Toggle **Web Search** to check facts online.
    *   Upload charts/images to get an AI breakdown.

---

## 📁 Project Structure

```bash
RAG-chatbot/
├── backend/
│   ├── routes/         # API Routes (ragRoutes.js)
│   ├── utils/          # Gemini & Vector Logic
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
