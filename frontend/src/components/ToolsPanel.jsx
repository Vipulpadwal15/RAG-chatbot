import React, { useState } from "react";
import { summarizeDoc, similarityCheck } from "../api";

const ToolsPanel = ({ documentId }) => {
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSim, setLoadingSim] = useState(false);
  const [error, setError] = useState(null);

  // Re-added missing state
  const [summary, setSummary] = useState("");
  const [simText, setSimText] = useState("");
  const [similarityResults, setSimilarityResults] = useState([]);

  const handleSummarize = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const res = await summarizeDoc(documentId);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setError("Failed to generate summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSimilarity = async () => {
    if (!simText.trim()) return;
    setLoadingSim(true);
    setError(null);
    try {
      const res = await similarityCheck(simText, documentId);
      setSimilarityResults(res.data.results || []);
    } catch (err) {
      console.error(err);
      setError("Failed to check similarity.");
    } finally {
      setLoadingSim(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: "15px" }}>🛠 Tools</h3>

      {/* Summary Section */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleSummarize}
          disabled={loadingSummary}
          className="tool-btn"
        >
          {loadingSummary ? "Generating..." : "📄 Summarize Document"}
        </button>

        {summary && (
          <div className="tool-output">
            <h4>Summary</h4>
            <div className="scroll-box">
              {summary}
            </div>
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* Similarity Section */}
      <div>
        <h4 style={{ marginBottom: "8px" }}>Plagiarism / Similarity</h4>
        <textarea
          rows={3}
          className="tool-input"
          placeholder="Paste text to check..."
          value={simText}
          onChange={(e) => setSimText(e.target.value)}
        />
        <button
          onClick={handleSimilarity}
          disabled={loadingSim}
          className="tool-btn"
        >
          {loadingSim ? "Checking..." : "🔍 Check Similarity"}
        </button>

        {similarityResults.length > 0 && (
          <div className="tool-output">
            <h4>Matches Found:</h4>
            <div className="scroll-box">
              {similarityResults.map((r, i) => (
                <div key={i} className="sim-item">
                  <div className="sim-header">
                    <strong>#{i + 1}</strong> <span>{(r.similarity * 100).toFixed(1)}% match</span>
                  </div>
                  <p>{r.chunk}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}
    </div>
  );
};

export default ToolsPanel;
