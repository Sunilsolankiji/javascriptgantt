/**
 * DOM Utilities Module
 * Handles all DOM manipulation operations
 */

/**
 * Create an element with optional class and attributes
 * @param {string} tag - HTML tag name
 * @param {Object} options - Configuration options
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.id) {
    element.id = options.id;
  }
  if (options.classes) {
    if (Array.isArray(options.classes)) {
      element.classList.add(...options.classes);
    } else {
      element.classList.add(options.classes);
    }
  }
  if (options.text) {
    element.textContent = options.text;
  }
  if (options.html) {
    element.innerHTML = options.html;
  }
  if (options.styles) {
    Object.assign(element.style, options.styles);
  }
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  return element;
}

/**
 * Add event listener with automatic cleanup
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} Cleanup function
 */
export function on(element, event, handler) {
  element.addEventListener(event, handler);
  return () => element.removeEventListener(event, handler);
}

/**
 * Add multiple event listeners
 * @param {HTMLElement} element - Target element
 * @param {Object} events - Event handlers map
 * @returns {Function[]} Cleanup functions
 */
export function onMultiple(element, events) {
  const cleanups = [];
  Object.entries(events).forEach(([event, handler]) => {
    cleanups.push(on(element, event, handler));
  });
  return cleanups;
}

/**
 * Query selector with null safety
 * @param {string} selector - CSS selector
 * @param {HTMLElement} root - Root element
 * @returns {HTMLElement|null} Found element or null
 */
export function querySelector(selector, root = document) {
  try {
    return root.querySelector(selector);
  } catch (error) {
    console.warn(`Query failed: ${selector}`, error);
    return null;
  }
}

/**
 * Query all with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} root - Root element
 * @returns {NodeList} Found elements
 */
export function querySelectorAll(selector, root = document) {
  try {
    return root.querySelectorAll(selector);
  } catch (error) {
    console.warn(`Query failed: ${selector}`, error);
    return document.querySelectorAll(null);
  }
}

/**
 * Check if element has class
 * @param {HTMLElement} element - Element to check
 * @param {string} className - Class name
 * @returns {boolean} True if has class
 */
export function hasClass(element, className) {
  return element && element.classList.contains(className);
}

/**
 * Add class to element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name
 * @returns {void}
 */
export function addClass(element, className) {
  element && element.classList.add(className);
}

/**
 * Remove class from element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name
 * @returns {void}
 */
export function removeClass(element, className) {
  element && element.classList.remove(className);
}

/**
 * Toggle class on element
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name
 * @returns {boolean} True if class is now on
 */
export function toggleClass(element, className) {
  return element && element.classList.toggle(className);
}

/**
 * Set multiple styles on element
 * @param {HTMLElement} element - Target element
 * @param {Object} styles - Styles object
 * @returns {void}
 */
export function setStyles(element, styles) {
  if (!element) {
    return;
  }
  Object.assign(element.style, styles);
}

/**
 * Get element position relative to viewport
 * @param {HTMLElement} element - Target element
 * @returns {Object} Position object {top, left, width, height}
 */
export function getElementPosition(element) {
  if (!element) {
    return null;
  }
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element) {
  const rect = getElementPosition(element);
  if (!rect) {
    return false;
  }
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

/**
 * Scroll element into view
 * @param {HTMLElement} element - Element to scroll
 * @param {Object} options - Scroll options
 * @returns {void}
 */
export function scrollIntoView(element, options = {}) {
  if (!element) {
    return;
  }
  element.scrollIntoView(options);
}

/**
 * Remove element from DOM
 * @param {HTMLElement} element - Element to remove
 * @returns {void}
 */
export function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Clear element content
 * @param {HTMLElement} element - Element to clear
 * @returns {void}
 */
export function clearElement(element) {
  if (element) {
    element.innerHTML = "";
  }
}

/**
 * Append child element
 * @param {HTMLElement} parent - Parent element
 * @param {HTMLElement} child - Child element
 * @returns {void}
 */
export function appendElement(parent, child) {
  if (parent && child) {
    parent.appendChild(child);
  }
}

/**
 * Prepend child element
 * @param {HTMLElement} parent - Parent element
 * @param {HTMLElement} child - Child element
 * @returns {void}
 */
export function prependElement(parent, child) {
  if (parent && child) {
    parent.insertBefore(child, parent.firstChild);
  }
}

/**
 * Replace element
 * @param {HTMLElement} oldElement - Element to replace
 * @param {HTMLElement} newElement - New element
 * @returns {void}
 */
export function replaceElement(oldElement, newElement) {
  if (oldElement && newElement && oldElement.parentNode) {
    oldElement.parentNode.replaceChild(newElement, oldElement);
  }
}

/**
 * Get attribute value
 * @param {HTMLElement} element - Target element
 * @param {string} attr - Attribute name
 * @returns {string|null} Attribute value
 */
export function getAttribute(element, attr) {
  return element ? element.getAttribute(attr) : null;
}

/**
 * Set attribute value
 * @param {HTMLElement} element - Target element
 * @param {string} attr - Attribute name
 * @param {string} value - Attribute value
 * @returns {void}
 */
export function setAttribute(element, attr, value) {
  if (element) {
    element.setAttribute(attr, value);
  }
}

/**
 * Remove attribute
 * @param {HTMLElement} element - Target element
 * @param {string} attr - Attribute name
 * @returns {void}
 */
export function removeAttribute(element, attr) {
  if (element) {
    element.removeAttribute(attr);
  }
}

/**
 * Get element dimensions
 * @param {HTMLElement} element - Target element
 * @returns {Object} Dimensions {width, height, offsetWidth, offsetHeight}
 */
export function getDimensions(element) {
  if (!element) {
    return null;
  }
  return {
    width: element.clientWidth,
    height: element.clientHeight,
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
  };
}
