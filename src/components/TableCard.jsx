// src/components/TableCard.jsx
import React, { useState } from "react";
import { formatTime, calculateCost, calculateSegmentedPrice } from "../utils/utils";
import "./TableCard.css"; // Ensure this CSS is updated or styles are fine
import SwitchToggle from "./SwitchToggle";
import { HOURLY_RATE, LOCAL_STORAGE_SALES_SETTINGS_KEY } from "../config";

const TableCard = ({ table, onOpenStartModal, onStop, onPayAndClear, handleToggleAvailability, onTransferTimer }) => {
  const {
    name,
    isAvailable,
    timerStartTime,
    elapsedTimeInSeconds,
    isRunning,
    timerMode,
    initialCountdownSeconds,
    sessionStartTime,
    fitPass,
  } = table;
  
  let displayTimeSeconds = 0;
  let currentCost = "0.00";
  let sessionCost = "0.00"; // Cost for the entire session (especially for countdown)

  // Load sales settings with defaults
  let sales = { saleFromHour: 12, saleToHour: 15, saleHourlyRate: 12 };
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SALES_SETTINGS_KEY);
    if (raw) sales = { ...sales, ...JSON.parse(raw) };
  } catch {}

  if (timerMode === "countdown") {
    const totalPassedTime =
      isRunning && timerStartTime
        ? elapsedTimeInSeconds + (Date.now() - timerStartTime) / 1000
        : elapsedTimeInSeconds;
    displayTimeSeconds = initialCountdownSeconds
      ? initialCountdownSeconds - totalPassedTime
      : 0;
    if (fitPass) {
      const ratePerSecond = 6 / (30 * 60);
      sessionCost = ((initialCountdownSeconds || 0) * ratePerSecond).toFixed(2);
    } else {
      const startMs = sessionStartTime || Date.now();
      const endMs = (sessionStartTime || Date.now()) + (initialCountdownSeconds || 0) * 1000;
      sessionCost = calculateSegmentedPrice({
        startTimeMs: startMs,
        endTimeMs: endMs,
        hourlyRate: HOURLY_RATE,
        saleFromHour: sales.saleFromHour,
        saleToHour: sales.saleToHour,
        saleHourlyRate: sales.saleHourlyRate,
      });
    }
    currentCost = sessionCost; // For countdown, cost is fixed
    if (isRunning && displayTimeSeconds < 0) displayTimeSeconds = 0; // Don't show negative time
  } else {
    // Standard timer
    displayTimeSeconds =
      isRunning && timerStartTime
        ? elapsedTimeInSeconds + (Date.now() - timerStartTime) / 1000
        : elapsedTimeInSeconds;
    if (fitPass) {
      const ratePerSecond = 6 / (30 * 60);
      currentCost = (displayTimeSeconds * ratePerSecond).toFixed(2);
    } else {
      const startMs = sessionStartTime || Date.now() - displayTimeSeconds * 1000;
      const endMs = isRunning ? Date.now() : startMs + displayTimeSeconds * 1000;
      currentCost = calculateSegmentedPrice({
        startTimeMs: startMs,
        endTimeMs: endMs,
        hourlyRate: HOURLY_RATE,
        saleFromHour: sales.saleFromHour,
        saleToHour: sales.saleToHour,
        saleHourlyRate: sales.saleHourlyRate,
      });
    }
    sessionCost = currentCost;
  }

  const canStart =
    !isRunning &&
    (!initialCountdownSeconds ||
      displayTimeSeconds <= 0 ||
      timerMode === "standard");
  // Pay & Clear is available if time has run or a countdown was set
  const canPayAndClear =
    (timerMode === "standard" && (elapsedTimeInSeconds > 0 || isRunning)) ||
    (timerMode === "countdown" && initialCountdownSeconds > 0);

  const isCountdownEnded =
    timerMode === "countdown" && !isRunning && displayTimeSeconds <= 0;

  if (!isAvailable)
    return (
      <div
        style={{
          position: "relative",
          backgroundColor: "#ced4da",
          color: "darkGray",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "8px 8px 0px gray",
          display: "flex",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            margin: "0 0 10px 0",
            fontSize: "2em",
            fontWeight: "700",
            textTransform: "uppercase",
          }}
        >
          <div>{name}</div>
        </h3>
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <SwitchToggle isAvailable={isAvailable} tableId={table.id} handleToggleAvailability={handleToggleAvailability} />
        </div>
      </div>
    );

  const handleDragStart = (e) => {
    // mark source table id
    e.dataTransfer.setData("text/plain", String(table.id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fromIdStr = e.dataTransfer.getData("text/plain");
    const fromId = parseInt(fromIdStr, 10);
    if (!Number.isFinite(fromId)) return;
    if (fromId === table.id) return;
    if (typeof onTransferTimer === 'function') {
      onTransferTimer(fromId, table.id);
    }
  };

  return (
    <div
      className={`table-card ${isRunning ? "running" : ""} ${
        timerMode === "countdown" ? "countdown-mode" : ""
      } `}
      draggable={isRunning || elapsedTimeInSeconds > 0 || (timerMode === 'countdown' && initialCountdownSeconds > 0)}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      title="Drag to another table to transfer the timer"
    >
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <SwitchToggle isAvailable={isAvailable} tableId={table.id} handleToggleAvailability={handleToggleAvailability} />
      </div>
      <h3>
        <div>{name}</div>
      </h3>
      <div className="timer-mode-display">
        Mode:{" "}
        {timerMode === "countdown"
          ? `Countdown (${formatTime(initialCountdownSeconds || 0)})`
          : "Standard Timer"}
      </div>
      {isCountdownEnded ? (
        <div className="timer-ended-indicator">Time's Up!</div>
      ) : (
        <div className="timer-display">{formatTime(displayTimeSeconds)}</div>
      )}
      <div className="cost-display">
        {timerMode === "countdown" && initialCountdownSeconds > 0
          ? `Session Cost: ${sessionCost} GEL`
          : `Current Cost: ${currentCost} GEL`}
      </div>
      <div className="controls">
        {canStart && (
          <button
            onClick={() => onOpenStartModal(table.id)}
            className="start-btn"
          >
            Start
          </button>
        )}
        {isRunning && (
          <button onClick={() => onStop(table.id)} className="stop-btn">
            Stop
          </button>
        )}
        <button
          onClick={() => onPayAndClear(table.id)}
          className="pay-clear-btn"
          disabled={!canPayAndClear}
        >
          Pay & Clear
        </button>
      </div>
    </div>
  );
};

export default TableCard;
