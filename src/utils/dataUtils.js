/**
 * Data Utilities Module
 * Handles data transformation and validation
 */

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item));
  }
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * Merge objects (shallow merge)
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function merge(target, source) {
  return { ...target, ...source };
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Filter array of objects
 * @param {Array} arr - Array to filter
 * @param {Object} criteria - Filter criteria
 * @returns {Array} Filtered array
 */
export function filterBy(arr, criteria) {
  return arr.filter((item) => {
    for (const key in criteria) {
      if (item[key] !== criteria[key]) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Find object in array by property
 * @param {Array} arr - Array to search
 * @param {string} prop - Property name
 * @param {any} value - Value to match
 * @returns {Object|null} Found object or null
 */
export function findBy(arr, prop, value) {
  return arr.find((item) => item[prop] === value) || null;
}

/**
 * Group array by property
 * @param {Array} arr - Array to group
 * @param {string} prop - Property name
 * @returns {Object} Grouped object
 */
export function groupBy(arr, prop) {
  return arr.reduce((acc, item) => {
    const key = item[prop];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Sort array of objects
 * @param {Array} arr - Array to sort
 * @param {string} prop - Property to sort by
 * @param {boolean} ascending - Sort direction
 * @returns {Array} Sorted array
 */
export function sortBy(arr, prop, ascending = true) {
  const sorted = [...arr];
  sorted.sort((a, b) => {
    if (a[prop] < b[prop]) {
      return ascending ? -1 : 1;
    }
    if (a[prop] > b[prop]) {
      return ascending ? 1 : -1;
    }
    return 0;
  });
  return sorted;
}

/**
 * Flatten nested array
 * @param {Array} arr - Array to flatten
 * @returns {Array} Flattened array
 */
export function flatten(arr) {
  return arr.reduce((acc, item) => {
    if (Array.isArray(item)) {
      acc.push(...flatten(item));
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

/**
 * Get unique values from array
 * @param {Array} arr - Array to deduplicate
 * @returns {Array} Unique values
 */
export function unique(arr) {
  return [...new Set(arr)];
}

/**
 * Get unique objects from array by property
 * @param {Array} arr - Array of objects
 * @param {string} prop - Property name
 * @returns {Array} Unique objects
 */
export function uniqueBy(arr, prop) {
  const seen = new Set();
  return arr.filter((item) => {
    const value = item[prop];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Chunk array into smaller arrays
 * @param {Array} arr - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Chunked array
 */
export function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Pick properties from object
 * @param {Object} obj - Source object
 * @param {string[]} props - Properties to pick
 * @returns {Object} New object with picked properties
 */
export function pick(obj, props) {
  const result = {};
  props.forEach((prop) => {
    if (prop in obj) {
      result[prop] = obj[prop];
    }
  });
  return result;
}

/**
 * Omit properties from object
 * @param {Object} obj - Source object
 * @param {string[]} props - Properties to omit
 * @returns {Object} New object without omitted properties
 */
export function omit(obj, props) {
  const result = { ...obj };
  props.forEach((prop) => {
    delete result[prop];
  });
  return result;
}

/**
 * Get nested property value
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-separated path (e.g., 'user.profile.name')
 * @returns {any} Property value or undefined
 */
export function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

/**
 * Set nested property value
 * @param {Object} obj - Target object
 * @param {string} path - Dot-separated path
 * @param {any} value - Value to set
 * @returns {Object} Modified object
 */
export function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
}

/**
 * Check if object has property
 * @param {Object} obj - Object to check
 * @param {string} prop - Property name
 * @returns {boolean} True if has property
 */
export function hasProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * Get all keys from object
 * @param {Object} obj - Object
 * @returns {string[]} Array of keys
 */
export function getKeys(obj) {
  return Object.keys(obj);
}

/**
 * Get all values from object
 * @param {Object} obj - Object
 * @returns {any[]} Array of values
 */
export function getValues(obj) {
  return Object.values(obj);
}

/**
 * Transform object keys
 * @param {Object} obj - Source object
 * @param {Function} transformer - Key transformer function
 * @returns {Object} New object with transformed keys
 */
export function transformKeys(obj, transformer) {
  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    result[transformer(key)] = value;
  });
  return result;
}

/**
 * Transform object values
 * @param {Object} obj - Source object
 * @param {Function} transformer - Value transformer function
 * @returns {Object} New object with transformed values
 */
export function transformValues(obj, transformer) {
  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    result[key] = transformer(value, key);
  });
  return result;
}
