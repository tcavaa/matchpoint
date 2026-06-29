import { LOCAL_STORAGE_TABLES_KEY, LOCAL_STORAGE_HISTORY_KEY } from "../config";
import { buildInitialDefaultTables, buildTablesFromStorage } from "./storageTables";
import { buildHistoryFromStorage } from "./storageHistory";
import { branchStorageKey, getActiveBranch } from "../branches";

export function initializeTables(branch = getActiveBranch()) {
  const key = branchStorageKey(LOCAL_STORAGE_TABLES_KEY, branch);
  const storedTables = localStorage.getItem(key);
  if (storedTables) {
    try {
      const parsedTables = JSON.parse(storedTables);
      const migrated = buildTablesFromStorage(parsedTables, branch);
      try {
        localStorage.setItem(key, JSON.stringify(migrated));
      } catch {
        // ignore localStorage write errors
      }
      return migrated;
    } catch (e) {
      console.error("Error parsing stored tables in initializeTables:", e);
    }
  }
  return buildInitialDefaultTables(branch);
}

export function initializeHistory(branch = getActiveBranch()) {
  const key = branchStorageKey(LOCAL_STORAGE_HISTORY_KEY, branch);
  const storedHistory = localStorage.getItem(key);
  if (storedHistory) {
    try {
      return buildHistoryFromStorage(storedHistory, key);
    } catch (e) {
      console.error("InitializeHistory: Error parsing stored history:", e);
      return [];
    }
  }
  return [];
}
