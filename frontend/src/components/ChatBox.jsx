import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Upload, StopCircle, User, Bot, Copy, FileText, Check } from "lucide-react";
import axios from "axios";

// Helper to read stream
const readStream = async (reader, onChunk) => {
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy"
      style={{
        position: 'absolute', top: 0, right: 0,
        background: 'transparent', border: 'none',
        color: copied ? 'var(--accent-primary)' : 'var(--text-tertiary)',
        cursor: 'pointer', padding: '4px', opacity: 0.6,
        marginTop: '-4px'
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={13} />}
    </button>
  );
};


const ChatBox = ({ documentId, sessionId, setSessionId, onDocumentUpload }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const endRef = useRef(null);
  const textareaRef = useRef(null);

  const starterCards = [
    { title: "Summarize this document", prompt: "Summarize this document in 3 concise paragraphs." },
    { title: "Extract key dates", prompt: "List all key dates and deadlines found in the text." },
    { title: "Identify main risks", prompt: "What are the main risks or warnings mentioned?" },
    { title: "Explain technical terms", prompt: "List and explain any technical terms used." }
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (sessionId) {
      loadHistory(sessionId);
    } else {
      setMessages([]); // Empty state for new chats
      setInput("");
    }
  }, [sessionId]);

  const loadHistory = async (sessId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/rag/history/${sessId}`);
      if (res.data && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Failed to load session", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/rag/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Notify parent
      if (onDocumentUpload) {
        onDocumentUpload(res.data.documentId);
      }
      alert("Document uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleStarterClick = (prompt) => {
    sendMessage(prompt);
  };

  const sendMessage = async (overrideInput) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setInput("");

    setMessages((prev) => [...prev, { role: "model", content: "" }]);

    // Generate session ID if new
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      activeSessionId = `sess_${Date.now()}`;
      setSessionId(activeSessionId);
    }

    try {
      const response = await fetch("http://localhost:5000/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg.content,
          documentId,
          sessionId: activeSessionId
        }),
      });

      const reader = response.body.getReader();
      let accumulatedText = "";

      await readStream(reader, (chunk) => {
        accumulatedText += chunk;
        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = accumulatedText;
          return newMsgs;
        });
      });
    } catch (error) {
      setMessages((prev) => [...prev, { role: "model", content: "Error: Could not get response." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="chat-container-wrapper">

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-header">
            <h2>Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}</h2>
            <p>Ready to analyze your knowledge base.</p>
          </div>
          <div className="starter-cards-grid">
            {starterCards.map((card, idx) => (
              <div key={idx} className="starter-card" onClick={() => handleStarterClick(card.prompt)}>
                <h4>{card.title}</h4>
                <span>{card.prompt}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div key={idx} className="message-row">
                <div className="message-bucket">
                  <div className={`message-avatar ${isUser ? 'user' : 'ai'}`}>
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div className="message-content" style={{ position: 'relative' }}>
                    {!isUser && <CopyButton text={msg.content} />}
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="message-row">
              <div className="message-bucket">
                <div className="message-avatar ai"><Bot size={16} /></div>
                <div className="typing-pulse">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <div className="input-container">
          {/* Top Controls: Context + Chips */}
          <div className="input-top-controls" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '4px' }}>
            <div className="preview-chip" style={{ background: 'transparent', paddingLeft: 0, color: 'var(--accent-primary)' }}>
              <FileText size={12} />
              Using: {documentId ? "Specific Document" : "All Documents"}
            </div>
            {uploading && (
              <div className="preview-chip">
                <Upload size={12} /> Uploading...
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            className="chat-text-input"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
          />

          <div className="input-actions">
            <div className="actions-left">
              <button className="action-btn" onClick={() => document.getElementById('chat-doc-upload').click()} title="Upload Document">
                <Upload size={18} />
              </button>
              <input id="chat-doc-upload" type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} hidden />
            </div>
            <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading || uploading}>
              {loading ? <StopCircle size={16} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
