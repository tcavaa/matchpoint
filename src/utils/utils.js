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
 * Calculates the cost based on elapsed time and rate.
 * @param {number} totalSeconds - The total elapsed seconds.
 * @param {number} hourlyRate - The rate per hour.
 * @returns {string} The calculated cost, formatted to 2 decimal places.
 */
export const calculateCost = (totalSeconds, hourlyRate) => {
  if (totalSeconds <= 0) return "0.00"; // if duration is 0 or less, cost is 0
  const hours = totalSeconds / 3600;
  const cost = hours * hourlyRate;
  return cost.toFixed(2);
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
 * Parse multiple date formats into a Date instance.
 * Supports examples like:
 * - "26.09.2025. 19:10:26" (DD.MM.YYYY. HH:mm:ss)
 * - "9/19/2025, 11:55:02 PM" (MM/DD/YYYY, h:mm:ss A)
 * - ISO strings
 * Returns `null` if parsing fails.
 */
export const parseFlexibleDate = (input) => {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  const value = String(input).trim();

  // Try ISO or native parser first
  const native = new Date(value);
  if (!isNaN(native.getTime())) return native;

  // Try DD.MM.YYYY. HH:mm:ss (with optional trailing dot after YYYY)
  const dotMatch = value.match(/^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2}):(\d{2})\s*$/);
  if (dotMatch) {
    const [, d, m, y, hh, mm, ss] = dotMatch.map(String);
    const year = Number(y);
    const monthIndex = Number(m) - 1;
    const day = Number(d);
    const hours = Number(hh);
    const minutes = Number(mm);
    const seconds = Number(ss);
    const dt = new Date(year, monthIndex, day, hours, minutes, seconds);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Try MM/DD/YYYY, h:mm:ss AM/PM
  const slashMatch = value.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)\s*$/i);
  if (slashMatch) {
    const [, m, d, y, hh, mm, ss, mer] = slashMatch;
    let hours = Number(hh);
    const minutes = Number(mm);
    const seconds = Number(ss);
    const year = Number(y);
    const monthIndex = Number(m) - 1;
    const day = Number(d);
    const upper = mer.toUpperCase();
    if (upper === 'PM' && hours < 12) hours += 12;
    if (upper === 'AM' && hours === 12) hours = 0;
    const dt = new Date(year, monthIndex, day, hours, minutes, seconds);
    return isNaN(dt.getTime()) ? null : dt;
  }

  return null;
};