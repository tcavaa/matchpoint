import { TABLE_COUNT } from "../config";

function getDefaultTableById(id) {
  const defaults = {
    11: { name: "Foosball", gameType: "foosball", hourlyRate: null },
    12: { name: "Air hockey", gameType: "airhockey", hourlyRate: null },
    13: { name: "PlayStation", gameType: "playstation", hourlyRate: 20 },
    14: { name: "Blank Timer", gameType: "custom", hourlyRate: null },
  };
  const special = defaults[id] || { name: `Table ${id}`, gameType: "pingpong" };
  return {
    id,
    name: special.name,
    timerStartTime: null,
    elapsedTimeInSeconds: 0,
    isRunning: false,
    timerMode: "standard",
    initialCountdownSeconds: null,
    isAvailable: true,
    sessionStartTime: null,
    sessionEndTime: null,
    fitPass: false,
    gameType: special.gameType,
    hourlyRate: special.hourlyRate ?? null,
  };
}

function normalizeStoredTables(parsedTables) {
  return parsedTables.map((table, index) => ({
    id: table.id || index + 1,
    name: table.name || `Table ${table.id || index + 1}`,
    isAvailable: typeof table.isAvailable === "boolean" ? table.isAvailable : true,
    timerStartTime:
      table.isRunning && table.timerStartTime ? table.timerStartTime : null,
    elapsedTimeInSeconds:
      typeof table.elapsedTimeInSeconds === "number" ? table.elapsedTimeInSeconds : 0,
    isRunning: typeof table.isRunning === "boolean" ? table.isRunning : false,
    timerMode: table.timerMode || "standard",
    initialCountdownSeconds:
      typeof table.initialCountdownSeconds === "number"
        ? table.initialCountdownSeconds
        : null,
    sessionStartTime:
      typeof table.sessionStartTime === "number" ? table.sessionStartTime : null,
    sessionEndTime:
      typeof table.sessionEndTime === "number" ? table.sessionEndTime : null,
    fitPass: typeof table.fitPass === "boolean" ? table.fitPass : false,
    gameType: table.gameType || "pingpong",
    hourlyRate: typeof table.hourlyRate === "number" ? table.hourlyRate : null,
  }));
}

function ensureTableCountWithDefaults(normalized) {
  const output = [...normalized];
  if (output.length < TABLE_COUNT) {
    for (let i = output.length; i < TABLE_COUNT; i++) {
      output.push(getDefaultTableById(i + 1));
    }
  }
  return output;
}

function createSpecialTable(id, name, gameType, hourlyRate = null) {
  return {
    ...getDefaultTableById(id),
    name,
    gameType,
    hourlyRate,
  };
}

function enforceGameTableOrder(normalized) {
  const pingpong = normalized.filter((t) => t.gameType === "pingpong").slice(0, 10);
  const foos = normalized.find((t) => t.gameType === "foosball");
  const hockey = normalized.find((t) => t.gameType === "airhockey");
  const playstation = normalized.find((t) => t.gameType === "playstation");
  const custom = normalized.find((t) => t.gameType === "custom");

  const rebuilt = [...pingpong];
  if (foos) rebuilt.push(foos);
  if (hockey) rebuilt.push(hockey);
  if (playstation) rebuilt.push(playstation);
  if (custom) rebuilt.push(custom);

  if (!foos && rebuilt.length < TABLE_COUNT) {
    rebuilt.push(createSpecialTable(rebuilt.length + 1, "Foosball", "foosball"));
  }
  if (!hockey && rebuilt.length < TABLE_COUNT) {
    rebuilt.push(createSpecialTable(rebuilt.length + 1, "Air hockey", "airhockey"));
  }
  if (!playstation && rebuilt.length < TABLE_COUNT) {
    rebuilt.push(createSpecialTable(rebuilt.length + 1, "PlayStation", "playstation", 20));
  }
  if (!custom && rebuilt.length < TABLE_COUNT) {
    rebuilt.push(createSpecialTable(rebuilt.length + 1, "Blank Timer", "custom"));
  }

  return rebuilt.slice(0, TABLE_COUNT);
}

export function buildInitialDefaultTables() {
  return Array.from({ length: TABLE_COUNT }, (_, i) => getDefaultTableById(i + 1));
}

export function buildTablesFromStorage(parsedTables) {
  const normalized = normalizeStoredTables(parsedTables);
  const expanded = ensureTableCountWithDefaults(normalized);
  return enforceGameTableOrder(expanded);
}

