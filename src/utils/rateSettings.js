import {
  LOCAL_STORAGE_RATE_SETTINGS_KEY,
  LOCAL_STORAGE_SALES_SETTINGS_KEY,
} from "../config";
import { branchStorageKey, getActiveBranch } from "../branches";

// Each location (branch) has its own rate settings.
// All prices are in GEL. Sale hours use the 24h clock in Georgia time:
// from is inclusive, to is exclusive, and from > to wraps past midnight.
export const DEFAULT_RATE_SETTINGS = {
  pingPongHourlyRate: 16,
  saleFromHour: 12,
  saleToHour: 15,
  saleHourlyRate: 12,
  foosballHourlyRate: 12,
  airHockeyHourlyRate: 12,
  playstationHourlyRate: 20,
  extraEquipmentHourlyRate: 5,
  fitPassPer30Min: 6,
  // Custom ping-pong prices keyed by table id: { [id]: { hourlyRate, saleHourlyRate } }
  tableRates: {},
};

const RATE_KEYS = [
  "pingPongHourlyRate",
  "saleHourlyRate",
  "foosballHourlyRate",
  "airHockeyHourlyRate",
  "playstationHourlyRate",
  "extraEquipmentHourlyRate",
  "fitPassPer30Min",
];

function toNumberInRange(value, fallback, max = Infinity) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= max ? number : fallback;
}

export function normalizeRateSettings(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const normalized = {};

  RATE_KEYS.forEach((key) => {
    normalized[key] = toNumberInRange(source[key], DEFAULT_RATE_SETTINGS[key]);
  });
  normalized.saleFromHour = toNumberInRange(
    source.saleFromHour,
    DEFAULT_RATE_SETTINGS.saleFromHour,
    23
  );
  normalized.saleToHour = toNumberInRange(
    source.saleToHour,
    DEFAULT_RATE_SETTINGS.saleToHour,
    24
  );

  normalized.tableRates = {};
  const rawTableRates =
    source.tableRates && typeof source.tableRates === "object" ? source.tableRates : {};
  Object.entries(rawTableRates).forEach(([tableId, rates]) => {
    const hourlyRate = toNumberInRange(rates?.hourlyRate, null);
    const saleHourlyRate = toNumberInRange(rates?.saleHourlyRate, null);
    if (hourlyRate !== null && saleHourlyRate !== null) {
      normalized.tableRates[tableId] = { hourlyRate, saleHourlyRate };
    }
  });

  return normalized;
}

export function loadCachedRateSettings(branch = getActiveBranch()) {
  try {
    const raw = localStorage.getItem(branchStorageKey(LOCAL_STORAGE_RATE_SETTINGS_KEY, branch));
    if (raw) return normalizeRateSettings(JSON.parse(raw));
    // Keep sale hours saved by the old Sale Settings page, which every location shared
    const legacySales = localStorage.getItem(LOCAL_STORAGE_SALES_SETTINGS_KEY);
    if (legacySales) return normalizeRateSettings(JSON.parse(legacySales));
  } catch {
    // ignore malformed rate settings in localStorage
  }
  return normalizeRateSettings(null);
}

export function cacheRateSettings(rateSettings, branch = getActiveBranch()) {
  try {
    localStorage.setItem(
      branchStorageKey(LOCAL_STORAGE_RATE_SETTINGS_KEY, branch),
      JSON.stringify(rateSettings)
    );
  } catch {
    // ignore localStorage write errors
  }
}

// Regular and sale hourly rates for a ping-pong table, honouring its custom price.
export function getPingPongRates(tableId, rateSettings) {
  const custom = rateSettings.tableRates[tableId];
  if (custom) return custom;
  return {
    hourlyRate: rateSettings.pingPongHourlyRate,
    saleHourlyRate: rateSettings.saleHourlyRate,
  };
}

// Drops floating point noise for display, e.g. 12.1 + 5 -> 17.1
export const formatRate = (value) => Number(Number(value).toFixed(2));

export const formatHour = (hour) => `${String(hour).padStart(2, "0")}:00`;
