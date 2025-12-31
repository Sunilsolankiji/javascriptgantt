/**
 * TaskManager Module
 * Handles task data operations (CRUD, filtering, sorting)
 */

import {
  deepClone,
  findBy,
  filterBy,
  sortBy,
  uniqueBy,
} from "../utils/dataUtils.js";
import { validateTask, checkDuplicateIds } from "../utils/validators.js";
import { parseDate, addDays, daysBetween } from "../utils/dateUtils.js";

class TaskManager {
  constructor(options = {}) {
    this.tasks = [];
    this.originalData = [];
    this.openedTasks = [];
    this.selectedTask = null;
    this.options = options;
  }

  /**
   * Initialize tasks from data
   * @param {Array} data - Task data array
   */
  init(data = []) {
    this.originalData = deepClone(data);
    this.tasks = this.buildTaskTree(data);
    this.validateTasks();
  }

  /**
   * Build hierarchical task tree from flat array
   * @param {Array} data - Flat task array
   * @returns {Array} Hierarchical task array
   */
  buildTaskTree(data) {
    const taskMap = new Map();
    const rootTasks = [];

    // First pass: create task map
    data.forEach((task) => {
      taskMap.set(task.id, { ...task, children: task.children || [] });
    });

    // Second pass: build tree
    data.forEach((task) => {
      const taskNode = taskMap.get(task.id);
      if (task.parent && taskMap.has(task.parent)) {
        const parent = taskMap.get(task.parent);
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(taskNode);
      } else if (!task.parent) {
        rootTasks.push(taskNode);
      }
    });

    return rootTasks;
  }

  /**
   * Flatten task tree to array
   * @param {Array} tasks - Hierarchical tasks
   * @returns {Array} Flat task array
   */
  flattenTasks(tasks = this.tasks) {
    const result = [];

    const flatten = (taskList) => {
      taskList.forEach((task) => {
        result.push(task);
        if (task.children && task.children.length > 0) {
          flatten(task.children);
        }
      });
    };

    flatten(tasks);
    return result;
  }

  /**
   * Get task by ID
   * @param {string|number} id - Task ID
   * @returns {Object|null} Task or null
   */
  getTask(id) {
    const allTasks = this.flattenTasks();
    return findBy(allTasks, "id", id);
  }

  /**
   * Add a new task
   * @param {Object} task - Task to add
   * @returns {Object} Added task
   */
  addTask(task) {
    const validation = validateTask(task);
    if (!validation.valid) {
      throw new Error(`Invalid task: ${validation.errors.join(", ")}`);
    }

    // Check for duplicate ID
    if (this.getTask(task.id)) {
      throw new Error(`Task with ID ${task.id} already exists`);
    }

    // Add to original data
    this.originalData.unshift(task);

    // Add to tree
    if (task.parent) {
      const parent = this.getTask(task.parent);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.unshift(task);
      } else {
        this.tasks.unshift(task);
      }
    } else {
      this.tasks.unshift(task);
    }

