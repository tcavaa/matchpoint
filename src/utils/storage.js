import { v4 as uuidv4 } from "uuid";
import { TABLE_COUNT, LOCAL_STORAGE_TABLES_KEY, LOCAL_STORAGE_HISTORY_KEY } from "../config";
import { TIMER_MODES } from "./constants";

export function initializeTables() {
  const storedTables = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
    if (storedTables) {
      try {
        const parsedTables = JSON.parse(storedTables);
        return parsedTables.map((table) => ({
          id: table.id || uuidv4(), // Ensure ID exists
          name: table.name || `Table ${table.id || "N/A"}`,
          isAvailable: table.isAvailable,
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
        }));
      } catch (e) {
        console.error("Error parsing stored tables in initializeTables:", e);
      }
    }
    return Array.from({ length: TABLE_COUNT }, (_, i) => ({
      id: i + 1,
      name: `Table ${i + 1}`,
      timerStartTime: null,
      elapsedTimeInSeconds: 0,
      isRunning: false,
      timerMode: "standard",
      initialCountdownSeconds: null,
      isAvailable: true,
    }));
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
