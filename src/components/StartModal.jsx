// src/components/StartModal.jsx
import React, { useEffect, useState } from "react";
import "./StartModal.css";
import StartModalContentFields from "./start-modal/StartModalContentFields";

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
        <StartModalContentFields
          table={table}
          mode={mode}
          setMode={setMode}
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          isPlayStation={isPlayStation}
          isCustomTimer={isCustomTimer}
          customName={customName}
          setCustomName={setCustomName}
          customHourlyRate={customHourlyRate}
          setCustomHourlyRate={setCustomHourlyRate}
          isFoosOrHockey={isFoosOrHockey}
          fitPass={fitPass}
          setFitPass={setFitPass}
          validationError={validationError}
        />

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
