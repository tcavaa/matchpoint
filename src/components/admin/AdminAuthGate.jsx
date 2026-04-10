import React, { useState, useCallback } from "react";
import "./AdminAuthGate.css";

const STORAGE_KEY = "matchpoint_admin_auth";
const CORRECT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

function isAuthenticated() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === CORRECT_PASSWORD && CORRECT_PASSWORD !== "";
  } catch {
    return false;
  }
}

export default function AdminAuthGate({ children }) {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (input === CORRECT_PASSWORD && CORRECT_PASSWORD !== "") {
        sessionStorage.setItem(STORAGE_KEY, input);
        setAuthed(true);
        setError(false);
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setInput("");
      }
    },
    [input]
  );

  if (authed) return children;

  return (
    <div className="admin-gate-overlay">
      <div className={`admin-gate-card${shake ? " admin-gate-shake" : ""}`}>
        <div className="admin-gate-logo">
          <img src="/matchpoint-logo.png" alt="MatchPoint" />
        </div>
        <h2>Staff Access</h2>
        <p>Enter the admin password to continue.</p>
        <form onSubmit={handleSubmit} className="admin-gate-form">
          <input
            type="password"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            autoFocus
            className={error ? "admin-gate-input error" : "admin-gate-input"}
          />
          {error && <p className="admin-gate-error">Incorrect password. Try again.</p>}
          <button type="submit" className="admin-gate-btn">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminLogoutButton() {
  const handleLogout = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <button onClick={handleLogout} className="admin-logout-btn" title="Log out of admin">
      Log out
    </button>
  );
}
