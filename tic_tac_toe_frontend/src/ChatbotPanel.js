import React, { useState, useRef, useEffect } from "react";
import "./ChatbotPanel.css";

/**
 * ChatbotPanel component (slide-out chat panel)
 * Provides minimal, modern interface for chatting with Anthropic AI.
 *
 * Props:
 *   open: Boolean - Whether panel is open
 *   onClose: Function - Callback to close the panel
 */
function ChatbotPanel({ open, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! 👋 I'm Claude, your AI assistant. Ask for rules, tips, or anything else."
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current)
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // PUBLIC_INTERFACE
  const handleSend = async () => {
    if (!userInput.trim()) return;
    setErrMsg("");
    const input = userInput;
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    setUserInput("");
    setLoading(true);
    try {
      const resp = await fetch("/api/anthropic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      if (!resp.ok) {
        let message = "Something went wrong.";
        try {
          const data = await resp.json();
          message = data?.error || message;
        } catch (_) {}
        setErrMsg(message);
        setMessages((msgs) => [
          ...msgs,
          { sender: "bot", text: "Sorry, I'm unavailable (API error)." }
        ]);
      } else {
        const { response } = await resp.json();
        setMessages((msgs) => [...msgs, { sender: "bot", text: response || "..." }]);
      }
    } catch (err) {
      setErrMsg("Unable to connect. Please try again later.");
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Unable to connect, try again later." }
      ]);
    }
    setLoading(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  return (
    <div className={`chatbot-slideout${open ? " open" : ""}`}>
      <div className="chatbot-header">
        <span>AI Chatbot</span>
        <button className="chatbot-close" onClick={onClose} title="Close (Esc)">
          ×
        </button>
      </div>
      <div className="chatbot-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chatbot-msg chatbot-msg-${msg.sender}`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbot-input-bar">
        <input
          type="text"
          placeholder="Ask something..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
          aria-label="Chat input"
        />
        <button
          className="chatbot-send-btn"
          onClick={handleSend}
          disabled={loading || !userInput.trim()}
          aria-label="Send"
        >
          {loading ? "..." : "→"}
        </button>
      </div>
      {errMsg && <div className="chatbot-error">{errMsg}</div>}
      <div className="chatbot-footer">
        <span>
          Powered by Claude (Anthropic)
        </span>
      </div>
    </div>
  );
}

export default ChatbotPanel;
