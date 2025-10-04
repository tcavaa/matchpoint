// src/pages/SalesSettingsPage.jsx
import React, { useEffect, useState } from "react";
import { LOCAL_STORAGE_SALES_SETTINGS_KEY } from "../config";
import "./SalesSettingsPage.css";

function SalesSettingsPage() {
  const [saleFromHour, setSaleFromHour] = useState(12);
  const [saleToHour, setSaleToHour] = useState(15);
  const [saleHourlyRate, setSaleHourlyRate] = useState(12);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SALES_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.saleFromHour === "number") setSaleFromHour(parsed.saleFromHour);
        if (typeof parsed.saleToHour === "number") setSaleToHour(parsed.saleToHour);
        if (typeof parsed.saleHourlyRate === "number") setSaleHourlyRate(parsed.saleHourlyRate);
      }
    } catch (e) {
      console.error("Failed to load sales settings:", e);
    }
  }, []);

  const handleSave = () => {
    const payload = {
      saleFromHour: Number(saleFromHour),
      saleToHour: Number(saleToHour),
      saleHourlyRate: Number(saleHourlyRate),
    };
    localStorage.setItem(LOCAL_STORAGE_SALES_SETTINGS_KEY, JSON.stringify(payload));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="sales-settings">
      <h2>Sale Settings</h2>
      <div className="settings-card">
        <div className="settings-row">
          <label className="settings-label">
            From Hour (0–23)
            <input className="settings-input" type="number" min={0} max={23} value={saleFromHour} onChange={(e) => setSaleFromHour(e.target.value)} />
          </label>
          <label className="settings-label">
            To Hour (0–23)
            <input className="settings-input" type="number" min={0} max={24} value={saleToHour} onChange={(e) => setSaleToHour(e.target.value)} />
          </label>
          <label className="settings-label">
            Sale Rate (GEL/hr)
            <input className="settings-input" type="number" min={0} step="0.1" value={saleHourlyRate} onChange={(e) => setSaleHourlyRate(e.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="save-btn" onClick={handleSave}>Save</button>
          {saved && <span className="saved-chip">Saved!</span>}
        </div>
        <p className="help-text">Example: 12 → 15 at 12 GEL/hr means 14:30–15:30 costs 6 GEL (sale) + regular thereafter.</p>
      </div>
    </div>
  );
}

export default SalesSettingsPage;


