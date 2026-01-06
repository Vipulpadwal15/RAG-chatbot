import React, { useState } from "react";
import axios from "axios";
import { Terminal, FileText, PieChart } from "lucide-react";

// Helper for stream reading
const readStream = async (reader, onChunk) => {
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
};

const ToolsPanel = ({ documentId }) => {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const runTool = async (mode, title) => {
    if (!documentId) {
      setOutput("Please select or upload a document first.");
      return;
    }

    setLoading(true);
    setOutput(`Running ${title}...`);

    try {
      if (mode === 'summarize') {
        // Use dedicated endpoint
        const res = await axios.post("http://localhost:5000/api/rag/summarize", {
          documentId
        });
        setOutput(`--- ${title} ---\n${res.data.summary}`);
      } else {
        // Use Chat Endpoint for extraction/analysis
        // We use a specific session ID for tools to not pollute main chat
        const prompt = mode === 'extract'
          ? "Extract the key information, dates, and important entities from this document as a concise bulleted list."
          : "Analyze the sentiment of this document. Categorize it as Positive, Negative, or Neutral and explain your reasoning based on the text.";

        const response = await fetch("http://localhost:5000/api/rag/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: prompt,
            documentId,
            sessionId: "tools-analysis-session",
            useWebSearch: false
          }),
        });

        const reader = response.body.getReader();
        let accumulatedText = "";

        setOutput(`--- ${title} ---\n`);

        await readStream(reader, (chunk) => {
          accumulatedText += chunk;
          setOutput(`--- ${title} ---\n${accumulatedText}`);
        });
      }
    } catch (err) {
      console.error(err);
      setOutput(`Error running ${title}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="tool-group">
        <div className="section-label">Analysis Tools</div>

        <div className="tool-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="new-chat-btn"
            style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', justifyContent: 'flex-start' }}
            onClick={() => runTool("summarize", "Summary")}
            disabled={loading}
          >
            <FileText size={14} /> Summarize Doc
          </button>

          <button
            className="new-chat-btn"
            style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', justifyContent: 'flex-start' }}
            onClick={() => runTool("extract", "Key Info")}
            disabled={loading}
          >
            <Terminal size={14} /> Extract Key Info
          </button>

          <button
            className="new-chat-btn"
            style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', justifyContent: 'flex-start' }}
            onClick={() => runTool("sentiment", "Sentiment")}
            disabled={loading}
          >
            <PieChart size={14} /> Sentiment Analysis
          </button>
        </div>
      </div>

      {output && (
        <div className="tool-group">
          <div className="section-label">Output</div>
          <div className="tool-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: 'var(--text-secondary)', margin: 0, fontFamily: 'JetBrains Mono', lineHeight: 1.5 }}>
              {output}
            </pre>
          </div>
        </div>
      )}
    </>
  );
};

export default ToolsPanel;
