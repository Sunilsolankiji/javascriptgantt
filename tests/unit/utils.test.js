import { describe, it, expect, beforeEach } from "vitest";

// Test dateUtils
import * as dateUtils from "../../src/utils/dateUtils.js";

describe("Date Utilities", () => {
  describe("parseDate", () => {
    it("should parse date string", () => {
      const date = dateUtils.parseDate("2024-01-15");
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it("should return Date object unchanged", () => {
      const original = new Date(2024, 5, 20);
      const result = dateUtils.parseDate(original);
      expect(result).toBe(original);
    });
  });

  describe("formatDate", () => {
    it("should format date to YYYY-MM-DD", () => {
      const date = new Date(2024, 0, 15);
      const result = dateUtils.formatDate(date);
      expect(result).toBe("2024-01-15");
    });

    it("should pad single digit month and day", () => {
      const date = new Date(2024, 0, 5);
      const result = dateUtils.formatDate(date);
      expect(result).toBe("2024-01-05");
    });
  });

  describe("addDays", () => {
    it("should add positive days", () => {
      const date = new Date(2024, 0, 15);
      const result = dateUtils.addDays(date, 10);
      expect(result.getDate()).toBe(25);
    });

    it("should add negative days", () => {
      const date = new Date(2024, 0, 15);
      const result = dateUtils.addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it("should handle month overflow", () => {
      const date = new Date(2024, 0, 25);
      const result = dateUtils.addDays(date, 10);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });

  describe("daysBetween", () => {
    it("should calculate days between dates", () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 11);
      expect(dateUtils.daysBetween(date1, date2)).toBe(10);
    });

    it("should return 0 for same date", () => {
      const date = new Date(2024, 0, 15);
      expect(dateUtils.daysBetween(date, date)).toBe(0);
    });
  });

  describe("isWeekend", () => {
    it("should return true for Saturday", () => {
      const saturday = new Date(2024, 0, 6); // Saturday
      expect(dateUtils.isWeekend(saturday)).toBe(true);
    });

    it("should return true for Sunday", () => {
      const sunday = new Date(2024, 0, 7); // Sunday
      expect(dateUtils.isWeekend(sunday)).toBe(true);
    });

    it("should return false for Monday", () => {
      const monday = new Date(2024, 0, 8); // Monday
      expect(dateUtils.isWeekend(monday)).toBe(false);
    });
  });

  describe("getQuarter", () => {
    it("should return 1 for Q1", () => {
      expect(dateUtils.getQuarter(new Date(2024, 0, 15))).toBe(1);
      expect(dateUtils.getQuarter(new Date(2024, 1, 15))).toBe(1);
      expect(dateUtils.getQuarter(new Date(2024, 2, 15))).toBe(1);
    });

    it("should return 2 for Q2", () => {
      expect(dateUtils.getQuarter(new Date(2024, 3, 15))).toBe(2);
    });

    it("should return 4 for Q4", () => {
      expect(dateUtils.getQuarter(new Date(2024, 11, 15))).toBe(4);
    });
  });
});

// Test dataUtils
import * as dataUtils from "../../src/utils/dataUtils.js";

describe("Data Utilities", () => {
  describe("deepClone", () => {
    it("should clone objects", () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = dataUtils.deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it("should clone arrays", () => {
      const original = [1, 2, { a: 3 }];
      const cloned = dataUtils.deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it("should handle null", () => {
      expect(dataUtils.deepClone(null)).toBe(null);
    });

    it("should clone dates", () => {
      const original = new Date(2024, 0, 15);
      const cloned = dataUtils.deepClone(original);

      expect(cloned.getTime()).toBe(original.getTime());
      expect(cloned).not.toBe(original);
    });
  });

  describe("findBy", () => {
    const items = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ];

    it("should find item by property", () => {
      const result = dataUtils.findBy(items, "id", 2);
      expect(result.name).toBe("Bob");
    });

    it("should return null if not found", () => {
      const result = dataUtils.findBy(items, "id", 99);
      expect(result).toBe(null);
    });
  });

  describe("sortBy", () => {
    const items = [
      { name: "Charlie", age: 30 },
      { name: "Alice", age: 25 },
      { name: "Bob", age: 35 },
    ];

    it("should sort ascending", () => {
      const result = dataUtils.sortBy(items, "age", true);
      expect(result[0].name).toBe("Alice");
      expect(result[2].name).toBe("Bob");
    });

    it("should sort descending", () => {
      const result = dataUtils.sortBy(items, "age", false);
      expect(result[0].name).toBe("Bob");
      expect(result[2].name).toBe("Alice");
    });
  });

  describe("groupBy", () => {
    const items = [
      { category: "A", value: 1 },
      { category: "B", value: 2 },
      { category: "A", value: 3 },
    ];

    it("should group items by property", () => {
      const result = dataUtils.groupBy(items, "category");
      expect(result.A.length).toBe(2);
      expect(result.B.length).toBe(1);
    });
  });

  describe("unique", () => {
    it("should return unique values", () => {
      const result = dataUtils.unique([1, 2, 2, 3, 3, 3]);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("pick", () => {
    it("should pick specified properties", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = dataUtils.pick(obj, ["a", "c"]);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe("omit", () => {
    it("should omit specified properties", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const result = dataUtils.omit(obj, ["b"]);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });
});

// Test validators
import * as validators from "../../src/utils/validators.js";

describe("Validators", () => {
  describe("type checks", () => {
    it("isString should work", () => {
      expect(validators.isString("hello")).toBe(true);
      expect(validators.isString(123)).toBe(false);
    });

    it("isNumber should work", () => {
      expect(validators.isNumber(123)).toBe(true);
      expect(validators.isNumber("123")).toBe(false);
      expect(validators.isNumber(NaN)).toBe(false);
    });

    it("isArray should work", () => {
      expect(validators.isArray([])).toBe(true);
      expect(validators.isArray({})).toBe(false);
    });

    it("isObject should work", () => {
      expect(validators.isObject({})).toBe(true);
      expect(validators.isObject([])).toBe(false);
      expect(validators.isObject(null)).toBe(false);
    });
  });

  describe("validateTask", () => {
    it("should validate valid task", () => {
      const task = {
        id: 1,
        name: "Task 1",
        start_date: "2024-01-01",
        duration: 5,
      };
      const result = validators.validateTask(task);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should reject task without id", () => {
      const task = { name: "Task", start_date: "2024-01-01", duration: 5 };
      const result = validators.validateTask(task);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("id"))).toBe(true);
    });

    it("should reject task without name", () => {
      const task = { id: 1, start_date: "2024-01-01", duration: 5 };
      const result = validators.validateTask(task);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("name"))).toBe(true);
    });
  });

  describe("checkDuplicateIds", () => {
    it("should detect duplicates", () => {
      const items = [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 1, name: "C" },
      ];
      const result = validators.checkDuplicateIds(items);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates).toContain(1);
    });

    it("should return false for no duplicates", () => {
      const items = [
        { id: 1, name: "A" },
        { id: 2, name: "B" },
        { id: 3, name: "C" },
      ];
      const result = validators.checkDuplicateIds(items);
      expect(result.hasDuplicates).toBe(false);
    });
  });

  describe("isInRange", () => {
    it("should return true for value in range", () => {
      expect(validators.isInRange(5, 1, 10)).toBe(true);
    });

    it("should return true for boundary values", () => {
      expect(validators.isInRange(1, 1, 10)).toBe(true);
      expect(validators.isInRange(10, 1, 10)).toBe(true);
    });

    it("should return false for out of range", () => {
      expect(validators.isInRange(0, 1, 10)).toBe(false);
      expect(validators.isInRange(11, 1, 10)).toBe(false);
    });
  });
});
