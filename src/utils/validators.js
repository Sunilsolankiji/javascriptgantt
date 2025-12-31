/**
 * Validators Module
 * Validation functions for data and options
 */

/**
 * Validate if value is a string
 * @param {any} value - Value to check
 * @returns {boolean} True if string
 */
export function isString(value) {
  return typeof value === "string";
}

/**
 * Validate if value is a number
 * @param {any} value - Value to check
 * @returns {boolean} True if number
 */
export function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Validate if value is a boolean
 * @param {any} value - Value to check
 * @returns {boolean} True if boolean
 */
export function isBoolean(value) {
  return typeof value === "boolean";
}

/**
 * Validate if value is an array
 * @param {any} value - Value to check
 * @returns {boolean} True if array
 */
export function isArray(value) {
  return Array.isArray(value);
}

/**
 * Validate if value is an object
 * @param {any} value - Value to check
 * @returns {boolean} True if object
 */
export function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validate if value is null or undefined
 * @param {any} value - Value to check
 * @returns {boolean} True if null or undefined
 */
export function isEmpty(value) {
  return value === null || value === undefined;
}

/**
 * Validate if value is a function
 * @param {any} value - Value to check
 * @returns {boolean} True if function
 */
export function isFunction(value) {
  return typeof value === "function";
}

/**
 * Validate if value is a Date
 * @param {any} value - Value to check
 * @returns {boolean} True if Date
 */
export function isDate(value) {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Validate if string is a valid date
 * @param {string} dateStr - Date string
 * @returns {boolean} True if valid date
 */
export function isValidDateString(dateStr) {
  if (!isString(dateStr)) {
    return false;
  }
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate task object
 * @param {Object} task - Task to validate
 * @returns {Object} Validation result {valid: boolean, errors: string[]}
 */
export function validateTask(task) {
  const errors = [];

  if (!task || !isObject(task)) {
    errors.push("Task must be an object");
  }

  if (!("id" in task) || isEmpty(task.id)) {
    errors.push("Task must have an id property");
  }

  if (!task.name || !isString(task.name)) {
    errors.push("Task must have a name property (string)");
  }

  if (!("start_date" in task)) {
    errors.push("Task must have a start_date property");
  } else if (!isString(task.start_date) && !isDate(task.start_date)) {
    errors.push("Task start_date must be a string or Date");
  }

  if (!("duration" in task) || !isNumber(task.duration)) {
    errors.push("Task must have a duration property (number)");
  }

  if (task.duration < 0) {
    errors.push("Task duration must be positive");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate gantt options
 * @param {Object} options - Options to validate
 * @returns {Object} Validation result {valid: boolean, errors: string[]}
 */
export function validateGanttOptions(options) {
  const errors = [];

  if (!options || !isObject(options)) {
    errors.push("Options must be an object");
  }

  if (!("data" in options)) {
    errors.push("Options must have a data property");
  } else if (!isArray(options.data)) {
    errors.push("Options data must be an array");
  } else {
    // Validate each task in data
    options.data.forEach((task, index) => {
      const validation = validateTask(task);
      if (!validation.valid) {
        errors.push(
          `Task at index ${index} is invalid: ${validation.errors.join(", ")}`
        );
      }
    });
  }

  if ("row_height" in options && !isNumber(options.row_height)) {
    errors.push("row_height must be a number");
  }

  if ("sidebarWidth" in options && !isNumber(options.sidebarWidth)) {
    errors.push("sidebarWidth must be a number");
  }

  if ("scale_height" in options && !isNumber(options.scale_height)) {
    errors.push("scale_height must be a number");
  }

  if ("zoomLevel" in options && !isString(options.zoomLevel)) {
    errors.push("zoomLevel must be a string");
  }

  if ("columns" in options && !isArray(options.columns)) {
    errors.push("columns must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate range
 * @param {number} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if in range
 */
export function isInRange(value, min, max) {
  return isNumber(value) && value >= min && value <= max;
}

/**
 * Validate length
 * @param {string|Array} value - Value to check
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if length is valid
 */
export function isValidLength(value, minLength, maxLength) {
  if (!value || !("length" in value)) {
    return false;
  }
  return value.length >= minLength && value.length <= maxLength;
}

/**
 * Validate against pattern
 * @param {string} value - Value to check
 * @param {RegExp} pattern - Regex pattern
 * @returns {boolean} True if matches pattern
 */
export function matchesPattern(value, pattern) {
  if (!isString(value)) {
    return false;
  }
  return pattern.test(value);
}

/**
 * Validate value is one of allowed values
 * @param {any} value - Value to check
 * @param {Array} allowedValues - Allowed values
 * @returns {boolean} True if valid
 */
export function isOneOf(value, allowedValues) {
  return allowedValues.includes(value);
}

/**
 * Check for duplicate IDs in array
 * @param {Array} arr - Array to check
 * @param {string} idProp - ID property name
 * @returns {Object} {hasDuplicates: boolean, duplicates: any[]}
 */
export function checkDuplicateIds(arr, idProp = "id") {
  const seen = new Set();
  const duplicates = [];

  arr.forEach((item) => {
    const id = item[idProp];
    if (seen.has(id)) {
      if (!duplicates.includes(id)) {
        duplicates.push(id);
      }
    } else {
      seen.add(id);
    }
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}
