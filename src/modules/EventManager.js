/**
 * EventManager Module
 * Handles all event registration, dispatching, and cleanup
 */

class EventManager {
  constructor() {
    this.listeners = new Map();
    this.domListeners = [];
  }

  /**
   * Register an event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);

    return () => this.off(eventName, callback);
  }

  /**
   * Remove an event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      return;
    }

    const callbacks = this.listeners.get(eventName);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} eventName - Event name
   * @param {any} data - Event data
   * @returns {boolean} True if event was handled
   */
  emit(eventName, data = {}) {
    if (!this.listeners.has(eventName)) {
      return false;
    }

    const callbacks = this.listeners.get(eventName);
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    });

    return callbacks.length > 0;
  }

  /**
   * Register a DOM event listener with automatic cleanup tracking
   * @param {HTMLElement} element - DOM element
   * @param {string} eventType - Event type (click, mouseover, etc.)
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   * @returns {Function} Cleanup function
   */
  addDOMListener(element, eventType, handler, options = {}) {
    if (!element || !eventType || !handler) {
      return () => {};
    }

    element.addEventListener(eventType, handler, options);

    const cleanup = () => {
      element.removeEventListener(eventType, handler, options);
    };

    this.domListeners.push({
      element,
      eventType,
      handler,
      options,
      cleanup,
    });

    return cleanup;
  }

  /**
   * Remove all DOM listeners for an element
   * @param {HTMLElement} element - DOM element
   */
  removeDOMListeners(element) {
    this.domListeners = this.domListeners.filter((listener) => {
      if (listener.element === element) {
        listener.cleanup();
        return false;
      }
      return true;
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    // Remove all custom event listeners
    this.listeners.clear();

    // Remove all DOM listeners
    this.domListeners.forEach((listener) => {
      listener.cleanup();
    });
    this.domListeners = [];
  }

  /**
   * Get all registered event names
   * @returns {string[]} Array of event names
   */
  getEventNames() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if event has listeners
   * @param {string} eventName - Event name
   * @returns {boolean} True if has listeners
   */
  hasListeners(eventName) {
    return (
      this.listeners.has(eventName) && this.listeners.get(eventName).length > 0
    );
  }

  /**
   * Create a debounced event handler
   * @param {Function} handler - Handler function
   * @param {number} delay - Debounce delay in ms
   * @returns {Function} Debounced handler
   */
  debounce(handler, delay = 100) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(...args), delay);
    };
  }

  /**
   * Create a throttled event handler
   * @param {Function} handler - Handler function
   * @param {number} limit - Throttle limit in ms
   * @returns {Function} Throttled handler
   */
  throttle(handler, limit = 100) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        handler(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Register a one-time event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   */
  once(eventName, callback) {
    const onceWrapper = (data) => {
      this.off(eventName, onceWrapper);
      callback(data);
    };
    this.on(eventName, onceWrapper);
  }

  /**
   * Dispatch a custom DOM event
   * @param {HTMLElement} element - Target element
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   * @returns {boolean} True if event was not cancelled
   */
  dispatchDOMEvent(element, eventName, detail = {}) {
    if (!element) {
      return false;
    }

    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    });

    return element.dispatchEvent(event);
  }
}

export { EventManager };
