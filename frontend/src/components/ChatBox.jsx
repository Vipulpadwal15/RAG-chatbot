import React, { useState, useEffect, useRef } from "react";
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

    // Prepare temporary bot message for streaming
    setMessages((prev) => [...prev, { role: "model", content: "" }]);

    try {
      let imageData = null;
      if (imageFile) {
        // Convert to base64 if not already (preview is base64)
        imageData = imagePreview;
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
          // Update last message (bot)
          newMsgs[newMsgs.length - 1].content = accumulatedText;
          return newMsgs;
        });
      });

      // If this was a new session, we need to refresh or get the ID somehow. 
      // Ideally the backend returns the ID in headers or we generate it client side.
      // For simplicity, we refresh the session list or re-fetch history if needed.
      // For now, let's just clear the image.
      setImageFile(null);
      setImagePreview(null);

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container-wrapper">
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.role === "user" ? "user" : "bot"}`}>
            {msg.image && (
              <img src={msg.image} alt="User upload" className="msg-attachment" />
            )}
            <div className="msg-text">{msg.content}</div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="chat-bubble bot typing">Thinking...</div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        {imagePreview && (
          <div className="image-preview-bar">
            <img src={imagePreview} alt="Preview" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }}>×</button>
          </div>
        )}

        <div className="input-controls">
          <label className="toggle-search">
            <input
              type="checkbox"
              checked={useWebSearch}
              onChange={(e) => setUseWebSearch(e.target.checked)}
            />
            <span>🌐 Web Search</span>
          </label>
          <label className="image-upload-btn">
            📷
            <input type="file" accept="image/*" onChange={handleImageChange} hidden />
          </label>
        </div>

        <div className="input-box-row">
          <input
            type="text"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
