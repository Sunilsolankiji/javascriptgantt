/**
 * ScaleManager Module
 * Handles timeline scale calculations and rendering
 */

import {
  parseDate,
  formatDate,
  addDays,
  daysBetween,
  getStartOfMonth,
  getEndOfMonth,
  getDaysInMonth,
  getQuarter,
  getStartOfQuarter,
  getStartOfWeek,
} from "../utils/dateUtils.js";

class ScaleManager {
  constructor(options = {}) {
    this.options = options;
    this.scales = options.scales || [{ unit: "day", step: 1, format: "%d" }];
    this.zoomLevel = options.zoomLevel || "day";
    this.weekStart = options.weekStart || 0;
    this.minColWidth = options.minColWidth || 80;
  }

  /**
   * Get scale configuration for zoom level
   * @param {string} zoomLevel - Zoom level
   * @returns {Object} Scale config
   */
  getScaleConfig(zoomLevel) {
    const configs = {
      hour: {
        scales: [
          { unit: "day", step: 1, format: "%d %M" },
          { unit: "hour", step: 1, format: "%H:00" },
        ],
        minColWidth: 40,
      },
      day: {
        scales: [
          { unit: "month", step: 1, format: "%F %Y" },
          { unit: "day", step: 1, format: "%d" },
        ],
        minColWidth: 40,
      },
      week: {
        scales: [
          { unit: "month", step: 1, format: "%F %Y" },
          { unit: "week", step: 1, format: "Week %W" },
        ],
        minColWidth: 80,
      },
      month: {
        scales: [
          { unit: "year", step: 1, format: "%Y" },
          { unit: "month", step: 1, format: "%M" },
        ],
        minColWidth: 80,
      },
      quarter: {
        scales: [
          { unit: "year", step: 1, format: "%Y" },
          { unit: "quarter", step: 1, format: "Q%q" },
        ],
        minColWidth: 100,
      },
      year: {
        scales: [{ unit: "year", step: 1, format: "%Y" }],
        minColWidth: 120,
      },
    };

    return configs[zoomLevel] || configs.day;
  }

  /**
   * Calculate dates between start and end
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} unit - Time unit
   * @param {number} step - Step size
   * @returns {Date[]} Array of dates
   */
  calculateDates(startDate, endDate, unit = "day", step = 1) {
    const dates = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      current = this.addUnit(current, unit, step);
    }

