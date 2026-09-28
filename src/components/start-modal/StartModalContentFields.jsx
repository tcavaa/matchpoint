import React from "react";
import { formatHour, formatRate, getPingPongRates } from "../../utils/rateSettings";

export default function StartModalContentFields({
  table,
  rateSettings,
  mode,
  setMode,
  durationMinutes,
  setDurationMinutes,
  isPlayStation,
  isPingPong,
  isCustomTimer,
  customName,
  setCustomName,
  customHourlyRate,
  setCustomHourlyRate,
  isFoosOrHockey,
  fitPass,
  setFitPass,
  extraEquipment,
  setExtraEquipment,
  validationError,
}) {
  const equipmentBonus = extraEquipment ? rateSettings.extraEquipmentHourlyRate : 0;
  const pingPongRates = getPingPongRates(table.id, rateSettings);
  const saleHours = `${formatHour(rateSettings.saleFromHour)}–${formatHour(rateSettings.saleToHour)}`;
  const pingPongPricing = fitPass
    ? `FitPass, ${formatRate(rateSettings.fitPassPer30Min)} GEL per 30 minutes`
    : `${formatRate(pingPongRates.hourlyRate + equipmentBonus)} GEL per hour ` +
      `(${saleHours}: ${formatRate(pingPongRates.saleHourlyRate + equipmentBonus)} GEL per hour)`;
  const foosOrHockeyRate =
    table.gameType === "foosball"
      ? rateSettings.foosballHourlyRate
      : rateSettings.airHockeyHourlyRate;

  return (
    <>
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
        <>
          <div className="duration-input" style={{ marginTop: 8, opacity: 0.9 }}>
            Pricing: {formatRate(rateSettings.playstationHourlyRate + equipmentBonus)} GEL per hour
          </div>
          <div style={{ marginTop: 12 }}>
            <label>
              <input
                type="checkbox"
                checked={extraEquipment}
                onChange={(e) => setExtraEquipment(e.target.checked)}
              />
              &nbsp;+2 Controllers (+{formatRate(rateSettings.extraEquipmentHourlyRate)} GEL/hour)
            </label>
          </div>
        </>
      )}
      {isPingPong && (
        <>
          <div className="duration-input" style={{ marginTop: 8, opacity: 0.9 }}>
            Pricing: {pingPongPricing}
          </div>
          <div style={{ marginTop: 12 }}>
            <label>
              <input
                type="checkbox"
                checked={extraEquipment}
                onChange={(e) => setExtraEquipment(e.target.checked)}
              />
              &nbsp;+2 Rackets (+{formatRate(rateSettings.extraEquipmentHourlyRate)} GEL/hour)
            </label>
          </div>
        </>
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
          Pricing: {formatRate(foosOrHockeyRate)} GEL per hour
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
            &nbsp;FitPass (30 minutes = {formatRate(rateSettings.fitPassPer30Min)} GEL)
          </label>
        </div>
      )}
      {validationError && (
        <div style={{ color: "#d6336c", fontWeight: 600, marginTop: 8 }}>
          {validationError}
        </div>
      )}
    </>
  );
}

