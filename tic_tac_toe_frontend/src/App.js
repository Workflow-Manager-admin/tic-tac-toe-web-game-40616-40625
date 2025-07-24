import React, { useState, useEffect } from "react";
import "./App.css";
import ChatbotPanel from "./ChatbotPanel";

/**
 * App - Main component for Tic Tac Toe game.
 * Modern, minimal and light theme as specified.
 * - 3x3 board
 * - Player turn tracking
 * - Victory/draw detection
 * - Session score tracking
 * - Restart / new game controls
 * 
 * Colors: primary (#1976D2), accent (#FBC02D), secondary (#E3F2FD)
 */

// Helpers
const emptyBoard = () => Array(3).fill(null).map(() => Array(3).fill(null));
const players = { X: "X", O: "O" };

// PUBLIC_INTERFACE
function calculateWinner(board) {
  // Rows
  for (let r = 0; r < 3; r++)
    if (
      board[r][0] &&
      board[r][0] === board[r][1] &&
      board[r][1] === board[r][2]
    )
      return board[r][0];

  // Columns
  for (let c = 0; c < 3; c++)
    if (
      board[0][c] &&
      board[0][c] === board[1][c] &&
      board[1][c] === board[2][c]
    )
      return board[0][c];

  // Diagonals
  if (
    board[0][0] &&
    board[0][0] === board[1][1] &&
    board[1][1] === board[2][2]
  )
    return board[0][0];
  if (
    board[0][2] &&
    board[0][2] === board[1][1] &&
    board[1][1] === board[2][0]
  )
    return board[0][2];

  // Draw detection (no nulls and no winner)
  if (board.every((row) => row.every((cell) => cell)))
    return "draw";
  return null;
}

