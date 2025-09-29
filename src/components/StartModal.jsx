// src/components/StartModal.jsx
import React, { useState } from "react";
import "./StartModal.css";

const StartModal = ({ table, isOpen, onClose, onStart }) => {
  const [mode, setMode] = useState("countdown"); // 'standard' or 'countdown'
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [fitPass, setFitPass] = useState(false);

  if (!isOpen) return null;

  const handleStart = () => {
    onStart(
      table.id,
      mode,
      mode === "countdown" ? parseInt(durationMinutes, 10) : null,
      { fitPass }
    );
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Start Timer for {table.name}</h4>
        <div className="mode-selection">
          <label>
            <input
              type="radio"
              name={`mode-${table.id}`}
              value="standard"
              checked={mode === "standard"}
              onChange={() => setMode("standard")}
            />
            Standard Timer (Count Up)
          </label>
          <label>
            <input
              type="radio"
              name={`mode-${table.id}`}
              value="countdown"
              checked={mode === "countdown"}
              onChange={() => setMode("countdown")}
            />
            Countdown Stopwatch (Count Down)
          </label>
        </div>

        {mode === "countdown" && (
          <div className="duration-input">
            <label htmlFor={`duration-${table.id}`}>Duration (minutes):</label>
            <input
              type="number"
              id={`duration-${table.id}`}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              min="1"
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={fitPass}
              onChange={(e) => setFitPass(e.target.checked)}
            />
            &nbsp;FitPass (30 minutes = 6 GEL)
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={handleStart} className="confirm-start-btn">
            Confirm Start
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartModal;
