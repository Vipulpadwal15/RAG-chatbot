import React, { useState } from "react";
import axios from "axios";
import { Terminal, FileText, PieChart, Target, ListTodo, CircleHelp } from "lucide-react";

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
    // Immediate feedback
    setOutput(`--- ${title} ---\nInitializing request...`);

    try {
      if (mode === 'summarize') {
        setOutput(`--- ${title} ---\nReading document and generating summary (this may take a few seconds)...`);

        const res = await axios.post("http://localhost:5000/api/rag/summarize", {
          documentId
        });
        setOutput(`--- ${title} ---\n${res.data.summary}`);
      } else {
        let prompt = "";
        switch (mode) {
          case 'extract':
            prompt = "Extract the key information, dates, and important entities from this document as a concise bulleted list.";
            break;
          case 'sentiment':
            prompt = "Analyze the sentiment of this document. Categorize it as Positive, Negative, or Neutral and explain your reasoning based on the text.";
            break;
          case 'swot':
            prompt = "Conduct a comprehensive SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) based on the content of this document. Format it clearly.";
            break;
          case 'action_plan':
            prompt = "Create a step-by-step tactical action plan or checklist based on the conclusions and recommendations in this document.";
            break;
          case 'quiz':
            prompt = "Generate 5 multiple-choice questions (with answers explaining why) to test a user's understanding of this document.";
            break;
          default:
            prompt = "Analyze this document.";
        }

        setOutput(`--- ${title} ---\nSending request to AI...`);

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

        // Feedback before first chunk
        setOutput(`--- ${title} ---\nAI is thinking... (Receiving stream)`);

        const reader = response.body.getReader();
        let accumulatedText = "";

        await readStream(reader, (chunk) => {
          accumulatedText += chunk;
          setOutput(`--- ${title} ---\n${accumulatedText}`);
        });
      }
    } catch (err) {
      console.error(err);
      setOutput(`Error running ${title}.\nDetails: ${err.message || "Server error"}`);
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

      <div className="tool-group">
        <div className="section-label">Advanced</div>

        <div className="tool-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="new-chat-btn"
            style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', justifyContent: 'flex-start' }}
            onClick={() => runTool("swot", "SWOT Analysis")}
            disabled={loading}
          >
            <Target size={14} /> SWOT Analysis
          </button>

          <button
            className="new-chat-btn"
            style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', justifyContent: 'flex-start' }}
            onClick={() => runTool("action_plan", "Action Plan")}
            disabled={loading}
          >
            <ListTodo size={14} /> Generate Action Plan
          </button>

          <button
            className="new-chat-btn"
            style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', justifyContent: 'flex-start' }}
            onClick={() => runTool("quiz", "Quiz Me")}
            disabled={loading}
          >
            <CircleHelp size={14} /> Quiz Me
          </button>
        </div>
      </div>

      {output && (
        <div className="tool-group">
          <div className="section-label">Output</div>
          <div
            ref={(el) => {
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }
            }}
            className="tool-card"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
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
