import { LOCAL_STORAGE_TABLES_KEY, LOCAL_STORAGE_HISTORY_KEY } from "../config";
import { buildInitialDefaultTables, buildTablesFromStorage } from "./storageTables";
import { buildHistoryFromStorage } from "./storageHistory";

export function initializeTables() {
  const storedTables = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY);
  if (storedTables) {
    try {
      const parsedTables = JSON.parse(storedTables);
      const migrated = buildTablesFromStorage(parsedTables);
      try {
        localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(migrated));
      } catch {
        // ignore localStorage write errors
      }
      return migrated;
    } catch (e) {
      console.error("Error parsing stored tables in initializeTables:", e);
    }
  }
  return buildInitialDefaultTables();
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
      return buildHistoryFromStorage(storedHistory);
    } catch (e) {
      console.error("InitializeHistory: Error parsing stored history:", e);
      return [];
    }
  }
  return [];
}

