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
 * Plays a sound file.
 * @param {string} soundFileRelativePath - Relative path from the public folder (e.g., '/sounds/payment.mp3').
 */
export const playSound = (soundFileRelativePath) => {
  const audio = new Audio(soundFileRelativePath);
  audio.play().catch(error => console.error("Error playing sound:", error, soundFileRelativePath));
};