/**
 * LinkManager Module
 * Handles task dependencies and link rendering
 */

class LinkManager {
  constructor(options = {}) {
    this.links = [];
    this.options = options;
  }

  /**
   * Initialize links from data
   * @param {Array} links - Link data array
   */
  init(links = []) {
    this.links = links.map((link) => ({
      ...link,
      id: link.id || `${link.source}_${link.target}`,
    }));
  }

  /**
   * Add a new link
   * @param {Object} link - Link to add
   * @returns {Object} Added link
   */
  addLink(link) {
    if (!link.source || !link.target) {
      throw new Error("Link must have source and target");
    }

    // Check for duplicate
    if (this.getLink(link.source, link.target)) {
      throw new Error("Link already exists");
    }

    // Check for circular dependency
    if (this.wouldCreateCycle(link.source, link.target)) {
      throw new Error("Link would create circular dependency");
    }

    const newLink = {
      id: link.id || `${link.source}_${link.target}`,
      source: link.source,
      target: link.target,
      type: link.type || "0", // Default: finish-to-start
      lag: link.lag || 0,
    };

    this.links.push(newLink);
    return newLink;
  }

  /**
   * Remove a link
   * @param {string} source - Source task ID
   * @param {string} target - Target task ID
   * @returns {Object|null} Removed link or null
   */
  removeLink(source, target) {
    const index = this.links.findIndex(
      (l) => l.source === source && l.target === target
    );

    if (index !== -1) {
      return this.links.splice(index, 1)[0];
    }

    return null;
  }

  /**
   * Remove link by ID
   * @param {string} linkId - Link ID
   * @returns {Object|null} Removed link or null
   */
  removeLinkById(linkId) {
    const index = this.links.findIndex((l) => l.id === linkId);
    if (index !== -1) {
      return this.links.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * Get a link
   * @param {string} source - Source task ID
   * @param {string} target - Target task ID
   * @returns {Object|null} Link or null
   */
  getLink(source, target) {
    return (
      this.links.find((l) => l.source === source && l.target === target) || null
    );
  }

  /**
   * Get all links for a task
   * @param {string|number} taskId - Task ID
   * @returns {Object} {incoming: [], outgoing: []}
   */
  getTaskLinks(taskId) {
    return {
      incoming: this.links.filter((l) => l.target === taskId),
      outgoing: this.links.filter((l) => l.source === taskId),
    };
  }

  /**
   * Get predecessors of a task
   * @param {string|number} taskId - Task ID
   * @returns {Array} Predecessor task IDs
   */
  getPredecessors(taskId) {
    return this.links.filter((l) => l.target === taskId).map((l) => l.source);
  }

  /**
   * Get successors of a task
   * @param {string|number} taskId - Task ID
   * @returns {Array} Successor task IDs
   */
  getSuccessors(taskId) {
    return this.links.filter((l) => l.source === taskId).map((l) => l.target);
  }

  /**
   * Check if adding link would create cycle
   * @param {string|number} source - Source task ID
   * @param {string|number} target - Target task ID
   * @returns {boolean} True if would create cycle
   */
  wouldCreateCycle(source, target) {
    const visited = new Set();
    const stack = [target];

    while (stack.length > 0) {
      const current = stack.pop();

      if (current === source) {
        return true;
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      const successors = this.getSuccessors(current);
      stack.push(...successors);
    }

    return false;
  }

  /**
   * Get link type name
   * @param {string} type - Link type code
   * @returns {string} Link type name
   */
  getLinkTypeName(type) {
    const types = {
      0: "Finish-to-Start (FS)",
      1: "Start-to-Start (SS)",
      2: "Finish-to-Finish (FF)",
      3: "Start-to-Finish (SF)",
    };
    return types[type] || "Unknown";
  }

  /**
   * Calculate link path for SVG
   * @param {Object} sourcePos - Source task position {left, top, width, height}
   * @param {Object} targetPos - Target task position {left, top, width, height}
   * @param {string} type - Link type
   * @returns {string} SVG path data
   */
  calculateLinkPath(sourcePos, targetPos, type = "0") {
    let startX, startY, endX, endY;

    // Calculate connection points based on link type
    switch (type) {
      case "1": // Start-to-Start
        startX = sourcePos.left;
        startY = sourcePos.top + sourcePos.height / 2;
        endX = targetPos.left;
        endY = targetPos.top + targetPos.height / 2;
        break;

      case "2": // Finish-to-Finish
        startX = sourcePos.left + sourcePos.width;
        startY = sourcePos.top + sourcePos.height / 2;
        endX = targetPos.left + targetPos.width;
        endY = targetPos.top + targetPos.height / 2;
        break;

      case "3": // Start-to-Finish
        startX = sourcePos.left;
        startY = sourcePos.top + sourcePos.height / 2;
        endX = targetPos.left + targetPos.width;
        endY = targetPos.top + targetPos.height / 2;
        break;

      case "0": // Finish-to-Start (default)
      default:
        startX = sourcePos.left + sourcePos.width;
        startY = sourcePos.top + sourcePos.height / 2;
        endX = targetPos.left;
        endY = targetPos.top + targetPos.height / 2;
        break;
    }

    // Create curved path
    const midX = (startX + endX) / 2;
    const offsetX = Math.abs(endX - startX) * 0.5;

    // Determine path direction
    if (endX > startX) {
      // Normal left-to-right
      return `M ${startX} ${startY}
              C ${startX + offsetX} ${startY},
                ${endX - offsetX} ${endY},
                ${endX} ${endY}`;
    } else {
      // Right-to-left (need to curve around)
      const curveOffset = 20;
      return `M ${startX} ${startY}
              L ${startX + curveOffset} ${startY}
              Q ${startX + curveOffset * 2} ${startY},
                ${startX + curveOffset * 2} ${(startY + endY) / 2}
              L ${startX + curveOffset * 2} ${(startY + endY) / 2}
              Q ${startX + curveOffset * 2} ${endY},
                ${endX - curveOffset} ${endY}
              L ${endX} ${endY}`;
    }
  }

  /**
   * Get arrow marker path
   * @param {number} x - Arrow tip X
   * @param {number} y - Arrow tip Y
   * @param {string} direction - Arrow direction (left, right)
   * @returns {string} SVG path data
   */
  getArrowPath(x, y, direction = "right") {
    const size = 8;
    if (direction === "right") {
      return `M ${x - size} ${y - size / 2} L ${x} ${y} L ${x - size} ${y + size / 2}`;
    } else {
      return `M ${x + size} ${y - size / 2} L ${x} ${y} L ${x + size} ${y + size / 2}`;
    }
  }

  /**
   * Validate all links
   * @param {Array} taskIds - Valid task IDs
   * @returns {Object} Validation result
   */
  validateLinks(taskIds) {
    const errors = [];
    const taskIdSet = new Set(taskIds);

    this.links.forEach((link, index) => {
      if (!taskIdSet.has(link.source)) {
        errors.push(`Link ${index}: Source task ${link.source} not found`);
      }
      if (!taskIdSet.has(link.target)) {
        errors.push(`Link ${index}: Target task ${link.target} not found`);
      }
      if (link.source === link.target) {
        errors.push(`Link ${index}: Self-referencing link`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear all links
   */
  clear() {
    this.links = [];
  }

  /**
   * Get links as JSON
   * @returns {string} JSON string
   */
  toJSON() {
    return JSON.stringify(this.links);
  }

  /**
   * Load links from JSON
   * @param {string} json - JSON string
   */
  fromJSON(json) {
    const links = JSON.parse(json);
    this.init(links);
  }
}

export { LinkManager };
