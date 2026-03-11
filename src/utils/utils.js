// src/utils.js

/**
 * Formats time in seconds to HH:MM:SS string.
 * @param {number} totalSeconds - The total seconds to format.
 * @returns {string} The formatted time string.
 */
export const formatTime = (totalSecondsInput) => {
  const totalSeconds = Math.max(0, Math.floor(totalSecondsInput)); // Ensure non-negative and integer

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

/**
 * Calculate segmented price across sale window.
 * Sale window: fromHour (inclusive) toHour (exclusive) in 24h (0-24).
 * Example: 12-15 at 12 GEL/hr; otherwise HOURLY_RATE.
 * If session crosses boundaries, split time accordingly.
 */
export const calculateSegmentedPrice = ({
  startTimeMs,
  endTimeMs,
  hourlyRate,
  saleFromHour,
  saleToHour,
  saleHourlyRate,
  timezoneOffsetMinutes = 240, // Default to Georgia (UTC+4)
}) => {
  if (!startTimeMs || !endTimeMs || endTimeMs <= startTimeMs) return "0.00";
  const tzOffsetMs = timezoneOffsetMinutes * 60 * 1000;
  let cursorMs = startTimeMs;
  let total = 0;

  while (cursorMs < endTimeMs) {
    // Work in adjusted timezone by shifting milliseconds, compute hour boundary, then shift back
    const adj = new Date(cursorMs + tzOffsetMs);
    const hourOfDay = adj.getUTCHours();

    const nextAdj = new Date(adj);
    nextAdj.setUTCMinutes(0, 0, 0);
    nextAdj.setUTCHours(nextAdj.getUTCHours() + 1);
    const nextBoundaryMs = nextAdj.getTime() - tzOffsetMs; // convert back to real ms

    const segmentEndMs = Math.min(nextBoundaryMs, endTimeMs);
    const durationSeconds = (segmentEndMs - cursorMs) / 1000;

    const normalizedFrom = saleFromHour;
    const normalizedTo = saleToHour;
    const inSale = normalizedFrom < normalizedTo
      ? hourOfDay >= normalizedFrom && hourOfDay < normalizedTo
      : (hourOfDay >= normalizedFrom || hourOfDay < normalizedTo);

    const rate = inSale ? saleHourlyRate : hourlyRate;
    total += (durationSeconds / 3600) * rate;

    cursorMs = segmentEndMs;
  }

  return total.toFixed(2);
};

/**
 * Plays a sound file.
 * @param {string} soundFileRelativePath - Relative path from the public folder (e.g., '/sounds/payment.mp3').
 */
export const playSound = (soundFileRelativePath) => {
  const audio = new Audio(soundFileRelativePath);
  audio.play().catch(error => console.error("Error playing sound:", error, soundFileRelativePath));
};

/**
 * Play per-table end sound with fallback to default timer sound.
 * Looks for /sound/table{tableId}.mp3; falls back to /sound/timer_done.mp3 on failure.
 */
export const playTableEndSound = (tableId, gameType) => {
  const typeToSound = {
    foosball: '/sound/tablefootball.mp3',
    airhockey: '/sound/tablehockey.mp3',
  };

  const candidates = [
    gameType && typeToSound[gameType],
    `/sound/table${tableId}.mp3`,
    `../../sound/table${tableId}.mp3`,
    `/sound/timer_done.mp3`,
    `../../sound/timer_done.mp3`,
  ].filter(Boolean);

  const tryPlay = (idx) => {
    if (idx >= candidates.length) return;
    const url = candidates[idx];
    const audio = new Audio(url);
    audio.play().catch(() => tryPlay(idx + 1));
  };

  tryPlay(0);
};
