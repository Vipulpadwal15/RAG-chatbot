import React, { useEffect, useState } from "react";
import { getDocuments, updateDocument, deleteDocument } from "../api";

const DocumentSelector = ({ activeDocId, onSelect, refreshKey }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await getDocuments();
      setDocs(res.data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line
  }, [refreshKey]);

  const handleRename = async (doc) => {
    const newTitle = window.prompt("Enter new name for this document:", doc.title);
    if (!newTitle || newTitle.trim() === "" || newTitle === doc.title) return;
    try {
      await updateDocument(doc._id, { title: newTitle.trim() });
      fetchDocs();
    } catch (err) {
      console.error("Rename error:", err);
      alert("Failed to rename document");
    }
  };

  const handleEditTags = async (doc) => {
    const existingTags = (doc.tags || []).join(", ");
    const input = window.prompt(
      "Enter comma-separated tags for this document:",
      existingTags
    );
    if (input === null) return;

    const tags = input
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await updateDocument(doc._id, { tags });
      fetchDocs();
    } catch (err) {
      console.error("Tag update error:", err);
      alert("Failed to update tags");
    }
  };

  const handleDelete = async (doc) => {
    const ok = window.confirm(
      `Delete document "${doc.title}" and all its chunks?`
    );
    if (!ok) return;

    try {
      await deleteDocument(doc._id);
      if (String(activeDocId) === String(doc._id)) {
        onSelect("ALL");
      }
      fetchDocs();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete document");
    }
  };

  const isAllActive = activeDocId === "ALL";

  return (
    <div className="card document-selector-card">
      <h3>📁 Documents</h3>
      {loading && <p style={{ fontSize: "0.9rem" }}>Loading documents...</p>}

      {/* All documents pseudo-option */}
      <div
        onClick={() => onSelect("ALL")}
        style={{
          padding: "6px 10px",
          marginBottom: 6,
          borderRadius: 8,
          cursor: "pointer",
          background: isAllActive
            ? "rgba(0, 245, 212, 0.18)"
            : "rgba(255,255,255,0.03)",
          border: isAllActive
            ? "1px solid #00f5d4"
            : "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.9rem",
        }}
      >
        <div>
          <div style={{ fontWeight: 600 }}>All Documents</div>
          <div style={{ opacity: 0.7, fontSize: "0.8rem" }}>
            Ask across all PDFs together
          </div>
        </div>
        {isAllActive && (
          <span style={{ fontSize: "0.8rem", color: "#00f5d4" }}>Active</span>
        )}
      </div>

      {docs.length === 0 && !loading && (
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          No documents uploaded yet. Upload a PDF to get started.
        </p>
      )}

      {docs.length > 0 && (
        <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 4 }}>
          {docs.map((doc) => {
            const isActive = String(doc._id) === String(activeDocId);
            return (
              <div
                key={doc._id}
                style={{
                  padding: "8px 10px",
                  marginBottom: 6,
                  borderRadius: 8,
                  border: isActive
                    ? "1px solid #00f5d4"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isActive
                    ? "rgba(0, 245, 212, 0.18)"
                    : "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  onClick={() => onSelect(doc._id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{doc.title}</div>
                    <div style={{ opacity: 0.7, fontSize: "0.8rem" }}>
                      {doc.chunkCount} chunks
                      {doc.category && ` · ${doc.category}`}
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: "0.75rem",
                          opacity: 0.9,
                        }}
                      >
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              background: "rgba(0,0,0,0.3)",
                              padding: "2px 6px",
                              borderRadius: 999,
                              marginRight: 4,
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <span style={{ fontSize: "0.8rem", color: "#00f5d4" }}>
                      Active
                    </span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    gap: 6,
                    fontSize: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleRename(doc)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditTags(doc)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                    }}
                  >
                    Tags
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: "0.75rem",
                      background:
                        "linear-gradient(90deg, #f97373, #ef4444)",
                      color: "#fff",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;
