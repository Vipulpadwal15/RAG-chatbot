import React, { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

const HistorySidebar = ({ currentSessionId, onSelectSession, onNewChat }) => {
    const [sessions, setSessions] = useState([]);

    const fetchSessions = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/rag/history");
            // Expecting [{ sessionId, messages: [...] }, ...]
            // Sort by newest
            const sorted = (res.data || []).reverse();
            setSessions(sorted);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [currentSessionId]); // reload if session changes (e.g. new chat created)

    const handleDelete = async (e, sessId) => {
        e.stopPropagation();
        if (!window.confirm("Delete this chat?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/rag/history/${sessId}`);
            // If deleted active session, switch to null
            if (sessId === currentSessionId) {
                onNewChat();
            }
            fetchSessions();
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    return (
        <div className="history-sidebar">
            <div className="new-chat-btn-container">
                <button className="new-chat-btn" onClick={onNewChat}>
                    <Plus size={16} /> New Chat
                </button>
            </div>

            <div className="section-label" style={{ padding: '20px 24px 8px' }}>Recents</div>

            <div className="history-list">
                {sessions.map((sess) => {
                    const firstMsg = sess.title || "New Conversation";
                    const isActive = sess.sessionId === currentSessionId;

                    return (
                        <div
                            key={sess.sessionId}
                            className={`history-item ${isActive ? "active" : ""}`}
                            onClick={() => onSelectSession(sess.sessionId)}
                        >
                            <MessageSquare size={14} style={{ opacity: isActive ? 1 : 0.5 }} />
                            <span className="history-title">{firstMsg}</span>

                            <button
                                className="delete-hist-btn"
                                onClick={(e) => handleDelete(e, sess.sessionId)}
                                title="Delete Chat"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    );
                })}

                {sessions.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                        No history
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorySidebar;