    return dates;
  }

  /**
   * Add time unit to date
   * @param {Date} date - Start date
   * @param {string} unit - Time unit
   * @param {number} amount - Amount to add
   * @returns {Date} New date
   */
  addUnit(date, unit, amount) {
    const result = new Date(date);

    switch (unit) {
      case "hour":
        result.setHours(result.getHours() + amount);
        break;
      case "day":
        result.setDate(result.getDate() + amount);
        break;
      case "week":
        result.setDate(result.getDate() + amount * 7);
        break;
      case "month":
        result.setMonth(result.getMonth() + amount);
        break;
      case "quarter":
        result.setMonth(result.getMonth() + amount * 3);
        break;
      case "year":
        result.setFullYear(result.getFullYear() + amount);
        break;
      default:
        result.setDate(result.getDate() + amount);
    }

    return result;
  }

  /**
   * Format date according to format string
   * @param {Date} date - Date to format
   * @param {string} format - Format string
   * @param {Object} locale - Locale strings
   * @returns {string} Formatted date
   */
  formatDate(date, format, locale = {}) {
    const monthFull = locale.month_full || [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthShort = locale.month_short || [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dayFull = locale.day_full || [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayShort = locale.day_short || [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ];

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    // Get week number
    const weekNumber = this.getWeekNumber(date);
    const quarter = Math.floor(month / 3) + 1;

    return format
      .replace("%Y", year)
      .replace("%y", String(year).slice(-2))
      .replace("%F", monthFull[month])
      .replace("%M", monthShort[month])
      .replace("%m", String(month + 1).padStart(2, "0"))
      .replace("%n", month + 1)
      .replace("%d", String(day).padStart(2, "0"))
      .replace("%j", day)
      .replace("%l", dayFull[dayOfWeek])
      .replace("%D", dayShort[dayOfWeek])
      .replace("%W", weekNumber)
      .replace("%H", String(hours).padStart(2, "0"))
      .replace("%i", String(minutes).padStart(2, "0"))
      .replace("%q", quarter);
  }

  /**
   * Get week number of year
   * @param {Date} date - Date to check
   * @returns {number} Week number
   */
  getWeekNumber(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  /**
   * Calculate column width based on zoom level
   * @param {string} zoomLevel - Current zoom level
   * @param {number} containerWidth - Container width
   * @param {number} dateCount - Number of dates
   * @returns {number} Column width
   */
  calculateColumnWidth(zoomLevel, containerWidth, dateCount) {
    const minWidth = this.getScaleConfig(zoomLevel).minColWidth;
    const calculatedWidth = Math.floor(containerWidth / dateCount);
    return Math.max(calculatedWidth, minWidth);
  }

  /**
   * Get visible date range for container
   * @param {number} scrollLeft - Scroll position
   * @param {number} containerWidth - Container width
   * @param {number} columnWidth - Column width
   * @param {Date[]} dates - All dates
   * @returns {Object} {startIndex, endIndex, visibleDates}
   */
  getVisibleDateRange(scrollLeft, containerWidth, columnWidth, dates) {
    const startIndex = Math.max(0, Math.floor(scrollLeft / columnWidth) - 1);
    const visibleCount = Math.ceil(containerWidth / columnWidth) + 2;
    const endIndex = Math.min(dates.length - 1, startIndex + visibleCount);

    return {
      startIndex,
      endIndex,
      visibleDates: dates.slice(startIndex, endIndex + 1),
    };
  }

  /**
   * Calculate task position on timeline
   * @param {Date} taskStart - Task start date
   * @param {Date} taskEnd - Task end date
   * @param {Date} timelineStart - Timeline start date
   * @param {number} columnWidth - Column width
   * @param {string} unit - Time unit
   * @returns {Object} {left, width}
   */
  calculateTaskPosition(
    taskStart,
    taskEnd,
    timelineStart,
    columnWidth,
    unit = "day"
  ) {
    let left, width;

    if (unit === "hour") {
      const hoursFromStart = (taskStart - timelineStart) / (1000 * 60 * 60);
      const taskDuration = (taskEnd - taskStart) / (1000 * 60 * 60);
      left = hoursFromStart * columnWidth;
      width = taskDuration * columnWidth;
    } else {
      const daysFromStart = daysBetween(timelineStart, taskStart);
      const taskDuration = daysBetween(taskStart, taskEnd) + 1;
      left = daysFromStart * columnWidth;
      width = taskDuration * columnWidth;
    }

    return { left: Math.max(0, left), width: Math.max(columnWidth, width) };
  }

  /**
   * Get scale header height
   * @returns {number} Header height
   */
  getScaleHeight() {
    const scaleHeight = this.options.scale_height || 30;
    return scaleHeight * this.scales.length;
  }

  /**
   * Check if date is today
   * @param {Date} date - Date to check
   * @returns {boolean} True if today
   */
  isToday(date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Check if date is weekend
   * @param {Date} date - Date to check
   * @param {number[]} weekends - Weekend day numbers
   * @returns {boolean} True if weekend
   */
  isWeekend(date, weekends = [0, 6]) {
    return weekends.includes(date.getDay());
  }

  /**
   * Set zoom level
   * @param {string} level - New zoom level
   */
  setZoomLevel(level) {
    this.zoomLevel = level;
    const config = this.getScaleConfig(level);
    this.scales = config.scales;
    this.minColWidth = config.minColWidth;
  }

  /**
   * Zoom in (show more detail)
   */
  zoomIn() {
    const levels = ["year", "quarter", "month", "week", "day", "hour"];
    const currentIndex = levels.indexOf(this.zoomLevel);
    if (currentIndex < levels.length - 1) {
      this.setZoomLevel(levels[currentIndex + 1]);
    }
  }

  /**
   * Zoom out (show less detail)
   */
  zoomOut() {
    const levels = ["year", "quarter", "month", "week", "day", "hour"];
    const currentIndex = levels.indexOf(this.zoomLevel);
    if (currentIndex > 0) {
      this.setZoomLevel(levels[currentIndex - 1]);
    }
  }
}

export { ScaleManager };
