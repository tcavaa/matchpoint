import { calculateSessionCost, getFinalElapsedTimeInSeconds } from "./tableBilling";

export function getTableCardViewModel(table, rateSettings) {
  const {
    elapsedTimeInSeconds,
    isRunning,
    timerMode,
    initialCountdownSeconds,
  } = table;

  const totalPassedTime = getFinalElapsedTimeInSeconds(table);
  const cost = calculateSessionCost(table, totalPassedTime, rateSettings).toFixed(2);

  let displayTimeSeconds = totalPassedTime;
  if (timerMode === "countdown") {
    displayTimeSeconds = initialCountdownSeconds
      ? initialCountdownSeconds - totalPassedTime
      : 0;
    if (isRunning && displayTimeSeconds < 0) displayTimeSeconds = 0;
  }

  const canStart =
    !isRunning &&
    (!initialCountdownSeconds ||
      displayTimeSeconds <= 0 ||
      timerMode === "standard");
  const canPayAndClear =
    (timerMode === "standard" && (elapsedTimeInSeconds > 0 || isRunning)) ||
    (timerMode === "countdown" && initialCountdownSeconds > 0);
  const isCountdownEnded =
    timerMode === "countdown" && !isRunning && displayTimeSeconds <= 0;

  return {
    displayTimeSeconds,
    cost,
    canStart,
    canPayAndClear,
    isCountdownEnded,
  };
}
