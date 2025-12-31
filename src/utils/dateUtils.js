/**
 * Date Utilities Module
 * Handles all date-related operations
 */

/**
 * Parse a date string in YYYY-MM-DD format
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {Date} Parsed date
 */
export function parseDate(dateStr) {
  if (dateStr instanceof Date) {
    return dateStr;
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date to YYYY-MM-DD format
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get day of week (0=Sunday, 6=Saturday)
 * @param {Date} date - Date to check
 * @returns {number} Day of week
 */
export function getDayOfWeek(date) {
  return date.getDay();
}

/**
 * Check if date is a weekend
 * @param {Date} date - Date to check
 * @param {number[]} weekends - Weekend days (0=Sunday, 6=Saturday)
 * @returns {boolean} True if weekend
 */
export function isWeekend(date, weekends = [0, 6]) {
  return weekends.includes(getDayOfWeek(date));
}

/**
 * Add days to a date
 * @param {Date} date - Start date
 * @param {number} days - Days to add
 * @returns {Date} New date
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get difference between two dates in days
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Difference in days
 */
export function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((date2 - date1) / oneDay);
}

/**
 * Check if date is between two dates
 * @param {Date} date - Date to check
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {boolean} True if between
 */
export function isBetween(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

/**
 * Strip time from date (set to midnight)
 * @param {Date} date - Date to strip
 * @returns {Date} Date at midnight
 */
export function stripTime(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get start of week
 * @param {Date} date - Date in the week
 * @param {number} weekStart - Day week starts (0=Sunday, 1=Monday)
 * @returns {Date} Start of week
 */
export function getStartOfWeek(date, weekStart = 0) {
  const day = date.getDay();
  const diff =
    date.getDate() - day + (weekStart === 0 ? 0 : 1 + (day === 0 ? -7 : 0));
  return new Date(date.setDate(diff));
}

/**
 * Get start of month
 * @param {Date} date - Date in the month
 * @returns {Date} Start of month
 */
export function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month
 * @param {Date} date - Date in the month
 * @returns {Date} End of month
 */
export function getEndOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get number of days in month
 * @param {Date} date - Date in the month
 * @returns {number} Number of days
 */
export function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Format date with custom format
 * @param {Date} date - Date to format
 * @param {string} format - Format string (YYYY, MM, DD, etc.)
 * @returns {string} Formatted date
 */
export function customFormatDate(date, format) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return format
    .replace("YYYY", year)
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
}

/**
 * Get quarter of year
 * @param {Date} date - Date to check
 * @returns {number} Quarter (1-4)
 */
export function getQuarter(date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

/**
 * Get start of quarter
 * @param {Date} date - Date in the quarter
 * @returns {Date} Start of quarter
 */
export function getStartOfQuarter(date) {
  const quarter = getQuarter(date);
  return new Date(date.getFullYear(), (quarter - 1) * 3, 1);
}
