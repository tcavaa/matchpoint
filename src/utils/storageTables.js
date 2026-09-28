import { getBranchConfig, DEFAULT_BRANCH } from "../branches";

const PING_PONG_COUNT = 10;
const FOOSBALL_ID = 11;
const AIR_HOCKEY_ID = 12;
const PLAYSTATION_ID = 13;
const CUSTOM_ID = 14;

const SPECIAL_DEFAULTS = {
  [FOOSBALL_ID]: { name: "Foosball", gameType: "foosball", hourlyRate: null },
  [AIR_HOCKEY_ID]: { name: "Air hockey", gameType: "airhockey", hourlyRate: null },
  [PLAYSTATION_ID]: { name: "PlayStation", gameType: "playstation", hourlyRate: null },
  [CUSTOM_ID]: { name: "Blank Timer", gameType: "custom", hourlyRate: null },
};

function getDefaultTableById(id, pingPongOnly = false) {
  // Ping-pong-only branches never get the special game tables.
  const special = (!pingPongOnly && SPECIAL_DEFAULTS[id]) || { name: `Table ${id}`, gameType: "pingpong" };
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
    extraEquipment: false,
    gameType: special.gameType,
    hourlyRate: special.hourlyRate ?? null,
  };
}

const LEGACY_GAMETYPE_TO_NEW_ID = {
  foosball: FOOSBALL_ID,
  airhockey: AIR_HOCKEY_ID,
  playstation: PLAYSTATION_ID,
  custom: CUSTOM_ID,
};

// Migrates old localStorage shape where specials lived at ids 9-12
// (8 ping-pong + 4 specials) to the new shape where specials live at 11-14
// and ping-pong occupies 1-10.
function remapLegacySpecialIds(parsedTables) {
  if (!Array.isArray(parsedTables)) return parsedTables;
  const hasLegacy = parsedTables.some(
    (t) =>
      t &&
      typeof t.id === "number" &&
      t.id >= 9 && t.id <= 12 &&
      t.gameType &&
      t.gameType !== "pingpong" &&
      LEGACY_GAMETYPE_TO_NEW_ID[t.gameType] &&
      LEGACY_GAMETYPE_TO_NEW_ID[t.gameType] !== t.id
  );
  if (!hasLegacy) return parsedTables;
  return parsedTables.map((t) => {
    if (!t) return t;
    const targetId = t.gameType ? LEGACY_GAMETYPE_TO_NEW_ID[t.gameType] : undefined;
    if (targetId && t.id !== targetId && t.gameType !== "pingpong") {
      return { ...t, id: targetId };
    }
    return t;
  });
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
    extraEquipment:
      typeof table.extraEquipment === "boolean" ? table.extraEquipment : false,
    gameType: table.gameType || "pingpong",
    hourlyRate: typeof table.hourlyRate === "number" ? table.hourlyRate : null,
  }));
}

// Fills in any MISSING ids in [1..tableCount] with sensible defaults.
// Looking at id presence (not array length) prevents duplicates and
// recovers tables that were dropped by an earlier broken slice/migration.
function ensureTableCountWithDefaults(normalized, cfg) {
  const byId = new Map();
  normalized.forEach((t) => {
    if (t && typeof t.id === "number" && !byId.has(t.id)) {
      byId.set(t.id, t);
    }
  });
  for (let id = 1; id <= cfg.tableCount; id++) {
    if (!byId.has(id)) {
      byId.set(id, getDefaultTableById(id, cfg.pingPongOnly));
    }
  }
  return Array.from(byId.values());
}

function enforcePingPongOnlyOrder(normalized, cfg) {
  const pingpong = normalized
    .filter((t) => t.gameType === "pingpong")
    .sort((a, b) => a.id - b.id)
    .slice(0, cfg.tableCount);
  const rebuilt = [...pingpong];
  while (rebuilt.length < cfg.tableCount) {
    rebuilt.push(getDefaultTableById(rebuilt.length + 1, true));
  }
  return rebuilt.slice(0, cfg.tableCount);
}

function enforceFullGameTableOrder(normalized, cfg) {
  const pingpong = normalized
    .filter((t) => t.gameType === "pingpong")
    .sort((a, b) => a.id - b.id)
    .slice(0, PING_PONG_COUNT);
  const foos = normalized.find((t) => t.gameType === "foosball");
  const hockey = normalized.find((t) => t.gameType === "airhockey");
  const playstation = normalized.find((t) => t.gameType === "playstation");
  const custom = normalized.find((t) => t.gameType === "custom");

  const rebuilt = [...pingpong];
  if (foos) rebuilt.push(foos);
  if (hockey) rebuilt.push(hockey);
  if (playstation) rebuilt.push(playstation);
  if (custom) rebuilt.push(custom);

  if (!foos && rebuilt.length < cfg.tableCount) {
    rebuilt.push(getDefaultTableById(FOOSBALL_ID));
  }
  if (!hockey && rebuilt.length < cfg.tableCount) {
    rebuilt.push(getDefaultTableById(AIR_HOCKEY_ID));
  }
  if (!playstation && rebuilt.length < cfg.tableCount) {
    rebuilt.push(getDefaultTableById(PLAYSTATION_ID));
  }
  if (!custom && rebuilt.length < cfg.tableCount) {
    rebuilt.push(getDefaultTableById(CUSTOM_ID));
  }

  return rebuilt.slice(0, cfg.tableCount);
}

function enforceGameTableOrder(normalized, cfg) {
  return cfg.pingPongOnly
    ? enforcePingPongOnlyOrder(normalized, cfg)
    : enforceFullGameTableOrder(normalized, cfg);
}

export function buildInitialDefaultTables(branch = DEFAULT_BRANCH) {
  const cfg = getBranchConfig(branch);
  return Array.from({ length: cfg.tableCount }, (_, i) =>
    getDefaultTableById(i + 1, cfg.pingPongOnly)
  );
}

export function buildTablesFromStorage(parsedTables, branch = DEFAULT_BRANCH) {
  const cfg = getBranchConfig(branch);
  const remapped = cfg.pingPongOnly ? parsedTables : remapLegacySpecialIds(parsedTables);
  const normalized = normalizeStoredTables(remapped);
  const expanded = ensureTableCountWithDefaults(normalized, cfg);
  return enforceGameTableOrder(expanded, cfg);
}
