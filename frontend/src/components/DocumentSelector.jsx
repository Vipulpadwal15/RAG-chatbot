import React, { useEffect, useState, useRef } from "react";
import { getDocuments, updateDocument, deleteDocument } from "../api";
import { ChevronDown, FileText, Trash, Edit } from "lucide-react";

const DocumentSelector = ({ activeDocId, onSelect, refreshKey }) => {
  const [docs, setDocs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchDocs = async () => {
    try {
      const res = await getDocuments();
      setDocs(res.data || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [refreshKey]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRename = async (e, doc) => {
    e.stopPropagation();
    const newTitle = window.prompt("Rename:", doc.title);
    if (!newTitle?.trim() || newTitle === doc.title) return;
    try {
      await updateDocument(doc._id, { title: newTitle.trim() });
      fetchDocs();
    } catch (err) {
      alert("Failed to rename");
    }
  };

  const handleDelete = async (e, doc) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    try {
      await deleteDocument(doc._id);
      if (String(activeDocId) === String(doc._id)) onSelect("ALL");
      fetchDocs();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const getActiveLabel = () => {
    if (activeDocId === "ALL") return "All Documents";
    const doc = docs.find(d => String(d._id) === String(activeDocId));
    return doc ? doc.title : "Select Document";
  };

  return (
    <div className="doc-selector-container" ref={containerRef}>
      <div className="doc-selector-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>{getActiveLabel()}</span>
        </div>
        <ChevronDown size={14} />
      </div>

      {isOpen && (
        <div className="doc-dropdown">
          {/* All Docs Option */}
          <div
            className={`doc-list-item ${activeDocId === 'ALL' ? 'active' : ''}`}
            onClick={() => { onSelect("ALL"); setIsOpen(false); }}
          >
            <div className="doc-item-header">
              <span className="doc-title">All Documents</span>
            </div>
            <div className="doc-meta">Search across entire knowledge base</div>
          </div>

          <div className="divider" style={{ margin: '8px 0' }} />

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 250, overflowY: 'auto' }}>
            {docs.map(doc => {
              const isActive = String(doc._id) === String(activeDocId);
              return (
                <div
                  key={doc._id}
                  className={`doc-list-item ${isActive ? 'active' : ''}`}
                  onClick={() => { onSelect(doc._id); setIsOpen(false); }}
                >
                  <div className="doc-item-header">
                    <span className="doc-title">{doc.title}</span>
                    {doc.category && <span className="category-tag">{doc.category}</span>}
                  </div>
                  <div className="doc-meta">
                    {doc.chunkCount} chunks
                  </div>
                  <div className="doc-actions">
                    <button className="doc-action-btn" title="Rename" onClick={(e) => handleRename(e, doc)}>
                      <Edit size={10} />
                    </button>
                    <button className="doc-action-btn delete" title="Delete" onClick={(e) => handleDelete(e, doc)}>
                      <Trash size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {docs.length === 0 && (
            <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
              No documents found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;
