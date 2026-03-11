// src/components/StartModal.jsx
import React, { useEffect, useState } from "react";
import "./StartModal.css";

const StartModal = ({ table, isOpen, onClose, onStart }) => {
  const isFoosOrHockey = table?.gameType === 'foosball' || table?.gameType === 'airhockey';
  const isPlayStation = table?.gameType === "playstation";
  const isCustomTimer = table?.gameType === "custom";
  const [mode, setMode] = useState("countdown"); // 'standard' or 'countdown'
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [fitPass, setFitPass] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customHourlyRate, setCustomHourlyRate] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!table || !isOpen) return;
    setMode("countdown");
    setDurationMinutes(60);
    setFitPass(false);
    setCustomName(isCustomTimer ? (table.name === "Blank Timer" ? "" : table.name || "") : table.name || "");
    setCustomHourlyRate(
      typeof table.hourlyRate === "number" && table.hourlyRate > 0
        ? String(table.hourlyRate)
        : ""
    );
    setValidationError("");
  }, [table, isOpen, isCustomTimer]);

  if (!isOpen) return null;

  const handleStart = () => {
    if (isCustomTimer) {
      const trimmedName = customName.trim();
      const parsedRate = parseFloat(customHourlyRate);
      if (!trimmedName) {
        setValidationError("Please enter a timer name.");
        return;
      }
      if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
        setValidationError("Please enter a valid hourly rate.");
        return;
      }
    }

    const customOptions = isCustomTimer
      ? {
          customName: customName.trim(),
          customHourlyRate: parseFloat(customHourlyRate),
        }
      : isPlayStation
      ? { customHourlyRate: 20 }
      : {};

    onStart(
      table.id,
      mode,
      mode === "countdown" ? parseInt(durationMinutes, 10) : null,
      {
        fitPass: isFoosOrHockey || isPlayStation || isCustomTimer ? false : fitPass,
        ...customOptions,
      }
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
        {isPlayStation && (
          <div className="duration-input" style={{ marginTop: 8, opacity: 0.9 }}>
            Pricing: 20 GEL per hour
          </div>
        )}
        {isCustomTimer && (
          <>
            <div className="duration-input" style={{ marginTop: 8 }}>
              <label htmlFor={`custom-name-${table.id}`}>Timer Name:</label>
              <input
                id={`custom-name-${table.id}`}
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. VIP Room"
              />
            </div>
            <div className="duration-input" style={{ marginTop: 8 }}>
              <label htmlFor={`custom-rate-${table.id}`}>Cost per hour (GEL):</label>
              <input
                id={`custom-rate-${table.id}`}
                type="number"
                min="0.01"
                step="0.01"
                value={customHourlyRate}
                onChange={(e) => setCustomHourlyRate(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
          </>
        )}
        {isFoosOrHockey && (
          <div className="duration-input" style={{ marginTop: 8, opacity: 0.8 }}>
            Pricing: 12 GEL per hour
          </div>
        )}

        {!isFoosOrHockey && (
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
        )}
        {validationError && (
          <div style={{ color: "#d6336c", fontWeight: 600, marginTop: 8 }}>
            {validationError}
          </div>
        )}

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
