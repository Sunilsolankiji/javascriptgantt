import { describe, it, expect, beforeEach, vi } from "vitest";

// Test EventManager
import { EventManager } from "../../src/modules/EventManager.js";

describe("EventManager", () => {
  let eventManager;

  beforeEach(() => {
    eventManager = new EventManager();
  });

  describe("on/off", () => {
    it("should register event listener", () => {
      const callback = vi.fn();
      eventManager.on("test", callback);
      eventManager.emit("test", { data: "value" });

      expect(callback).toHaveBeenCalledWith({ data: "value" });
    });

    it("should remove event listener", () => {
      const callback = vi.fn();
      eventManager.on("test", callback);
      eventManager.off("test", callback);
      eventManager.emit("test");

      expect(callback).not.toHaveBeenCalled();
    });

    it("should return unsubscribe function", () => {
      const callback = vi.fn();
      const unsubscribe = eventManager.on("test", callback);

      unsubscribe();
      eventManager.emit("test");

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("emit", () => {
    it("should call all listeners", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventManager.on("test", callback1);
      eventManager.on("test", callback2);
      eventManager.emit("test", { data: "value" });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it("should return false if no listeners", () => {
      const result = eventManager.emit("nonexistent");
      expect(result).toBe(false);
    });

    it("should return true if listeners exist", () => {
      eventManager.on("test", () => {});
      const result = eventManager.emit("test");
      expect(result).toBe(true);
    });
  });

  describe("once", () => {
    it("should call listener only once", () => {
      const callback = vi.fn();
      eventManager.once("test", callback);

      eventManager.emit("test");
      eventManager.emit("test");

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("hasListeners", () => {
    it("should return true if has listeners", () => {
      eventManager.on("test", () => {});
      expect(eventManager.hasListeners("test")).toBe(true);
    });

    it("should return false if no listeners", () => {
      expect(eventManager.hasListeners("test")).toBe(false);
    });
  });

  describe("getEventNames", () => {
    it("should return registered event names", () => {
      eventManager.on("event1", () => {});
      eventManager.on("event2", () => {});

      const names = eventManager.getEventNames();
      expect(names).toContain("event1");
      expect(names).toContain("event2");
    });
  });

  describe("removeAllListeners", () => {
    it("should remove all listeners", () => {
      const callback = vi.fn();
      eventManager.on("test", callback);
      eventManager.removeAllListeners();
      eventManager.emit("test");

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("debounce", () => {
    it("should debounce function calls", async () => {
      const callback = vi.fn();
      const debounced = eventManager.debounce(callback, 50);

      debounced();
      debounced();
      debounced();

      expect(callback).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    it("should throttle function calls", async () => {
      const callback = vi.fn();
      const throttled = eventManager.throttle(callback, 50);

      throttled();
      throttled();
      throttled();

      expect(callback).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 100));
      throttled();

      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});

// Test TaskManager
import { TaskManager } from "../../src/modules/TaskManager.js";

describe("TaskManager", () => {
  let taskManager;
  const sampleTasks = [
    { id: 1, name: "Task 1", start_date: "2024-01-01", duration: 5 },
    { id: 2, name: "Task 2", start_date: "2024-01-06", duration: 3, parent: 1 },
    { id: 3, name: "Task 3", start_date: "2024-01-10", duration: 2 },
  ];

  beforeEach(() => {
    taskManager = new TaskManager();
    taskManager.init(sampleTasks);
  });

  describe("init", () => {
    it("should initialize with tasks", () => {
      expect(taskManager.getTaskCount()).toBe(3);
    });
  });

  describe("getTask", () => {
    it("should get task by id", () => {
      const task = taskManager.getTask(1);
      expect(task.name).toBe("Task 1");
    });

    it("should return null for non-existent task", () => {
      const task = taskManager.getTask(999);
      expect(task).toBeNull();
    });
  });

  describe("addTask", () => {
    it("should add a new task", () => {
      const newTask = {
        id: 4,
        name: "Task 4",
        start_date: "2024-01-15",
        duration: 3,
      };
      taskManager.addTask(newTask);

      expect(taskManager.getTaskCount()).toBe(4);
      expect(taskManager.getTask(4)).toBeDefined();
    });

    it("should throw error for duplicate id", () => {
      const duplicateTask = {
        id: 1,
        name: "Duplicate",
        start_date: "2024-01-01",
        duration: 1,
      };
      expect(() => taskManager.addTask(duplicateTask)).toThrow();
    });
  });

  describe("updateTask", () => {
    it("should update task properties", () => {
      taskManager.updateTask({ id: 1, name: "Updated Task 1" });
      const task = taskManager.getTask(1);
      expect(task.name).toBe("Updated Task 1");
    });

    it("should return null for non-existent task", () => {
      const result = taskManager.updateTask({ id: 999, name: "Nothing" });
      expect(result).toBe(null);
    });
  });

  describe("deleteTask", () => {
    it("should delete task", () => {
      taskManager.deleteTask(3);
      expect(taskManager.getTaskCount()).toBe(2);
      expect(taskManager.getTask(3)).toBeNull();
    });

    it("should return null for non-existent task", () => {
      const result = taskManager.deleteTask(999);
      expect(result).toBe(null);
    });
  });

  describe("flattenTasks", () => {
    it("should return flat array of all tasks", () => {
      const flat = taskManager.flattenTasks();
      expect(flat.length).toBe(3);
    });
  });

  describe("search", () => {
    it("should find tasks by name", () => {
      const results = taskManager.search("Task 1");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(1);
    });

    it("should return all tasks for empty query", () => {
      const results = taskManager.search("");
      expect(results.length).toBe(3);
    });
  });

  describe("expand/collapse", () => {
    it("should expand task", () => {
      taskManager.expand(1);
      expect(taskManager.isExpanded(1)).toBe(true);
    });

    it("should collapse task", () => {
      taskManager.expand(1);
      taskManager.collapse(1);
      expect(taskManager.isExpanded(1)).toBe(false);
    });

    it("should toggle task", () => {
      taskManager.toggle(1);
      expect(taskManager.isExpanded(1)).toBe(true);
      taskManager.toggle(1);
      expect(taskManager.isExpanded(1)).toBe(false);
    });
  });

  describe("select/deselect", () => {
    it("should select task", () => {
      taskManager.select(1);
      const selected = taskManager.getSelectedTask();
      expect(selected.id).toBe(1);
    });

    it("should deselect task", () => {
      taskManager.select(1);
      taskManager.deselect();
      expect(taskManager.getSelectedTask()).toBe(null);
    });
  });

  describe("sort", () => {
    it("should sort tasks by property", () => {
      const unsortedTasks = [
        { id: 1, name: "C", start_date: "2024-01-03", duration: 1 },
        { id: 2, name: "A", start_date: "2024-01-01", duration: 1 },
        { id: 3, name: "B", start_date: "2024-01-02", duration: 1 },
      ];

      const tm = new TaskManager();
      tm.init(unsortedTasks);
      tm.sort("name", true);

      const flat = tm.flattenTasks();
      expect(flat[0].name).toBe("A");
      expect(flat[2].name).toBe("C");
    });
  });
});

// Test LinkManager
import { LinkManager } from "../../src/modules/LinkManager.js";

describe("LinkManager", () => {
  let linkManager;

  beforeEach(() => {
    linkManager = new LinkManager();
  });

  describe("addLink", () => {
    it("should add a link", () => {
      const link = linkManager.addLink({ source: 1, target: 2 });
      expect(link.source).toBe(1);
      expect(link.target).toBe(2);
    });

    it("should throw for missing source/target", () => {
      expect(() => linkManager.addLink({ source: 1 })).toThrow();
    });

    it("should prevent duplicate links", () => {
      linkManager.addLink({ source: 1, target: 2 });
      expect(() => linkManager.addLink({ source: 1, target: 2 })).toThrow();
    });
  });

  describe("removeLink", () => {
    it("should remove link", () => {
      linkManager.addLink({ source: 1, target: 2 });
      const removed = linkManager.removeLink(1, 2);
      expect(removed).not.toBe(null);
      expect(linkManager.getLink(1, 2)).toBe(null);
    });
  });

  describe("getTaskLinks", () => {
    it("should get incoming and outgoing links", () => {
      linkManager.addLink({ source: 1, target: 2 });
      linkManager.addLink({ source: 2, target: 3 });

      const links = linkManager.getTaskLinks(2);
      expect(links.incoming.length).toBe(1);
      expect(links.outgoing.length).toBe(1);
    });
  });

  describe("getPredecessors/getSuccessors", () => {
    it("should get predecessors", () => {
      linkManager.addLink({ source: 1, target: 2 });
      linkManager.addLink({ source: 3, target: 2 });

      const predecessors = linkManager.getPredecessors(2);
      expect(predecessors).toContain(1);
      expect(predecessors).toContain(3);
    });

    it("should get successors", () => {
      linkManager.addLink({ source: 1, target: 2 });
      linkManager.addLink({ source: 1, target: 3 });

      const successors = linkManager.getSuccessors(1);
      expect(successors).toContain(2);
      expect(successors).toContain(3);
    });
  });

  describe("wouldCreateCycle", () => {
    it("should detect potential cycle", () => {
      linkManager.addLink({ source: 1, target: 2 });
      linkManager.addLink({ source: 2, target: 3 });

      // 3 -> 1 would create a cycle
      expect(linkManager.wouldCreateCycle(3, 1)).toBe(true);
    });

    it("should not detect cycle when none exists", () => {
      linkManager.addLink({ source: 1, target: 2 });

      // 3 -> 1 would not create a cycle if 3 is not connected
      expect(linkManager.wouldCreateCycle(3, 1)).toBe(false);
    });
  });

  describe("getLinkTypeName", () => {
    it("should return link type names", () => {
      expect(linkManager.getLinkTypeName("0")).toContain("Finish-to-Start");
      expect(linkManager.getLinkTypeName("1")).toContain("Start-to-Start");
      expect(linkManager.getLinkTypeName("2")).toContain("Finish-to-Finish");
      expect(linkManager.getLinkTypeName("3")).toContain("Start-to-Finish");
    });
  });
});

// Test ScaleManager
import { ScaleManager } from "../../src/modules/ScaleManager.js";

describe("ScaleManager", () => {
  let scaleManager;

  beforeEach(() => {
    scaleManager = new ScaleManager({
      zoomLevel: "day",
      weekStart: 0,
    });
  });

  describe("getScaleConfig", () => {
    it("should return config for each zoom level", () => {
      expect(scaleManager.getScaleConfig("day").scales.length).toBeGreaterThan(
        0
      );
      expect(scaleManager.getScaleConfig("week").scales.length).toBeGreaterThan(
        0
      );
      expect(
        scaleManager.getScaleConfig("month").scales.length
      ).toBeGreaterThan(0);
    });
  });

  describe("addUnit", () => {
    const date = new Date(2024, 0, 15);

    it("should add days", () => {
      const result = scaleManager.addUnit(date, "day", 5);
      expect(result.getDate()).toBe(20);
    });

    it("should add weeks", () => {
      const result = scaleManager.addUnit(date, "week", 2);
      expect(result.getDate()).toBe(29);
    });

    it("should add months", () => {
      const result = scaleManager.addUnit(date, "month", 2);
      expect(result.getMonth()).toBe(2);
    });
  });

  describe("formatDate", () => {
    const date = new Date(2024, 0, 15);

    it("should format with year", () => {
      const result = scaleManager.formatDate(date, "%Y");
      expect(result).toBe("2024");
    });

    it("should format with month", () => {
      const result = scaleManager.formatDate(date, "%F");
      expect(result).toBe("January");
    });

    it("should format with day", () => {
      const result = scaleManager.formatDate(date, "%d");
      expect(result).toBe("15");
    });
  });

  describe("isToday", () => {
    it("should return true for today", () => {
      expect(scaleManager.isToday(new Date())).toBe(true);
    });

    it("should return false for other dates", () => {
      expect(scaleManager.isToday(new Date(2000, 0, 1))).toBe(false);
    });
  });

  describe("isWeekend", () => {
    it("should detect weekends", () => {
      const saturday = new Date(2024, 0, 6);
      const monday = new Date(2024, 0, 8);

      expect(scaleManager.isWeekend(saturday)).toBe(true);
      expect(scaleManager.isWeekend(monday)).toBe(false);
    });
  });

  describe("zoom", () => {
    it("should zoom in", () => {
      scaleManager.setZoomLevel("month");
      scaleManager.zoomIn();
      expect(scaleManager.zoomLevel).toBe("week");
    });

    it("should zoom out", () => {
      scaleManager.setZoomLevel("day");
      scaleManager.zoomOut();
      expect(scaleManager.zoomLevel).toBe("week");
    });
  });

  describe("getWeekNumber", () => {
    it("should return week number", () => {
      const date = new Date(2024, 0, 15);
      const weekNum = scaleManager.getWeekNumber(date);
      expect(weekNum).toBeGreaterThan(0);
      expect(weekNum).toBeLessThanOrEqual(53);
    });
  });
});
