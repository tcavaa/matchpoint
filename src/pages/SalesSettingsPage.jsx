// src/pages/SalesSettingsPage.jsx
import React, { useEffect, useState } from "react";
import { LOCAL_STORAGE_SALES_SETTINGS_KEY } from "../config";

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
    <div style={{ padding: 20 }}>
      <h2>Sales Settings</h2>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <label>
          From Hour (0-23):
          <input type="number" min={0} max={23} value={saleFromHour} onChange={(e) => setSaleFromHour(e.target.value)} />
        </label>
        <label>
          To Hour (0-23):
          <input type="number" min={0} max={24} value={saleToHour} onChange={(e) => setSaleToHour(e.target.value)} />
        </label>
        <label>
          Sale Rate (GEL per hour):
          <input type="number" min={0} step="0.1" value={saleHourlyRate} onChange={(e) => setSaleHourlyRate(e.target.value)} />
        </label>
        <button onClick={handleSave}>Save</button>
        {saved && <span>Saved!</span>}
      </div>
      <p>Example: 12 to 15 at 12 GEL/hr means 14:30–15:30 costs 6 + regular thereafter.</p>
    </div>
  );
}

export default SalesSettingsPage;


