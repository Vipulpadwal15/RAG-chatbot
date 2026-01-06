import React, { useState } from "react";
import { uploadDocument, ingestUrl } from "../api";

const DocumentUpload = ({ onUploaded }) => {
  const [file,setFile] = useState(null);
  const [status,setStatus] = useState("");
  const [url,setUrl] = useState("");
  const [msg,setMsg] = useState("");

  const uploadPDF = async()=>{
    if(!file) return setStatus("Choose PDF first");
    try{
      const res = await uploadDocument(file);
      setStatus(res.data.message);
      onUploaded(res.data.documentId);
    }catch{
      setStatus("Upload failed");
    }
  };

  const addWebsite = async()=>{
    if(!url.trim()) return setMsg("Enter URL");
    try{
      const res = await ingestUrl(url.trim());
      setMsg(res.data.message);
      onUploaded(res.data.documentId);
    }catch{
      setMsg("Website fetch failed");
    }
  };

  return (
    <div className="card">
      <h3>Upload Document</h3>
      <input type="file" accept="application/pdf"
        onChange={e=>setFile(e.target.files[0])} />
      <button onClick={uploadPDF}>Upload PDF</button>
      {status && <p>{status}</p>}

      <hr/>

      <h3>Ingest Website</h3>
      <input type="text" placeholder="https://example.com"
        value={url} onChange={e=>setUrl(e.target.value)}/>
      <button onClick={addWebsite}>Fetch Website</button>
      {msg && <p>{msg}</p>}
    </div>
  );
};

export default DocumentUpload;
