// src/pages/RateSettingsPage.jsx
import React, { useEffect, useState } from "react";
import TableRatesList from "../components/rate-settings/TableRatesList";
import "./RateSettingsPage.css";

const RATE_LABELS = {
  pingPongHourlyRate: "Ping-pong regular rate",
  saleHourlyRate: "Ping-pong sale rate",
  foosballHourlyRate: "Foosball rate",
  airHockeyHourlyRate: "Air hockey rate",
  playstationHourlyRate: "PlayStation rate",
  extraEquipmentHourlyRate: "Extra rackets / controllers price",
  fitPassPer30Min: "FitPass price",
};

function toFormState(rateSettings) {
  const form = {
    saleFromHour: String(rateSettings.saleFromHour),
    saleToHour: String(rateSettings.saleToHour),
    tableRates: {},
  };
  Object.keys(RATE_LABELS).forEach((key) => {
    form[key] = String(rateSettings[key]);
  });
  Object.entries(rateSettings.tableRates).forEach(([tableId, rates]) => {
    form.tableRates[tableId] = {
      hourlyRate: String(rates.hourlyRate),
      saleHourlyRate: String(rates.saleHourlyRate),
    };
  });
  return form;
}

function parseNumber(value, max = Infinity) {
  if (String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= max ? number : null;
}

function parseForm(form, tableNames) {
  const settings = { tableRates: {} };

  for (const [key, label] of Object.entries(RATE_LABELS)) {
    settings[key] = parseNumber(form[key]);
    if (settings[key] === null) return { error: `${label} must be a number, 0 or more.` };
  }

  settings.saleFromHour = parseNumber(form.saleFromHour, 23);
  settings.saleToHour = parseNumber(form.saleToHour, 24);
  if (!Number.isInteger(settings.saleFromHour)) {
    return { error: "Sale start hour must be a whole number from 0 to 23." };
  }
  if (!Number.isInteger(settings.saleToHour)) {
    return { error: "Sale end hour must be a whole number from 0 to 24." };
  }
  if (settings.saleFromHour === settings.saleToHour) {
    return { error: "Sale start and end hours must be different." };
  }

  for (const [tableId, rates] of Object.entries(form.tableRates)) {
    const hourlyRate = parseNumber(rates.hourlyRate);
    const saleHourlyRate = parseNumber(rates.saleHourlyRate);
    if (hourlyRate === null || saleHourlyRate === null) {
      return {
        error: `Enter both prices for ${tableNames[tableId] || `table ${tableId}`}.`,
      };
    }
    settings.tableRates[tableId] = { hourlyRate, saleHourlyRate };
  }

  return { settings };
}

function NumberField({ label, value, onChange, max, step = "0.01" }) {
  return (
    <label className="settings-label">
      {label}
      <input
        className="settings-input"
        type="number"
        inputMode="decimal"
        min={0}
        max={max}
        step={step}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function RateSettingsPage({ rateSettings, onSave, tables, branchConfig }) {
  const [form, setForm] = useState(() => toFormState(rateSettings));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  // Pick up prices saved on another device, unless there are unsaved edits here
  useEffect(() => {
    if (!isDirty) setForm(toFormState(rateSettings));
  }, [rateSettings, isDirty]);

  useEffect(() => {
    if (status?.type !== "success") return undefined;
    const timeoutId = setTimeout(() => setStatus(null), 2000);
    return () => clearTimeout(timeoutId);
  }, [status]);

  const pingPongTables = tables
    .filter((table) => table.gameType === "pingpong")
    .sort((a, b) => a.id - b.id);

  const editForm = (update) => {
    setForm(update);
    setIsDirty(true);
    setStatus(null);
  };

  const updateField = (key) => (value) => {
    editForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTableRate = (tableId, isCustom) => {
    editForm((prev) => {
      const tableRates = { ...prev.tableRates };
      if (isCustom) {
        // Start from the current default prices
        tableRates[tableId] = {
          hourlyRate: prev.pingPongHourlyRate,
          saleHourlyRate: prev.saleHourlyRate,
        };
      } else {
        delete tableRates[tableId];
      }
      return { ...prev, tableRates };
    });
  };

  const updateTableRate = (tableId, key, value) => {
    editForm((prev) => ({
      ...prev,
      tableRates: {
        ...prev.tableRates,
        [tableId]: { ...prev.tableRates[tableId], [key]: value },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const tableNames = Object.fromEntries(pingPongTables.map((t) => [t.id, t.name]));
    const { settings, error } = parseForm(form, tableNames);
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    setIsSaving(true);
    try {
      const isSynced = await onSave(settings);
      setStatus(
        isSynced
          ? { type: "success", message: "Saved!" }
          : { type: "warning", message: "Saved on this device only (Supabase is not configured)." }
      );
    } catch (saveError) {
      console.error("Failed to sync rate settings:", saveError);
      setStatus({
        type: "warning",
        message:
          "Saved on this device, but other devices were not updated. Check the connection and that " +
          `supabase/schema_rate_settings.sql has been run in Supabase (${saveError?.message || "unknown error"}).`,
      });
    } finally {
      setIsDirty(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="rate-settings">
      <h2>Rate Settings</h2>
      <p className="rate-settings-scope">
        Prices for <strong>{branchConfig.label}</strong>. Each location has its own rates.
      </p>
      <form className="rate-settings-form" onSubmit={handleSubmit}>
        <section className="settings-card">
          <h3 className="rate-section-title">Ping-pong</h3>
          <div className="settings-row">
            <NumberField
              label="Regular rate (GEL/hr)"
              value={form.pingPongHourlyRate}
              onChange={updateField("pingPongHourlyRate")}
            />
          </div>
          <h4 className="rate-subsection-title">Sale hours</h4>
          <div className="settings-row">
            <NumberField
              label="From hour (0–23)"
              value={form.saleFromHour}
              onChange={updateField("saleFromHour")}
              max={23}
              step="1"
            />
            <NumberField
              label="To hour (0–24)"
              value={form.saleToHour}
              onChange={updateField("saleToHour")}
              max={24}
              step="1"
            />
            <NumberField
              label="Sale rate (GEL/hr)"
              value={form.saleHourlyRate}
              onChange={updateField("saleHourlyRate")}
            />
          </div>
          <p className="help-text">
            Example: 12 → 15 at 12 GEL/hr means 14:30–15:30 costs 6 GEL (sale) + regular thereafter.
          </p>
        </section>

        <section className="settings-card">
          <h3 className="rate-section-title">Ping-pong tables</h3>
          <p className="help-text rate-table-help">
            Tick a table to give it its own price. Unticked tables use the ping-pong rates above.
          </p>
          <TableRatesList
            tables={pingPongTables}
            tableRates={form.tableRates}
            defaultHourlyRate={form.pingPongHourlyRate}
            defaultSaleHourlyRate={form.saleHourlyRate}
            onToggle={toggleTableRate}
            onChange={updateTableRate}
          />
        </section>

        {!branchConfig.pingPongOnly && (
          <section className="settings-card">
            <h3 className="rate-section-title">Other games</h3>
            <div className="settings-row">
              <NumberField
                label="Foosball (GEL/hr)"
                value={form.foosballHourlyRate}
                onChange={updateField("foosballHourlyRate")}
              />
              <NumberField
                label="Air hockey (GEL/hr)"
                value={form.airHockeyHourlyRate}
                onChange={updateField("airHockeyHourlyRate")}
              />
              <NumberField
                label="PlayStation (GEL/hr)"
                value={form.playstationHourlyRate}
                onChange={updateField("playstationHourlyRate")}
              />
            </div>
          </section>
        )}

        <section className="settings-card">
          <h3 className="rate-section-title">Extras</h3>
          <div className="settings-row">
            <NumberField
              label={
                branchConfig.pingPongOnly
                  ? "+2 rackets (GEL/hr)"
                  : "+2 rackets / controllers (GEL/hr)"
              }
              value={form.extraEquipmentHourlyRate}
              onChange={updateField("extraEquipmentHourlyRate")}
            />
            <NumberField
              label="FitPass (GEL per 30 min)"
              value={form.fitPassPer30Min}
              onChange={updateField("fitPassPer30Min")}
            />
          </div>
        </section>

        <div className="rate-settings-actions">
          <button type="submit" className="save-btn" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          {status?.type === "success" && <span className="saved-chip">{status.message}</span>}
          {status && status.type !== "success" && (
            <span className={`rate-status rate-status-${status.type}`} role="alert">
              {status.message}
            </span>
          )}
          {!status && (
            <span className="rate-settings-note">
              {isDirty ? "You have unsaved changes." : "New prices apply right away, including running sessions."}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default RateSettingsPage;
