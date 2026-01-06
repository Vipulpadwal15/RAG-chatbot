import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/rag",
});

// Upload PDF
export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Ask question (documentId can be null => all docs)
export const askQuestion = (question, documentId) =>
  API.post("/chat", { question, documentId });

// Summarize
export const summarizeDoc = (documentId) =>
  API.post("/summarize", { documentId });

// Similarity check
export const similarityCheck = (text, documentId) =>
  API.post("/similarity", { text, documentId });

// List all documents
export const getDocuments = () => API.get("/documents");

// Update a document (rename / tags / category)
export const updateDocument = (id, payload) =>
  API.patch(`/document/${id}`, payload);

// Delete a document
export const deleteDocument = (id) => API.delete(`/document/${id}`);

// 🌐 Ingest website URL
export const ingestUrl = (url) =>
  API.post("/ingest/url", { url });

// 🎥 Ingest YouTube video
export const ingestYoutube = (url) =>
  API.post("/ingest/youtube", { url });
