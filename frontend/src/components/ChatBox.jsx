import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Image as ImageIcon, Globe, StopCircle, User, Bot } from "lucide-react";
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

const ChatBox = ({ documentId, sessionId, setSessionId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const endRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Load history when session changes
  useEffect(() => {
    if (sessionId) {
      loadHistory(sessionId);
    } else {
      setMessages([{ role: "model", content: "Hello! How can I help you today?" }]);
      setInput("");
      setImageFile(null);
      setImagePreview(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !imageFile) || loading) return;

    const userMsg = { role: "user", content: input, image: imagePreview };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setInput("");
    setImagePreview(null); // Clear preview immediately from input
    // imageFile is kept for the request logic below

    // Prepare temporary bot message for streaming
    setMessages((prev) => [...prev, { role: "model", content: "" }]);

    try {
      let imageData = null;
      if (imageFile) {
        imageData = imagePreview; // Use the base64 string
      }

      const response = await fetch("http://localhost:5000/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMsg.content,
          documentId,
          sessionId,
          useWebSearch,
          imageData
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

      setImageFile(null);

    } catch (error) {
      console.error("Chat error", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Error: Could not get response." },
      ]);
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
      <div className="chat-messages">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={idx} className="message-row">
              <div className="message-bucket">
                <div className={`message-avatar ${isUser ? 'user' : 'ai'}`}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>

                <div className="message-content">
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="User upload"
                      style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '12px', maxHeight: '300px' }}
                    />
                  )}
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
              <div className="message-content typing-indicator">Thinking...</div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        <div className="input-container">
          {/* Top Controls: Active Search / Image Preview */}
          {(useWebSearch || imagePreview) && (
            <div className="input-top-controls">
              {useWebSearch && (
                <div className="preview-chip">
                  <Globe size={12} /> Web Active
                </div>
              )}
              {imagePreview && (
                <div className="preview-chip">
                  <ImageIcon size={12} /> Image Attached
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, marginLeft: 4 }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="chat-text-input"
            placeholder="Message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
          />

          <div className="input-actions">
            <div className="actions-left">
              <button
                className="action-btn"
                title="Upload Image"
                onClick={() => document.getElementById('chat-img-upload').click()}
              >
                <ImageIcon size={18} />
              </button>
              <input
                id="chat-img-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />

              <button
                className={`action-btn ${useWebSearch ? 'active' : ''}`}
                title="Toggle Web Search"
                onClick={() => setUseWebSearch(!useWebSearch)}
                style={{ color: useWebSearch ? 'var(--accent-primary)' : '' }}
              >
                <Globe size={18} />
              </button>
            </div>

            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={(!input.trim() && !imageFile) || loading}
            >
              {loading ? <StopCircle size={16} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
