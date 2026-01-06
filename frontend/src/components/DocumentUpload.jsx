import React, { useState } from "react";
import { uploadDocument, ingestUrl } from "../api";
import { UploadCloud, Link } from "lucide-react";

const DocumentUpload = ({ onUploaded }) => {
  const [status, setStatus] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setStatus("Uploading PDF...");
    try {
      const res = await uploadDocument(file);
      setStatus("Upload complete");
      setTimeout(() => setStatus(""), 2000);
      onUploaded(res.data.documentId);
    } catch {
      setStatus("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addWebsite = async () => {
    if (!url.trim()) return;
    setUploading(true);
    setStatus("Fetching website...");
    try {
      const res = await ingestUrl(url.trim());
      setStatus("Ingest complete");
      setTimeout(() => setStatus(""), 2000);
      onUploaded(res.data.documentId);
      setUrl("");
    } catch {
      setStatus("Website fetch failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* file upload */}
      <div className="upload-dropzone" onClick={() => document.getElementById('doc-upload-input').click()}>
        <input
          id="doc-upload-input"
          type="file"
          accept="application/pdf"
          onChange={uploadPDF}
          hidden
          disabled={uploading}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <UploadCloud size={20} />
          <span>Click to upload PDF</span>
        </div>
      </div>

      {/* url ingest */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="tool-input"
          placeholder="https://..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={uploading}
          style={{ marginBottom: 0, fontSize: '12px' }}
        />
        <button
          className="action-btn"
          style={{ background: 'var(--bg-surface-hover)', borderRadius: '6px', height: '100%' }}
          onClick={addWebsite}
          disabled={uploading}
        >
          <Link size={16} />
        </button>
      </div>

      {status && <div className="section-label" style={{ color: 'var(--accent-primary)', textAlign: 'center' }}>{status}</div>}
    </div>
  );
};

export default DocumentUpload;
