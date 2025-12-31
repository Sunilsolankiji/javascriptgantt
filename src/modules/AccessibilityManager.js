/**
 * Accessibility Module - ARIA and Keyboard Navigation
 * Adds WCAG 2.1 AA compliance to the Gantt chart
 */

/**
 * AccessibilityManager - Handles ARIA attributes and keyboard navigation
 */
class AccessibilityManager {
  constructor(gantt) {
    this.gantt = gantt;
    this.selectedTaskId = null;
    this.initA11y();
  }

  /**
   * Initialize accessibility features
   */
  initA11y() {
    this.addAriaAttributes();
    this.initKeyboardNavigation();
    this.setupFocusManagement();
  }

  /**
   * Add ARIA attributes to Gantt elements
   */
  addAriaAttributes() {
    const { element } = this.gantt;

    // Main container
    element.setAttribute("role", "region");
    element.setAttribute("aria-label", "Gantt Chart");
    element.setAttribute("aria-live", "polite");
    element.setAttribute("aria-atomic", "false");

    // Task rows
    const taskRows = element.querySelectorAll("[js-gantt-task-id]");
    taskRows.forEach((row, index) => {
      const taskId = row.getAttribute("js-gantt-task-id");
      const task = this.gantt.getTask(taskId);

      if (task) {
        row.setAttribute("role", "presentation");
        row.setAttribute("tabindex", "0");
        row.setAttribute("aria-label", this.getTaskAriaLabel(task));
        row.setAttribute("aria-describedby", `task-desc-${taskId}`);

        // Create description element
        const descEl = document.createElement("div");
        descEl.id = `task-desc-${taskId}`;
        descEl.style.display = "none";
        descEl.textContent = this.getTaskDescription(task);
        row.appendChild(descEl);
      }
    });

    // Task bars
    const taskBars = element.querySelectorAll("[js-gantt-taskbar-id]");
    taskBars.forEach((bar) => {
      const taskId = bar.getAttribute("js-gantt-taskbar-id");
      const task = this.gantt.getTask(taskId);

      if (task) {
        bar.setAttribute("role", "presentation");
        bar.setAttribute("aria-hidden", "false");
        bar.setAttribute("aria-label", `${task.name} bar`);
      }
    });

    // Timeline header
    const scaleHeaders = element.querySelectorAll(".js-gantt-scale-header");
    scaleHeaders.forEach((header) => {
      header.setAttribute("role", "columnheader");
    });

    // Grid cells
    const gridCells = element.querySelectorAll(".grid-cell");
    gridCells.forEach((cell) => {
      cell.setAttribute("role", "gridcell");
    });
  }

  /**
   * Generate ARIA label for task
   */
  getTaskAriaLabel(task) {
    const progress = task.progress ? `, ${task.progress}% complete` : "";
    return `Task: ${task.name}, starts ${task.start_date}${progress}`;
  }

  /**
   * Generate task description
   */
  getTaskDescription(task) {
    const parts = [];
    parts.push(`Task: ${task.name}`);
    parts.push(`Duration: ${task.duration} days`);
    if (task.progress !== undefined) {
      parts.push(`Progress: ${task.progress}%`);
    }
    if (task.type) {
      parts.push(`Type: ${task.type}`);
    }
    if (task.description) {
      parts.push(`Description: ${task.description}`);
    }
    return parts.join(". ");
  }

