/**
 * Regression: createSidebar / createSidebarChild used to call
 * attachEvent(...) FOUR times per column cell per render (once for each
 * of onAfterTaskUpdate, onAfterProgressDrag, onTaskDrag, onAfterTaskDrag).
 *
 * That meant a board with 50 tasks × 2 columns × 4 events × N re-renders
 * leaked 400 × N handlers into the EventManager, never cleaned up.
 *
 * After the refactor, those listeners are wired up EXACTLY ONCE per
 * instance via #bindContentCellUpdates, and individual cells register
 * themselves in a per-render registry that is reset on every render.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import javascriptgantt from "../../src/gantt.js";

function makeGantt(container) {
  const g = new javascriptgantt(container);
  g.options.date_format = "%m-%d-%Y";
  g.options.columns = [
    {
      name: "text",
      width: 120,
      tree: true,
      label: "Name",
      template: (t) => `<span>${t.text}</span>`,
    },
    {
      name: "progress",
      width: 80,
      label: "Progress",
      template: (t) => `<span>${t.progress || 0}</span>`,
    },
  ];
  g.options.data = [
    {
      id: 1,
      text: "P1",
      parent: 0,
      start_date: "05-05-2024",
      end_date: "05-10-2024",
      progress: 0,
    },
    {
      id: 2,
      text: "Child",
      parent: 1,
      start_date: "05-06-2024",
      end_date: "05-08-2024",
      progress: 0,
    },
  ];
  g.options.scales = [{ unit: "day", step: 1, format: "%d" }];
  g.options.startDate = new Date(2024, 4, 1);
  g.options.endDate = new Date(2024, 4, 31);
  g.options.openedTasks = [1];
  return g;
}

describe("render-loop handler leak", () => {
  let container;
  let gantt;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "js-gantt";
    document.body.appendChild(container);
    gantt = makeGantt(container);
  });

  afterEach(() => {
    try {
      gantt?.destroy?.();
    } catch {
      /* best-effort */
    }
    container.remove();
  });

  const listenerCountFor = (g, eventName) => {
    // EventManager keeps a Map of listeners; peek via the public contract.
    const mgr = g.getEventManager?.() ?? null;
    if (!mgr) {
      return 0;
    }
    if (typeof mgr.listenerCount === "function") {
      return mgr.listenerCount(eventName);
    }
    if (mgr.listeners instanceof Map) {
      return mgr.listeners.get(eventName)?.size || 0;
    }
    if (mgr.events && typeof mgr.events === "object") {
      const bucket = mgr.events[eventName];
      return Array.isArray(bucket) ? bucket.length : 0;
    }
    return 0;
  };

  it("does NOT accumulate content-refresh listeners across re-renders", () => {
    gantt.render();
    const afterFirstRender = listenerCountFor(gantt, "onAfterTaskUpdate");

    // Render a bunch more times — previously each render added
    // (# tasks × # columns) fresh listeners for this event.
    for (let i = 0; i < 10; i++) {
      gantt.render();
    }
    const afterTenMoreRenders = listenerCountFor(gantt, "onAfterTaskUpdate");

    // Allow for a tiny amount of slack (some events wire up on demand),
    // but it must NOT grow proportionally with renders.
    expect(afterTenMoreRenders).toBeLessThanOrEqual(afterFirstRender + 1);
  });

  it("wires exactly one content-refresh listener per event (measurable)", () => {
    // With the leak fix in place, the refresh events are bound a SMALL
    // constant number of times during the first render (one per internal
    // subsystem that needs to react) and never re-bound afterwards.
    gantt.render();
    const baseline = {};
    for (const eventName of [
      "onAfterTaskUpdate",
      "onAfterProgressDrag",
      "onTaskDrag",
      "onAfterTaskDrag",
    ]) {
      const n = listenerCountFor(gantt, eventName);
      // At most a handful — anything >5 means we're re-subscribing per task.
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThanOrEqual(5);
      baseline[eventName] = n;
    }

    // Re-render many times — counts must stay exactly the same.
    for (let i = 0; i < 15; i++) {
      gantt.render();
    }
    for (const eventName of Object.keys(baseline)) {
      expect(listenerCountFor(gantt, eventName)).toBe(baseline[eventName]);
    }
  });

  it("renders idempotently without throwing on many re-renders", () => {
    for (let i = 0; i < 25; i++) {
      expect(() => gantt.render()).not.toThrow();
    }
    const timelineData = gantt.element.querySelector("#js-gantt-timeline-data");
    expect(timelineData).toBeTruthy();
  });
});
