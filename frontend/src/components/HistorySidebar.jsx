import React, { useEffect, useState } from "react";
import axios from "axios";

const HistorySidebar = ({ currentSessionId, onSelectSession, onNewChat }) => {
    const [sessions, setSessions] = useState([]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/rag/history");
            setSessions(res.data);
        } catch (err) {
            console.error("Failed to load history");
        }
    };

    useEffect(() => {
        fetchHistory();
        // Poll every 10s or rely on parent updates ideally, but this is simple
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="history-sidebar">
            <button className="new-chat-btn" onClick={onNewChat}>
                + New Chat
            </button>

            <div className="history-list">
                {sessions.map((sess) => (
                    <div
                        key={sess.sessionId}
                        className={`history-item ${sess.sessionId === currentSessionId ? "active" : ""}`}
                        onClick={() => onSelectSession(sess.sessionId)}
                    >
                        <span className="history-title">{sess.title || "Untitled Chat"}</span>
                        <button
                            className="delete-hist-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!window.confirm("Delete this chat?")) return;
                                axios.delete(`http://localhost:5000/api/rag/history/${sess.sessionId}`)
                                    .then(() => fetchHistory())
                                    .catch(e => console.error(e));
                            }}
                        >
                            🗑
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistorySidebar;