  /**
   * Initialize keyboard navigation
   */
  initKeyboardNavigation() {
    const { element } = this.gantt;

    element.addEventListener("keydown", (e) => {
      const currentRow = document.activeElement;
      if (!currentRow || !currentRow.hasAttribute("js-gantt-task-id")) {
        return;
      }

      const taskId = currentRow.getAttribute("js-gantt-task-id");

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this.focusNextTask(currentRow);
          break;

        case "ArrowUp":
          e.preventDefault();
          this.focusPreviousTask(currentRow);
          break;

        case "Enter":
        case " ":
          e.preventDefault();
          this.gantt.selectTask({ id: taskId });
          this.openTaskDetails(taskId);
          break;

        case "Delete":
          e.preventDefault();
          if (confirm("Delete this task?")) {
            this.gantt.deleteTask(taskId);
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          this.gantt.expandTask(taskId);
          break;

        case "ArrowLeft":
          e.preventDefault();
          this.gantt.collapseTask(taskId);
          break;

        case "Home":
          e.preventDefault();
          this.focusFirstTask();
          break;

        case "End":
          e.preventDefault();
          this.focusLastTask();
          break;

        default:
          break;
      }
    });

    // Handle Ctrl+C (copy)
    element.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "c") {
        const taskId = document.activeElement?.getAttribute("js-gantt-task-id");
        if (taskId) {
          e.preventDefault();
          this.copyTask(taskId);
        }
      }
    });

    // Handle Ctrl+X (cut)
    element.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "x") {
        const taskId = document.activeElement?.getAttribute("js-gantt-task-id");
        if (taskId) {
          e.preventDefault();
          this.cutTask(taskId);
        }
      }
    });

    // Handle Ctrl+V (paste)
    element.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        this.pasteTask();
      }
    });
  }

  /**
   * Setup focus management for accessibility
   */
  setupFocusManagement() {
    const { element } = this.gantt;

    // Make first task focusable on load
    element.addEventListener("load", () => {
      const firstTask = element.querySelector("[js-gantt-task-id]");
      if (firstTask) {
        firstTask.focus();
      }
    });

    // Restore focus after updates
    this.gantt.on("onAfterRender", () => {
      if (this.selectedTaskId) {
        const taskRow = element.querySelector(
          `[js-gantt-task-id="${this.selectedTaskId}"]`
        );
        if (taskRow) {
          taskRow.focus();
        }
      }
    });
  }

  /**
   * Focus next task
   */
  focusNextTask(currentRow) {
    let nextRow = currentRow.nextElementSibling;
    while (nextRow && !nextRow.hasAttribute("js-gantt-task-id")) {
      nextRow = nextRow.nextElementSibling;
    }
    if (nextRow) {
      nextRow.focus();
    }
  }

  /**
   * Focus previous task
   */
  focusPreviousTask(currentRow) {
    let prevRow = currentRow.previousElementSibling;
    while (prevRow && !prevRow.hasAttribute("js-gantt-task-id")) {
      prevRow = prevRow.previousElementSibling;
    }
    if (prevRow) {
      prevRow.focus();
    }
  }

  /**
   * Focus first task
   */
  focusFirstTask() {
    const firstTask = this.gantt.element.querySelector("[js-gantt-task-id]");
    if (firstTask) {
      firstTask.focus();
    }
  }

  /**
   * Focus last task
   */
  focusLastTask() {
    const allTasks = this.gantt.element.querySelectorAll("[js-gantt-task-id]");
    if (allTasks.length > 0) {
      allTasks[allTasks.length - 1].focus();
    }
  }

  /**
   * Open task details dialog
   */
  openTaskDetails(taskId) {
    const task = this.gantt.getTask(taskId);
    if (task) {
      this.gantt.showLightBox(task);
    }
  }

  /**
   * Copy task to clipboard
   */
  copyTask(taskId) {
    const task = this.gantt.getTask(taskId);
    if (task) {
      window.clipboardData = { task, action: "copy" };
      console.log(`Copied task: ${task.name}`);
    }
  }

  /**
   * Cut task to clipboard
   */
  cutTask(taskId) {
    const task = this.gantt.getTask(taskId);
    if (task) {
      window.clipboardData = { task, action: "cut" };
      console.log(`Cut task: ${task.name}`);
    }
  }

  /**
   * Paste task from clipboard
   */
  pasteTask() {
    if (window.clipboardData && window.clipboardData.task) {
      const { task, action } = window.clipboardData;
      const newTask = { ...task, id: Math.random() };
      this.gantt.addTask(newTask);
      if (action === "cut") {
        this.gantt.deleteTask(task.id);
        window.clipboardData = null;
      }
      console.log(`Pasted task: ${newTask.name}`);
    }
  }

  /**
   * Update ARIA live region
   */
  announceMessage(message) {
    const liveRegion = this.gantt.element.querySelector('[aria-live="polite"]');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }

  /**
   * Enhance color contrast
   */
  enableHighContrast() {
    this.gantt.element.classList.add("high-contrast-mode");
  }

  /**
   * Disable high contrast mode
   */
  disableHighContrast() {
    this.gantt.element.classList.remove("high-contrast-mode");
  }

  /**
   * Check for high contrast preference
   */
  checkHighContrastPreference() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-contrast: more)").matches
    ) {
      this.enableHighContrast();
    }
  }
}

export { AccessibilityManager };