    return task;
  }

  /**
   * Update an existing task
   * @param {Object} taskData - Updated task data (must include id)
   * @returns {Object|null} Updated task or null
   */
  updateTask(taskData) {
    const task = this.getTask(taskData.id);
    if (!task) {
      return null;
    }

    // Update properties
    Object.assign(task, taskData);

    // Update in original data
    const originalIndex = this.originalData.findIndex(
      (t) => t.id === taskData.id
    );
    if (originalIndex !== -1) {
      this.originalData[originalIndex] = {
        ...this.originalData[originalIndex],
        ...taskData,
      };
    }

    return task;
  }

  /**
   * Delete a task
   * @param {string|number} id - Task ID
   * @returns {Object|null} Deleted task or null
   */
  deleteTask(id) {
    const task = this.getTask(id);
    if (!task) {
      return null;
    }

    // Remove from original data
    const originalIndex = this.originalData.findIndex((t) => t.id === id);
    if (originalIndex !== -1) {
      this.originalData.splice(originalIndex, 1);
    }

    // Remove from tree
    this.removeFromTree(this.tasks, id);

    return task;
  }

  /**
   * Remove task from tree recursively
   * @param {Array} tasks - Task array
   * @param {string|number} id - Task ID to remove
   * @returns {boolean} True if removed
   */
  removeFromTree(tasks, id) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks.splice(index, 1);
      return true;
    }

    for (const task of tasks) {
      if (task.children && task.children.length > 0) {
        if (this.removeFromTree(task.children, id)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Move task to new parent
   * @param {string|number} taskId - Task to move
   * @param {string|number|null} newParentId - New parent ID (null for root)
   * @returns {boolean} True if moved
   */
  moveTask(taskId, newParentId) {
    const task = this.getTask(taskId);
    if (!task) {
      return false;
    }

    // Prevent circular reference
    if (taskId === newParentId) {
      return false;
    }

    // Remove from current location
    this.removeFromTree(this.tasks, taskId);

    // Add to new location
    if (newParentId) {
      const newParent = this.getTask(newParentId);
      if (newParent) {
        if (!newParent.children) {
          newParent.children = [];
        }
        newParent.children.push(task);
        task.parent = newParentId;
      }
    } else {
      this.tasks.push(task);
      delete task.parent;
    }

    return true;
  }

  /**
   * Sort tasks
   * @param {string} property - Property to sort by
   * @param {boolean} ascending - Sort direction
   */
  sort(property, ascending = true) {
    const sortRecursive = (tasks) => {
      tasks.sort((a, b) => {
        let valA = a[property];
        let valB = b[property];

        // Handle dates
        if (property === "start_date" || property === "end_date") {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        if (valA < valB) {
          return ascending ? -1 : 1;
        }
        if (valA > valB) {
          return ascending ? 1 : -1;
        }
        return 0;
      });

      tasks.forEach((task) => {
        if (task.children && task.children.length > 0) {
          sortRecursive(task.children);
        }
      });
    };

    sortRecursive(this.tasks);
  }

  /**
   * Filter tasks
   * @param {Function} predicate - Filter function
   * @returns {Array} Filtered tasks
   */
  filter(predicate) {
    const allTasks = this.flattenTasks();
    return allTasks.filter(predicate);
  }

  /**
   * Search tasks by text
   * @param {string} query - Search query
   * @param {string[]} fields - Fields to search
   * @returns {Array} Matching tasks
   */
  search(query, fields = ["name", "text", "description"]) {
    if (!query) {
      return this.flattenTasks();
    }

    const lowerQuery = query.toLowerCase();
    return this.filter((task) => {
      return fields.some((field) => {
        const value = task[field];
        return value && String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }

  /**
   * Get tasks by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Tasks in range
   */
  getTasksByDateRange(startDate, endDate) {
    return this.filter((task) => {
      const taskStart = parseDate(task.start_date);
      const taskEnd = task.end_date
        ? parseDate(task.end_date)
        : addDays(taskStart, task.duration || 0);

      return taskStart <= endDate && taskEnd >= startDate;
    });
  }

  /**
   * Get child tasks
   * @param {string|number} parentId - Parent task ID
   * @returns {Array} Child tasks
   */
  getChildren(parentId) {
    const parent = this.getTask(parentId);
    return parent ? parent.children || [] : [];
  }

  /**
   * Get parent task
   * @param {string|number} taskId - Task ID
   * @returns {Object|null} Parent task or null
   */
  getParent(taskId) {
    const task = this.getTask(taskId);
    if (!task || !task.parent) {
      return null;
    }
    return this.getTask(task.parent);
  }

  /**
   * Expand task (show children)
   * @param {string|number} taskId - Task ID
   */
  expand(taskId) {
    if (!this.openedTasks.includes(taskId)) {
      this.openedTasks.push(taskId);
    }
  }

  /**
   * Collapse task (hide children)
   * @param {string|number} taskId - Task ID
   */
  collapse(taskId) {
    const index = this.openedTasks.indexOf(taskId);
    if (index > -1) {
      this.openedTasks.splice(index, 1);
    }
  }

  /**
   * Toggle task expanded state
   * @param {string|number} taskId - Task ID
   */
  toggle(taskId) {
    if (this.isExpanded(taskId)) {
      this.collapse(taskId);
    } else {
      this.expand(taskId);
    }
  }

  /**
   * Check if task is expanded
   * @param {string|number} taskId - Task ID
   * @returns {boolean} True if expanded
   */
  isExpanded(taskId) {
    return this.openedTasks.includes(taskId);
  }

  /**
   * Expand all tasks
   */
  expandAll() {
    const allTasks = this.flattenTasks();
    this.openedTasks = allTasks
      .filter((t) => t.children && t.children.length > 0)
      .map((t) => t.id);
  }

  /**
   * Collapse all tasks
   */
  collapseAll() {
    this.openedTasks = [];
  }

  /**
   * Select a task
   * @param {string|number} taskId - Task ID
   */
  select(taskId) {
    this.selectedTask = taskId;
  }

  /**
   * Deselect current task
   */
  deselect() {
    this.selectedTask = null;
  }

  /**
   * Get selected task
   * @returns {Object|null} Selected task or null
   */
  getSelectedTask() {
    return this.selectedTask ? this.getTask(this.selectedTask) : null;
  }

  /**
   * Validate all tasks
   * @returns {Object} Validation result
   */
  validateTasks() {
    const allTasks = this.flattenTasks();
    const errors = [];

    allTasks.forEach((task, index) => {
      const validation = validateTask(task);
      if (!validation.valid) {
        errors.push(`Task ${index}: ${validation.errors.join(", ")}`);
      }
    });

    const duplicates = checkDuplicateIds(allTasks, "id");
    if (duplicates.hasDuplicates) {
      errors.push(`Duplicate IDs found: ${duplicates.duplicates.join(", ")}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate task progress based on children
   * @param {string|number} taskId - Task ID
   * @returns {number} Progress percentage
   */
  calculateProgress(taskId) {
    const task = this.getTask(taskId);
    if (!task || !task.children || task.children.length === 0) {
      return task?.progress || 0;
    }

    const totalProgress = task.children.reduce((sum, child) => {
      return sum + (child.progress || 0);
    }, 0);

    return Math.round(totalProgress / task.children.length);
  }

  /**
   * Update task dates based on duration
   */
  updateTaskDuration() {
    const allTasks = this.flattenTasks();
    allTasks.forEach((task) => {
      if (task.start_date && task.duration) {
        const startDate = parseDate(task.start_date);
        const endDate = addDays(startDate, task.duration - 1);
        task.end_date = endDate;
      }
    });
  }

  /**
   * Get task count
   * @returns {number} Total task count
   */
  getTaskCount() {
    return this.flattenTasks().length;
  }

  /**
   * Get tasks as JSON
   * @returns {string} JSON string
   */
  toJSON() {
    return JSON.stringify(this.originalData);
  }

  /**
   * Load tasks from JSON
   * @param {string} json - JSON string
   */
  fromJSON(json) {
    const data = JSON.parse(json);
    this.init(data);
  }
}

export { TaskManager };
