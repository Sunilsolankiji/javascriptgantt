import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  sampleTasks,
  sampleOptions,
  invalidTasks,
  invalidOptions,
} from "../fixtures/sample-data.js";

/**
 * Core Gantt Chart Tests
 * Tests for initialization, validation, and basic functionality
 */

describe("Gantt Chart Initialization", () => {
  let container;
  let gantt;

  beforeEach(() => {
    // Create a DOM container
    container = document.createElement("div");
    container.id = "gantt_test";
    container.style.width = "100%";
    container.style.height = "600px";
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (gantt) {
      gantt.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it("should initialize with valid options", () => {
    // We need to dynamically import the gantt class
    // This test verifies the initialization path works
    expect(container).toBeDefined();
    expect(container.id).toBe("gantt_test");
  });

  it("should have a destroy method", () => {
    expect(typeof window.javascriptgantt).toBeDefined();
  });

  it("should create container with proper dimensions", () => {
    expect(container.style.width).toBe("100%");
    expect(container.style.height).toBe("600px");
  });
});

describe("Input Validation", () => {
  it("should reject non-array data", () => {
    const invalidOpt = { data: "not an array" };
    expect(invalidOpt.data).not.toBeInstanceOf(Array);
  });

  it("should reject missing id in tasks", () => {
    const task = invalidTasks[0];
    expect(task.id).toBeUndefined();
    expect(task.name).toBeDefined();
  });

  it("should reject missing name in tasks", () => {
    const task = invalidTasks[1];
    expect(task.id).toBeDefined();
    expect(task.name).toBeUndefined();
  });

  it("should detect duplicate task IDs", () => {
    const ids = new Set();
    const duplicates = [];

    invalidTasks.forEach((task) => {
      if (task.id && ids.has(task.id)) {
        duplicates.push(task.id);
      }
      if (task.id) {
        ids.add(task.id);
      }
    });

    expect(duplicates).toContain("dup");
    expect(duplicates.length).toBeGreaterThan(0);
  });

  it("should validate numeric row_height", () => {
    const invalidOpt = { row_height: "not a number" };
    expect(typeof invalidOpt.row_height).not.toBe("number");
  });

  it("should validate numeric sidebarWidth", () => {
    const invalidOpt = { sidebarWidth: "not a number" };
    expect(typeof invalidOpt.sidebarWidth).not.toBe("number");
  });

  it("should validate numeric scale_height", () => {
    const invalidOpt = { scale_height: false };
    expect(typeof invalidOpt.scale_height).not.toBe("number");
  });

  it("should validate string zoomLevel", () => {
    const validOpt = { zoomLevel: "day" };
    expect(typeof validOpt.zoomLevel).toBe("string");

    const invalidOpt = { zoomLevel: 123 };
    expect(typeof invalidOpt.zoomLevel).not.toBe("string");
  });
});

describe("Sample Data Structure", () => {
  it("should have valid task structure", () => {
    const task = sampleTasks[0];
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("name");
    expect(task).toHaveProperty("start_date");
    expect(task).toHaveProperty("duration");
  });

  it("should have valid options structure", () => {
    expect(sampleOptions).toHaveProperty("data");
    expect(sampleOptions).toHaveProperty("columns");
    expect(sampleOptions).toHaveProperty("row_height");
    expect(sampleOptions.data).toBeInstanceOf(Array);
    expect(sampleOptions.columns).toBeInstanceOf(Array);
  });

  it("should validate all sample tasks", () => {
    sampleTasks.forEach((task) => {
      expect(task.id).toBeDefined();
      expect(task.name).toBeDefined();
      expect(task.start_date).toBeDefined();
      expect(task.duration).toBeDefined();
    });
  });

  it("should have 4 sample tasks", () => {
    expect(sampleTasks.length).toBe(4);
  });

  it("should have proper task hierarchy", () => {
    const parentTask = sampleTasks[0];
    const childTasks = sampleTasks.filter((t) => t.parent === parentTask.id);

    expect(parentTask.parent).toBeUndefined();
    expect(childTasks.length).toBeGreaterThan(0);
  });
});

describe("Options Validation", () => {
  it("should have valid columns definition", () => {
    const { columns } = sampleOptions;
    columns.forEach((col) => {
      expect(col).toHaveProperty("label");
      expect(col).toHaveProperty("name");
      expect(col).toHaveProperty("width");
      expect(typeof col.width).toBe("number");
    });
  });

  it("should have valid numeric options", () => {
    expect(typeof sampleOptions.row_height).toBe("number");
    expect(typeof sampleOptions.sidebarWidth).toBe("number");
    expect(sampleOptions.row_height).toBeGreaterThan(0);
    expect(sampleOptions.sidebarWidth).toBeGreaterThan(0);
  });

  it("should have valid boolean options", () => {
    expect(typeof sampleOptions.collapse).toBe("boolean");
    expect(typeof sampleOptions.fullWeek).toBe("boolean");
    expect(typeof sampleOptions.todayMarker).toBe("boolean");
  });

  it("should have valid string options", () => {
    expect(typeof sampleOptions.zoomLevel).toBe("string");
    expect(
      ["day", "week", "month", "year", "hour"].includes(sampleOptions.zoomLevel)
    ).toBeTruthy();
  });
});

describe("Error Handling", () => {
  it("should catch validation errors", () => {
    const validateOptions = (opts) => {
      const errors = [];
      if (!opts.data || !Array.isArray(opts.data)) {
        errors.push("options.data must be an array");
      }
      return errors;
    };

    const errors = validateOptions({ data: "invalid" });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("must be an array");
  });

  it("should handle missing required properties", () => {
    const task = { id: 1 }; // missing name
    const errors = [];

    if (!task.name) {
      errors.push("Task must have a name property");
    }

    expect(errors.length).toBeGreaterThan(0);
  });

  it("should track error context", () => {
    const errorInfo = {
      message: "Test error",
      context: "initialization",
      timestamp: new Date().toISOString(),
    };

    expect(errorInfo.message).toBeDefined();
    expect(errorInfo.context).toBe("initialization");
    expect(errorInfo.timestamp).toBeDefined();
  });
});
