/**
 * DragDropManager Module
 * Handles drag and drop operations for tasks
 */

class DragDropManager {
  constructor(gantt, options = {}) {
    this.gantt = gantt;
    this.options = options;
    this.isDragging = false;
    this.isResizing = false;
    this.dragData = null;
    this.startPosition = null;
    this.originalPosition = null;
    this.listeners = [];
  }

  /**
   * Initialize drag and drop
   */
  init() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const { element } = this.gantt;

    // Mouse events
    this.addListener(element, "mousedown", this.handleMouseDown.bind(this));
    this.addListener(document, "mousemove", this.handleMouseMove.bind(this));
    this.addListener(document, "mouseup", this.handleMouseUp.bind(this));

    // Touch events
    this.addListener(element, "touchstart", this.handleTouchStart.bind(this), {
      passive: false,
    });
    this.addListener(document, "touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.addListener(document, "touchend", this.handleTouchEnd.bind(this));
  }

  /**
   * Add event listener with tracking
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Handler function
   * @param {Object} options - Event options
   */
  addListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }

  /**
   * Handle mouse down
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseDown(e) {
    const { target } = e;
    const taskBar = this.getTaskBar(target);

    if (!taskBar) {
      return;
    }

    const taskId = taskBar.getAttribute("js-gantt-taskbar-id");
    const task = this.gantt.getTask(taskId);

    if (!task) {
      return;
    }

    // Check if resizing
    if (target.classList.contains("js-gantt-taskbar-resizer")) {
      this.startResize(e, taskBar, task, target.dataset.direction);
    }
    // Check if dragging
    else if (this.canDrag(taskBar)) {
      this.startDrag(e, taskBar, task);
    }
  }

  /**
   * Handle mouse move
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    if (this.isDragging) {
      this.updateDrag(e);
    } else if (this.isResizing) {
      this.updateResize(e);
    }
  }

  /**
   * Handle mouse up
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseUp(e) {
    if (this.isDragging) {
      this.endDrag(e);
    } else if (this.isResizing) {
      this.endResize(e);
    }
  }

  /**
   * Handle touch start
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    if (e.touches.length !== 1) {
      return;
    }

    const touch = e.touches[0];
    const mouseEvent = this.createMouseEvent("mousedown", touch);
    this.handleMouseDown(mouseEvent);
  }

  /**
   * Handle touch move
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (!this.isDragging && !this.isResizing) {
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = this.createMouseEvent("mousemove", touch);
    this.handleMouseMove(mouseEvent);
  }

  /**
   * Handle touch end
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    const mouseEvent = this.createMouseEvent("mouseup", e.changedTouches[0]);
    this.handleMouseUp(mouseEvent);
  }

  /**
   * Create mouse event from touch
   * @param {string} type - Event type
   * @param {Touch} touch - Touch object
   * @returns {MouseEvent} Mouse event
   */
  createMouseEvent(type, touch) {
    return new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY,
      screenX: touch.screenX,
      screenY: touch.screenY,
    });
  }

  /**
   * Start drag operation
   * @param {MouseEvent} e - Mouse event
   * @param {HTMLElement} taskBar - Task bar element
   * @param {Object} task - Task data
   */
  startDrag(e, taskBar, task) {
    this.isDragging = true;
    this.dragData = {
      taskBar,
      task,
      startX: e.clientX,
      startY: e.clientY,
      originalLeft: taskBar.offsetLeft,
      originalTop: taskBar.offsetTop,
    };

    taskBar.classList.add("js-gantt-dragging");
    document.body.style.cursor = "move";

    // Emit event
    this.emit("onDragStart", { task, event: e });
  }

  /**
   * Update drag position
   * @param {MouseEvent} e - Mouse event
   */
  updateDrag(e) {
    if (!this.dragData) {
      return;
    }

    const { taskBar, startX, originalLeft } = this.dragData;
    const deltaX = e.clientX - startX;
    const newLeft = originalLeft + deltaX;

    // Apply constraints
    const constrainedLeft = Math.max(0, newLeft);
    taskBar.style.left = `${constrainedLeft}px`;

    // Emit event
    this.emit("onDrag", {
      task: this.dragData.task,
      deltaX,
      newLeft: constrainedLeft,
      event: e,
    });
  }

  /**
   * End drag operation
   * @param {MouseEvent} e - Mouse event
   */
  endDrag(e) {
    if (!this.dragData) {
      return;
    }

    const { taskBar, task, originalLeft } = this.dragData;
    const finalLeft = taskBar.offsetLeft;
    const deltaX = finalLeft - originalLeft;

    taskBar.classList.remove("js-gantt-dragging");
    document.body.style.cursor = "";

    // Calculate new date
    const newDate = this.calculateDateFromPosition(finalLeft);

    // Emit event
    this.emit("onDragEnd", {
      task,
      deltaX,
      newDate,
      event: e,
    });

    this.isDragging = false;
    this.dragData = null;
  }

  /**
   * Start resize operation
   * @param {MouseEvent} e - Mouse event
   * @param {HTMLElement} taskBar - Task bar element
   * @param {Object} task - Task data
   * @param {string} direction - Resize direction (left, right)
   */
  startResize(e, taskBar, task, direction) {
    e.preventDefault();
    e.stopPropagation();

    this.isResizing = true;
    this.dragData = {
      taskBar,
      task,
      direction,
      startX: e.clientX,
      originalLeft: taskBar.offsetLeft,
      originalWidth: taskBar.offsetWidth,
    };

    taskBar.classList.add("js-gantt-resizing");
    document.body.style.cursor = direction === "left" ? "w-resize" : "e-resize";

    // Emit event
    this.emit("onResizeStart", { task, direction, event: e });
  }

  /**
   * Update resize
   * @param {MouseEvent} e - Mouse event
   */
  updateResize(e) {
    if (!this.dragData) {
      return;
    }

    const { taskBar, direction, startX, originalLeft, originalWidth } =
      this.dragData;
    const deltaX = e.clientX - startX;

    if (direction === "right") {
      const newWidth = Math.max(20, originalWidth + deltaX);
      taskBar.style.width = `${newWidth}px`;
    } else if (direction === "left") {
      const newLeft = originalLeft + deltaX;
      const newWidth = originalWidth - deltaX;
      if (newWidth > 20) {
        taskBar.style.left = `${newLeft}px`;
        taskBar.style.width = `${newWidth}px`;
      }
    }

    // Emit event
    this.emit("onResize", {
      task: this.dragData.task,
      direction,
      deltaX,
      event: e,
    });
  }

  /**
   * End resize operation
   * @param {MouseEvent} e - Mouse event
   */
  endResize(e) {
    if (!this.dragData) {
      return;
    }

    const { taskBar, task, direction } = this.dragData;

    taskBar.classList.remove("js-gantt-resizing");
    document.body.style.cursor = "";

    // Calculate new dates
    const newStartDate = this.calculateDateFromPosition(taskBar.offsetLeft);
    const newEndDate = this.calculateDateFromPosition(
      taskBar.offsetLeft + taskBar.offsetWidth
    );

    // Emit event
    this.emit("onResizeEnd", {
      task,
      direction,
      newStartDate,
      newEndDate,
      event: e,
    });

    this.isResizing = false;
    this.dragData = null;
  }

  /**
   * Calculate date from pixel position
   * @param {number} position - Pixel position
   * @returns {Date} Calculated date
   */
  calculateDateFromPosition(position) {
    const columnWidth = this.options.columnWidth || 40;
    const dayIndex = Math.floor(position / columnWidth);
    const startDate = new Date(this.gantt.options.startDate);

    const result = new Date(startDate);
    result.setDate(result.getDate() + dayIndex);

    return result;
  }

  /**
   * Get task bar element from target
   * @param {HTMLElement} target - Target element
   * @returns {HTMLElement|null} Task bar element
   */
  getTaskBar(target) {
    if (target.hasAttribute("js-gantt-taskbar-id")) {
      return target;
    }
    return target.closest("[js-gantt-taskbar-id]");
  }

  /**
   * Check if task bar can be dragged
   * @param {HTMLElement} taskBar - Task bar element
   * @returns {boolean} True if draggable
   */
  canDrag(taskBar) {
    if (taskBar.classList.contains("js-gantt-bar-parent-task")) {
      return false; // Parent tasks typically can't be dragged directly
    }
    return true;
  }

  /**
   * Emit event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   */
  emit(eventName, data) {
    if (this.gantt.dispatchEvent) {
      this.gantt.dispatchEvent(eventName, data);
    }
  }

  /**
   * Enable drag and drop
   */
  enable() {
    this.options.enabled = true;
  }

  /**
   * Disable drag and drop
   */
  disable() {
    this.options.enabled = false;
    if (this.isDragging) {
      this.cancelDrag();
    }
    if (this.isResizing) {
      this.cancelResize();
    }
  }

  /**
   * Cancel current drag operation
   */
  cancelDrag() {
    if (!this.isDragging || !this.dragData) {
      return;
    }

    const { taskBar, originalLeft } = this.dragData;
    taskBar.style.left = `${originalLeft}px`;
    taskBar.classList.remove("js-gantt-dragging");
    document.body.style.cursor = "";

    this.isDragging = false;
    this.dragData = null;
  }

  /**
   * Cancel current resize operation
   */
  cancelResize() {
    if (!this.isResizing || !this.dragData) {
      return;
    }

    const { taskBar, originalLeft, originalWidth } = this.dragData;
    taskBar.style.left = `${originalLeft}px`;
    taskBar.style.width = `${originalWidth}px`;
    taskBar.classList.remove("js-gantt-resizing");
    document.body.style.cursor = "";

    this.isResizing = false;
    this.dragData = null;
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    // Remove all listeners
    this.listeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.listeners = [];

    // Reset state
    this.isDragging = false;
    this.isResizing = false;
    this.dragData = null;
  }
}

export { DragDropManager };
