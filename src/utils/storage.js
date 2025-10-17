import { v4 as uuidv4 } from "uuid";
import { TABLE_COUNT, LOCAL_STORAGE_TABLES_KEY, LOCAL_STORAGE_HISTORY_KEY, LOCAL_STORAGE_SALES_SETTINGS_KEY } from "../config";
import { TIMER_MODES } from "./constants";

export function initializeTables() {
  const storedTables = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
    if (storedTables) {
      try {
        const parsedTables = JSON.parse(storedTables);
        const normalized = parsedTables.map((table, index) => ({
          id: table.id || (index + 1), // Ensure ID exists (prefer numeric sequence)
          name: table.name || `Table ${table.id || index + 1}`,
          isAvailable: typeof table.isAvailable === 'boolean' ? table.isAvailable : true,
          timerStartTime:
            table.isRunning && table.timerStartTime ? table.timerStartTime : null,
          elapsedTimeInSeconds:
            typeof table.elapsedTimeInSeconds === "number"
              ? table.elapsedTimeInSeconds
              : 0,
          isRunning:
            typeof table.isRunning === "boolean" ? table.isRunning : false,
          timerMode: table.timerMode || "standard",
          initialCountdownSeconds:
            typeof table.initialCountdownSeconds === "number"
              ? table.initialCountdownSeconds
              : null,
          // new fields for pricing logic
          sessionStartTime:
            typeof table.sessionStartTime === "number" ? table.sessionStartTime : null,
          fitPass: typeof table.fitPass === "boolean" ? table.fitPass : false,
          gameType: table.gameType || 'pingpong',
        }));

        // If fewer tables are stored than configured, append new defaults up to TABLE_COUNT
        if (normalized.length < TABLE_COUNT) {
          for (let i = normalized.length; i < TABLE_COUNT; i++) {
            const id = i + 1;
            const defaults = {
              10: { name: 'Foosball', gameType: 'foosball' },
              11: { name: 'Air hockey', gameType: 'airhockey' },
            };
            const special = defaults[id] || { name: `Table ${id}`, gameType: 'pingpong' };
            normalized.push({
              id,
              name: special.name,
              timerStartTime: null,
              elapsedTimeInSeconds: 0,
              isRunning: false,
              timerMode: "standard",
              initialCountdownSeconds: null,
              isAvailable: true,
              sessionStartTime: null,
              fitPass: false,
              gameType: special.gameType,
            });
          }
        }

        // Ensure at most 8 pingpong tables; keep foosball and airhockey; drop pool
        let pingpong = normalized.filter(t => t.gameType === 'pingpong');
        const foos = normalized.find(t => t.gameType === 'foosball');
        const hockey = normalized.find(t => t.gameType === 'airhockey');

        // limit pingpong to 8
        pingpong = pingpong.slice(0, 8);

        // rebuild in order: pingpong(8) + foos + hockey, then trim/pad to TABLE_COUNT
        let rebuilt = [...pingpong];
        if (foos) rebuilt.push(foos);
        if (hockey) rebuilt.push(hockey);

        // If one of foos/hockey is missing, append defaults to ensure presence
        if (!foos && rebuilt.length < TABLE_COUNT) {
          rebuilt.push({
            id: rebuilt.length + 1,
            name: 'Foosball',
            timerStartTime: null,
            elapsedTimeInSeconds: 0,
            isRunning: false,
            timerMode: 'standard',
            initialCountdownSeconds: null,
            isAvailable: true,
            sessionStartTime: null,
            fitPass: false,
            gameType: 'foosball',
          });
        }
        if (!hockey && rebuilt.length < TABLE_COUNT) {
          rebuilt.push({
            id: rebuilt.length + 1,
            name: 'Air hockey',
            timerStartTime: null,
            elapsedTimeInSeconds: 0,
            isRunning: false,
            timerMode: 'standard',
            initialCountdownSeconds: null,
            isAvailable: true,
            sessionStartTime: null,
            fitPass: false,
            gameType: 'airhockey',
          });
        }

        let migrated = rebuilt.slice(0, TABLE_COUNT);
        try {
          localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(migrated));
        } catch {}

        return migrated;
      } catch (e) {
        console.error("Error parsing stored tables in initializeTables:", e);
      }
    }
    return Array.from({ length: TABLE_COUNT }, (_, i) => {
      const id = i + 1;
      // Default 1-8 ping pong; 9 foosball; 10 air hockey
      const defaults = {
          9: { name: 'Foosball', gameType: 'foosball' },
          10: { name: 'Air hockey', gameType: 'airhockey' },
      };
      const special = defaults[id] || { name: `Table ${id}`, gameType: 'pingpong' };
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
        fitPass: false,
        gameType: special.gameType,
      };
    });
}

export function initializeHistory() {
  const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    console.log(
      "InitializeHistory: Loading from localStorage. Key:",
      LOCAL_STORAGE_HISTORY_KEY,
      "Data:",
      storedHistory
    );
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        console.log("InitializeHistory: Parsed history:", parsedHistory);

        const now = new Date();
        const today = now.toDateString();

        const yesterdayDate = new Date();
        yesterdayDate.setDate(now.getDate() - 1);
        const yesterday = yesterdayDate.toDateString();

        const filteredHistory = parsedHistory.filter(session => {
          if (!session.endTime) return false;
          const sessionDate = new Date(session.endTime).toDateString();
          return sessionDate === today || sessionDate === yesterday;
        });

        // If anything was removed, save cleaned data back to localStorage
        if (filteredHistory.length !== parsedHistory.length) {
          localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(filteredHistory));
          console.log("InitializeHistory: Old sessions removed from localStorage.");
        }

        return filteredHistory;
      } catch (e) {
        console.error("InitializeHistory: Error parsing stored history:", e);
        return [];
      }
    }
    return [];
}

export function initializeSalesSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SALES_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.saleFromHour === "number" &&
        typeof parsed.saleToHour === "number" &&
        typeof parsed.saleHourlyRate === "number"
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error parsing sales settings:", e);
  }
  return { saleFromHour: 12, saleToHour: 15, saleHourlyRate: 12 };
}
