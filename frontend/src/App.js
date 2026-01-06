import React, { useState } from "react";
import DocumentUpload from "./components/DocumentUpload";
import ChatBox from "./components/ChatBox";
import ToolsPanel from "./components/ToolsPanel";
import DocumentSelector from "./components/DocumentSelector";
import HistorySidebar from "./components/HistorySidebar";
import "./App.css";

const App = () => {
  const [activeDocId, setActiveDocId] = useState("ALL");
  const [docListRefreshKey, setDocListRefreshKey] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const handleUploaded = (documentId) => {
    setActiveDocId(documentId);
    setDocListRefreshKey((prev) => prev + 1);
  };

  const handleSelectSession = (sessId) => {
    setCurrentSessionId(sessId);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null); // Will trigger new session on first message
  };

  const effectiveDocId = activeDocId === "ALL" ? null : activeDocId;

  return (
    <div className="app-root">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <h2 className="brand-logo">RAGBot <span>AI</span></h2>
        <HistorySidebar
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />
      </aside>

      {/* Main Content */}
      <main className="app-main">
        <header className="top-bar">
          <div className="top-bar-left">
            <h3>{currentSessionId ? "Chat Session" : "New Conversation"}</h3>
          </div>
          <div className="top-bar-right">
            <DocumentSelector
              activeDocId={activeDocId}
              onSelect={setActiveDocId}
              refreshKey={docListRefreshKey}
            />
          </div>
        </header>

        <div className="content-grid">
          <div className="chat-section">
            <ChatBox
              documentId={effectiveDocId}
              sessionId={currentSessionId}
              setSessionId={setCurrentSessionId}
            />
          </div>

          <div className="tools-section">
            <div className="upload-container">
              <DocumentUpload onUploaded={handleUploaded} />
            </div>
            <ToolsPanel documentId={effectiveDocId} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
