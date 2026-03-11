import { LOCAL_STORAGE_HISTORY_KEY } from "../config";

export function buildHistoryFromStorage(storedHistory) {
  const parsedHistory = JSON.parse(storedHistory);
  const now = new Date();
  const today = now.toDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = yesterdayDate.toDateString();

  const filteredHistory = parsedHistory.filter((session) => {
    if (!session.endTime) return false;
    const sessionDate = new Date(session.endTime).toDateString();
    return sessionDate === today || sessionDate === yesterday;
  });

  if (filteredHistory.length !== parsedHistory.length) {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(filteredHistory));
    console.log("InitializeHistory: Old sessions removed from localStorage.");
  }

  return filteredHistory;
}

