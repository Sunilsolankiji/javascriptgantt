/**
 * Regression: `attachEvent` used to register the listener in TWO places
 * (EventManager + DOM CustomEvent), and `dispatchEvent` fired BOTH
 * channels. That caused every user handler to fire twice — visible in
 * the demo as "addTask is called once but task appears twice" when a
 * handler re-added the task.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import javascriptgantt from "../../src/gantt.js";

describe("attachEvent / dispatchEvent", () => {
  let container;
  let gantt;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "js-gantt";
    document.body.appendChild(container);
    gantt = new javascriptgantt(container);
  });

  afterEach(() => {
    if (gantt && typeof gantt.destroy === "function") {
      try {
        gantt.destroy();
      } catch {
        /* best-effort */
      }
    }
    container.remove();
  });

  it("calls an attached handler exactly once per dispatch", () => {
    const handler = vi.fn();
    gantt.attachEvent("onTaskAdd", handler);

    gantt.dispatchEvent("onTaskAdd", { task: { id: 1 } });
    expect(handler).toHaveBeenCalledTimes(1);

    gantt.dispatchEvent("onTaskAdd", { task: { id: 2 } });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("delivers the dispatched detail payload unchanged", () => {
    const handler = vi.fn();
    gantt.attachEvent("onAfterTaskUpdate", handler);

    const payload = { task: { id: 42, text: "hi" } };
    gantt.dispatchEvent("onAfterTaskUpdate", payload);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it("still fires for external element-level listeners (backward compat)", () => {
    // Users who subscribe via DOM `addEventListener` directly should
    // keep receiving the CustomEvent.
    const domHandler = vi.fn();
    gantt.element.addEventListener("onTaskAdd", domHandler);

    gantt.dispatchEvent("onTaskAdd", { task: { id: 7 } });

    expect(domHandler).toHaveBeenCalledTimes(1);
  });

  it("'before' handlers can veto by returning false (eventValue)", () => {
    gantt.attachEvent("onBeforeTaskDrag", () => false);
    gantt.dispatchEvent("onBeforeTaskDrag", { task: { id: 1 } });
    expect(gantt.eventValue).toBe(false);

    gantt.attachEvent("onBeforeTaskDrop", () => true);
    gantt.dispatchEvent("onBeforeTaskDrop", { task: { id: 1 } });
    expect(gantt.eventValue).toBe(true);
  });
});
