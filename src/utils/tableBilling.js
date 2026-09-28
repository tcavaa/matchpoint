import { calculateSegmentedPrice } from "./utils";
import { getPingPongRates } from "./rateSettings";

export function getFinalElapsedTimeInSeconds(table) {
  let finalElapsedTimeInSeconds = table.elapsedTimeInSeconds;
  if (table.isRunning && table.timerStartTime) {
    finalElapsedTimeInSeconds += (Date.now() - table.timerStartTime) / 1000;
  }
  return finalElapsedTimeInSeconds;
}

// Price of a table's session. Countdown sessions cost the full purchased time.
// Used by both the table card and Pay & Clear so the saved amount matches what staff see.
export function calculateSessionCost(table, elapsedSeconds, rateSettings) {
  const billedSeconds =
    table.timerMode === "countdown"
      ? table.initialCountdownSeconds || 0
      : elapsedSeconds;
  // Multiply by a per-second rate so cents round exactly as they always have
  const costAtHourlyRate = (hourlyRate) => billedSeconds * (hourlyRate / 3600);
  const equipmentBonus = table.extraEquipment
    ? rateSettings.extraEquipmentHourlyRate
    : 0;
  const hasCustomRate =
    typeof table.hourlyRate === "number" && table.hourlyRate > 0;

  let cost;
  if (table.gameType === "foosball") {
    cost = costAtHourlyRate(rateSettings.foosballHourlyRate);
  } else if (table.gameType === "airhockey") {
    cost = costAtHourlyRate(rateSettings.airHockeyHourlyRate);
  } else if (table.fitPass) {
    cost = billedSeconds * (rateSettings.fitPassPer30Min / 1800);
  } else if (table.gameType === "playstation") {
    cost = costAtHourlyRate(rateSettings.playstationHourlyRate + equipmentBonus);
  } else if (table.gameType === "custom" && hasCustomRate) {
    cost = costAtHourlyRate(table.hourlyRate + equipmentBonus);
  } else {
    const { hourlyRate, saleHourlyRate } = getPingPongRates(table.id, rateSettings);
    const startTimeMs = table.sessionStartTime || Date.now() - elapsedSeconds * 1000;
    cost = parseFloat(
      calculateSegmentedPrice({
        startTimeMs,
        endTimeMs: startTimeMs + billedSeconds * 1000,
        hourlyRate: hourlyRate + equipmentBonus,
        saleFromHour: rateSettings.saleFromHour,
        saleToHour: rateSettings.saleToHour,
        saleHourlyRate: saleHourlyRate + equipmentBonus,
        timezoneOffsetMinutes: 240,
      })
    );
  }
  return Number(cost.toFixed(2));
}

export function calculateBillingSummary({
  table,
  finalElapsedTimeInSeconds,
  rateSettings,
}) {
  let durationForBilling = 0;
  if (table.timerMode === "countdown") {
    durationForBilling = table.initialCountdownSeconds || 0;
  } else {
    durationForBilling = finalElapsedTimeInSeconds;
  }

  const nowMs = Date.now();
  const startTimeMs =
    table.sessionStartTime || nowMs - finalElapsedTimeInSeconds * 1000;
  const purchasedEndMsForCountdown =
    startTimeMs + (table.initialCountdownSeconds || 0) * 1000;
  const standardEndMs = table.isRunning
    ? nowMs
    : table.sessionEndTime || startTimeMs + finalElapsedTimeInSeconds * 1000;
  const endTimeMsForBilling =
    table.timerMode === "countdown" ? purchasedEndMsForCountdown : standardEndMs;

  const amountToPay = calculateSessionCost(
    table,
    finalElapsedTimeInSeconds,
    rateSettings
  );

  return { durationForBilling, amountToPay, endTimeMsForBilling };
}

export function getClearedTableState(table) {
  return {
    ...table,
    name: table.gameType === "custom" ? "Blank Timer" : table.name,
    hourlyRate: table.gameType === "custom" ? null : table.hourlyRate ?? null,
    timerStartTime: null,
    elapsedTimeInSeconds: 0,
    isRunning: false,
    timerMode: "standard",
    initialCountdownSeconds: null,
    sessionStartTime: null,
    sessionEndTime: null,
    fitPass: false,
    extraEquipment: false,
  };
}
