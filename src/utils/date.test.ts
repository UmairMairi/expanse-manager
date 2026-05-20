import { describe, it, expect } from "vitest";
import { rangeForPreset, monthKey, formatShortDate, formatMonth } from "./date";

describe("rangeForPreset", () => {
  const now = new Date("2026-05-15T12:00:00Z");

  it("this-month covers the whole month", () => {
    const { start, end } = rangeForPreset("this-month", now);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(now.getMonth());
  });

  it("last-30-days spans 30 days inclusive", () => {
    const { start, end } = rangeForPreset("last-30-days", now);
    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
    // startOfDay(now − 29) → endOfDay(now) = 30 days inclusive
    expect(diffDays).toBe(30);
  });

  it("today is a single day", () => {
    const { start, end } = rangeForPreset("today", now);
    expect(start.toDateString()).toBe(end.toDateString());
  });

  it("last-month is the previous calendar month", () => {
    const { start } = rangeForPreset("last-month", now);
    expect(start.getMonth()).toBe(3); // April (0-indexed) when now is May
  });
});

describe("formatters", () => {
  it("monthKey produces YYYY-MM", () => {
    expect(monthKey(new Date("2026-05-15"))).toBe("2026-05");
  });

  it("formatShortDate accepts both Date and ISO string", () => {
    expect(formatShortDate(new Date("2026-05-15"))).toBe("May 15, 2026");
    expect(formatShortDate("2026-05-15T00:00:00Z")).toMatch(/May 1[45], 2026/);
  });

  it("formatMonth returns 'Month YYYY'", () => {
    expect(formatMonth(new Date("2026-05-15"))).toBe("May 2026");
  });
});
