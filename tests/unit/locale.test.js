/**
 * Smoke test: verify setLocalLang actually swaps locale data used by
 * formatDateToString (the function the scale header calls to produce
 * month/day names).
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import javascriptgantt from "../../src/gantt.js";
import { fr, de, allLocales } from "../../src/locales/index.js";

describe("setLocalLang + locale registry", () => {
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
      gantt.destroy();
    }
    container.remove();
  });

  it("defaults to English when no locale option is provided", () => {
    expect(gantt.options.localLang).toBe("en");
    expect(gantt.options.i18n.en).toBeDefined();
    expect(gantt.options.currentLanguage.month_full[0]).toBe("January");
  });

  it("rejects an unregistered locale and keeps the current one", () => {
    const before = gantt.options.localLang;
    const ok = gantt.setLocalLang("fr"); // fr not registered yet
    expect(ok).toBe(false);
    expect(gantt.options.localLang).toBe(before);
  });

  it("registerLocale adds a locale the instance can switch to", () => {
    gantt.registerLocale("fr", fr);
    expect(gantt.options.i18n.fr).toBeDefined();
    const ok = gantt.setLocalLang("fr");
    expect(ok).toBe(true);
    expect(gantt.options.localLang).toBe("fr");
    expect(gantt.options.currentLanguage.month_full[0]).toBe("Janvier");
  });

  it("registerLocales accepts a map", () => {
    gantt.registerLocales({ fr, de });
    expect(gantt.options.i18n.fr).toBeDefined();
    expect(gantt.options.i18n.de).toBeDefined();
  });

  it("formatDateToString returns the active locale's month/day names", () => {
    gantt.registerLocales(allLocales);

    gantt.setLocalLang("fr");
    expect(gantt.formatDateToString("%F", new Date(2024, 0, 15))).toBe(
      "Janvier"
    );

    gantt.setLocalLang("de");
    expect(gantt.formatDateToString("%F", new Date(2024, 0, 15))).toBe(
      "Januar"
    );

    gantt.setLocalLang("en");
    expect(gantt.formatDateToString("%F", new Date(2024, 0, 15))).toBe(
      "January"
    );
  });

  it("currentLanguage is a real locale on init (not an empty object)", () => {
    // This is the bug that caused early renders to crash:
    // currentLanguage was initialised as {} so .label.description blew up.
    expect(gantt.options.currentLanguage).toBeTruthy();
    expect(gantt.options.currentLanguage.label).toBeDefined();
    expect(gantt.options.currentLanguage.buttons).toBeDefined();
  });

  it("switches the rendered scale header after a full render (demo flow)", () => {
    // Exactly reproduces how demo/app.js wires things up:
    //   1. new gantt(el)
    //   2. registerLocales(allLocales)
    //   3. mutate options directly
    //   4. render()
    //   5. user picks a different language from the dropdown
    gantt.registerLocales(allLocales);

    gantt.options.date_format = "%m-%d-%Y";
    gantt.options.data = [
      {
        id: 1,
        text: "P1",
        parent: 0,
        start_date: "05-05-2024",
        end_date: "05-10-2024",
        progress: 10,
      },
    ];
    gantt.options.scales = [{ unit: "day", step: 1, format: "%D" }];
    gantt.options.startDate = new Date(2024, 4, 1);
    gantt.options.endDate = new Date(2024, 4, 31);

    gantt.render();

    // The scale cells contain day_short names from the active locale.
    const scaleBeforeEl = gantt.element.querySelector(
      ".js-gantt-timeline-cell"
    );
    expect(scaleBeforeEl).toBeTruthy();

    // Switch to French — should succeed and refresh the body.
    const ok = gantt.setLocalLang("fr");
    expect(ok).toBe(true);
    expect(gantt.options.localLang).toBe("fr");

    // Sanity: formatDateToString now returns French names.
    expect(gantt.formatDateToString("%D", new Date(2024, 4, 6))).toBe("Lun");
  });

  it("scale header cells actually display the new locale's names", () => {
    // Regression: previously #dateFormat was never refreshed, so
    // ScaleManager.formatDate kept emitting English names in the header
    // even after setLocalLang() reported success.
    gantt.registerLocales(allLocales);
    gantt.options.date_format = "%m-%d-%Y";
    gantt.options.data = [
      {
        id: 1,
        text: "P1",
        parent: 0,
        start_date: "05-06-2024",
        end_date: "05-08-2024",
        progress: 0,
      },
    ];
    // %D = day_short, %M = month_short — both locale-dependent.
    gantt.options.scales = [{ unit: "day", step: 1, format: "%d %D %M" }];
    gantt.options.startDate = new Date(2024, 4, 6); // Mon 6 May 2024
    gantt.options.endDate = new Date(2024, 4, 8);

    gantt.render();

    const headerTextOf = () =>
      gantt.element
        .querySelector(".js-gantt-scale-row")
        ?.textContent?.trim() || "";

    const englishHeader = headerTextOf();
    expect(englishHeader).toContain("Mon"); // Monday short in English
    expect(englishHeader).toContain("May"); // Month short in English

    gantt.setLocalLang("fr");
    const frenchHeader = headerTextOf();
    expect(frenchHeader).toContain("Lun"); // Lundi short in French
    expect(frenchHeader).toContain("Mai"); // Mai short in French
    expect(frenchHeader).not.toContain("Mon");

    gantt.setLocalLang("de");
    const germanHeader = headerTextOf();
    expect(germanHeader).toContain("Mo"); // Montag short in German
  });
});
