/**
 * Algorithm-correctness tests for the perf quick-win patch.
 *
 * We do NOT benchmark rendering wall-clock time in happy-dom — its DOM
 * memory overhead is ~10× a real browser, and renders of even ~100 rows
 * cumulatively exhaust the 4GB Node heap in CI. Real perf validation
 * belongs in the browser demo (`demo/app.js`).
 *
 * What we DO verify here is the algorithmic contracts that keep large
 * gantts from freezing in real browsers:
 *
 *   1. `getLargeAndSmallDate` memoizes per render — repeated calls on the
 *      same task within one render return the cached result (identity),
 *      and mutation via `updateTaskDate` invalidates it. Without this the
 *      function is O(subtree) and calling it in a loop over tasks is O(n²).
 *
 *   2. `onTaskDrag` has no registered content-cell refresh subscriber.
 *      The per-cell `refreshAll` closure used to be wired to this event,
 *      which fires on every mousemove. At scale that was tasks × cols
 *      innerHTML writes per frame → total UI freeze during drag.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import javascriptgantt from "../../src/gantt.js";

function buildData(projectCount, tasksPerProject) {
  const data = [];
  let id = 1;
  for (let p = 0; p < projectCount; p++) {
    const projectId = id++;
    data.push({ id: projectId, text: `Project ${p}`, parent: 0, progress: 0 });
    for (let t = 0; t < tasksPerProject; t++) {
      data.push({
        id: id++,
        text: `Task ${p}.${t}`,
        parent: projectId,
        start_date: "05-05-2024",
        end_date: "05-10-2024",
        progress: 0,
      });
    }
  }
  return data;
}

function makeGantt(container, projectCount, tasksPerProject) {
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
  ];
  g.options.data = buildData(projectCount, tasksPerProject);
  g.options.scales = [{ unit: "day", step: 1, format: "%d" }];
  g.options.startDate = new Date(2024, 4, 1);
  g.options.endDate = new Date(2024, 4, 10);
  g.options.openedTasks = [];
  return g;
}

describe("perf quick-win contracts", () => {
  let container;
  let gantt;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "js-gantt";
    document.body.appendChild(container);
  });

  afterEach(() => {
    try {
      gantt?.destroy?.();
    } catch {
      /* best-effort */
    }
    container.remove();
  });

  it("getLargeAndSmallDate memoizes across repeat calls on the same task", () => {
    // Intentionally tiny: happy-dom memory overhead forbids large trees.
    gantt = makeGantt(container, 5, 2);
    gantt.render();

    const parent = gantt.options.data.find(
      (t) => t.parent === 0 && t.children?.length
    );
    expect(parent).toBeTruthy();

    const first = gantt.getLargeAndSmallDate(parent);
    const second = gantt.getLargeAndSmallDate(parent);
    // Identity match proves the cache returned the exact same object,
    // so the recursive subtree walk did NOT run a second time.
    expect(second).toBe(first);
  });

  it("updateTaskDate invalidates the memoized subtree bounds", () => {
    gantt = makeGantt(container, 3, 2);
    gantt.render();

    const parent = gantt.options.data.find(
      (t) => t.parent === 0 && t.children?.length
    );
    const child = parent.children[0];

    const before = gantt.getLargeAndSmallDate(parent);
    gantt.updateTaskDate(child, new Date(2024, 4, 1), new Date(2024, 4, 2));
    const after = gantt.getLargeAndSmallDate(parent);

    // Fresh object — cache was dropped on mutation so the new dates flow.
    expect(after).not.toBe(before);
  });

  it("render() invalidates the memoized subtree bounds at the top", () => {
    gantt = makeGantt(container, 3, 2);
    gantt.render();

    const parent = gantt.options.data.find(
      (t) => t.parent === 0 && t.children?.length
    );

    const before = gantt.getLargeAndSmallDate(parent);
    // A fresh render must recompute — guards against stale data from
    // out-of-band mutations bypassing updateTaskDate.
    gantt.render();
    const after = gantt.getLargeAndSmallDate(parent);

    expect(after).not.toBe(before);
  });

  it("onTaskDrag has no registered content-refresh listener", () => {
    gantt = makeGantt(container, 2, 2);
    gantt.render();

    const mgr = gantt.getEventManager();
    // Regression guard for the drag-freeze bug: refreshAll must not be
    // subscribed to onTaskDrag. Sibling events still get the listener.
    expect(mgr.listenerCount("onTaskDrag")).toBe(0);
    expect(mgr.listenerCount("onAfterTaskUpdate")).toBeGreaterThan(0);
    expect(mgr.listenerCount("onAfterTaskDrag")).toBeGreaterThan(0);
  });

  it("dispatching onTaskDrag repeatedly is cheap (no per-cell innerHTML writes)", () => {
    gantt = makeGantt(container, 2, 2);
    gantt.render();

    const t0 = performance.now();
    for (let i = 0; i < 200; i++) {
      gantt.dispatchEvent("onTaskDrag", { task: { id: 1 } });
    }
    const dt = performance.now() - t0;
    // Pre-fix this ran an innerHTML rewrite on every content cell per
    // dispatch. Post-fix it's a no-op dispatch path. Generous ceiling
    // for slow CI.
    expect(dt).toBeLessThan(500);
  });
});