// Square component (minimal)
function Square({ value, onClick, highlight }) {
  return (
    <button
      className="ttt-square"
      onClick={onClick}
      style={highlight ? { background: "var(--accent)" } : undefined}
      aria-label={value || "empty"}
      tabIndex={0}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function App() {
  // State
  const [board, setBoard] = useState(emptyBoard());
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  // session score as { X: number, O: number, draw: number }
  const [score, setScore] = useState(() =>
    JSON.parse(window.sessionStorage.getItem("ttt-score") || '{"X":0,"O":0,"draw":0}')
  );

  // Check for winner or draw
  useEffect(() => {
    const w = calculateWinner(board);
    setWinner(w);
    // Update session score if game just ended
    if (w && !(board.flat().filter(Boolean).length === 0)) {
      setScore((old) => {
        const updated = { ...old, [w]: (old[w] ?? 0) + 1 };
        window.sessionStorage.setItem("ttt-score", JSON.stringify(updated));
        return updated;
      });
    }
  }, [board]);

  // PUBLIC_INTERFACE
  const handleSquareClick = (r, c) => {
    // Already has winner or square played? Do nothing.
    if (winner || board[r][c]) return;
    const next = xIsNext ? players.X : players.O;
    setBoard((prev) => {
      const clone = prev.map((row) => row.slice());
      clone[r][c] = next;
      return clone;
    });
    setXIsNext((x) => !x);
  };

  // PUBLIC_INTERFACE
  const handleRestart = () => {
    setBoard(emptyBoard());
    setXIsNext((prev) => prev); // Keep same starter, but can easily flip if desired.
    setWinner(null);
  };

  // PUBLIC_INTERFACE
  const handleNewGame = () => {
    setBoard(emptyBoard());
    setXIsNext(true);
    setWinner(null);
    setScore({ X: 0, O: 0, draw: 0 });
    window.sessionStorage.setItem("ttt-score", JSON.stringify({ X: 0, O: 0, draw: 0 }));
  };

  // UI
  let status;
  if (winner === "draw") {
    status = <span style={{ color: "var(--primary)" }}>It&rsquo;s a draw!</span>;
  } else if (winner) {
    status = (
      <span style={{ color: "var(--primary)", fontWeight: 700 }}>
        Player {winner} wins!
      </span>
    );
  } else {
    status = (
      <>
        <span style={{ color: xIsNext ? "var(--primary)" : "var(--accent)", fontWeight: 600 }}>
          Player {xIsNext ? "X" : "O"}'s turn
        </span>
      </>
    );
  }

  // Chatbot integration state
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Keyboard shortcut: Escape closes chatbot
  useEffect(() => {
    if (!chatbotOpen) return;
    function onKey(e) { if (e.key === "Escape") setChatbotOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatbotOpen]);

  return (
    <div className="ttt-app-bg">
      <main className="ttt-main">
        <h1 className="ttt-title">Tic Tac Toe</h1>
        <div className="ttt-score-row">
          <ScoreCard label="X" color="var(--primary)" value={score.X} />
          <ScoreCard label="Draw" color="var(--secondary)" value={score.draw} />
          <ScoreCard label="O" color="var(--accent)" value={score.O} />
        </div>
        <div className="ttt-board-container">
          <div className="ttt-board" role="grid" aria-label="Tic Tac Toe board">
            {board.map((row, r) =>
              row.map((cell, c) => (
                <Square
                  key={r * 3 + c}
                  value={cell}
                  onClick={() => handleSquareClick(r, c)}
                  highlight={winner && isWinningCell(board, r, c, winner)}
                />
              ))
            )}
          </div>
        </div>
        <div className="ttt-status" tabIndex={-1}>
          {status}
        </div>
        <div className="ttt-controls">
          <button className="ttt-btn" onClick={handleRestart}>
            Restart
          </button>
          <button className="ttt-btn secondary" onClick={handleNewGame}>
            New Game (Clear Score)
          </button>
        </div>
        <footer className="ttt-footer">
          <small>
            <span style={{ color: "var(--primary)" }}>Modern Tic Tac Toe&nbsp;</span> |&nbsp;
            <span style={{ color: "#737373" }}>Light Theme, minimal UI</span>
          </small>
        </footer>
      </main>

      {/* Floating Chatbot Access Button */}
      <button
        className="chatbot-fab"
        style={{
          position: "fixed",
          bottom: 28, right: 34,
          zIndex: 11001,
          background: "var(--primary)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 54, height: 54,
          boxShadow: "0 3px 14px rgba(25,118,210,0.11)",
          fontSize: "1.54em",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.17s"
        }}
        title="Chat with AI (Claude)"
        onClick={() => setChatbotOpen(true)}
        aria-label="Open chatbot"
      >
        <svg width="31" height="31" viewBox="0 0 32 32" style={{marginRight:1,minWidth:24}}>
          <circle cx="16" cy="16" r="16" fill="#FBC02D"/>
          <g>
            <ellipse cx="10" cy="15" rx="2" ry="2.3" fill="#fff"/>
            <ellipse cx="22" cy="15" rx="2" ry="2.3" fill="#fff"/>
            <path d="M10 22c3 2 9 2 12 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </g>
        </svg>
      </button>
      <ChatbotPanel open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
}

/**
 * ScoreCard component for session stats.
 * PUBLIC_INTERFACE
 */
function ScoreCard({ label, color, value }) {
  return (
    <div className="ttt-score-card" style={{ borderColor: color }}>
      <div className="ttt-score-label" style={{ color }}>
        {label}
      </div>
      <div className="ttt-score-value">{value}</div>
    </div>
  );
}

// Helper: For highlighting winner cells
function isWinningCell(board, r, c, winnerSymbol) {
  if (winnerSymbol === "draw" || !winnerSymbol) return false;
  // Check row
  if (board[r][0] === winnerSymbol && board[r][1] === winnerSymbol && board[r][2] === winnerSymbol) return true;
  // Check col
  if (board[0][c] === winnerSymbol && board[1][c] === winnerSymbol && board[2][c] === winnerSymbol) return true;
  // Diags
  if (
    ((r === c) && board[0][0] === winnerSymbol && board[1][1] === winnerSymbol && board[2][2] === winnerSymbol) ||
    ((r + c === 2) && board[0][2] === winnerSymbol && board[1][1] === winnerSymbol && board[2][0] === winnerSymbol)
  )
    return true;
  return false;
}

export default App;
