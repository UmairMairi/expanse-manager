import { describe, expect, it } from "vitest";
import { linearRegression, groupByMonth, forecastNextMonth } from "./forecasting";

describe("linearRegression", () => {
  it("recovers a perfect line", () => {
    const res = linearRegression([
      [0, 0],
      [1, 2],
      [2, 4],
      [3, 6],
    ]);
    expect(res.slope).toBeCloseTo(2);
    expect(res.intercept).toBeCloseTo(0);
    expect(res.rSquared).toBeCloseTo(1);
    expect(res.predict(4)).toBeCloseTo(8);
  });

  it("returns the only point when given one", () => {
    const res = linearRegression([[5, 42]]);
    expect(res.predict(99)).toBe(42);
  });
});

describe("groupByMonth", () => {
  it("zero-fills missing months", () => {
    const out = groupByMonth([], 3);
    expect(out).toHaveLength(3);
    expect(out.every((m) => m.total === 0)).toBe(true);
  });
});

describe("forecastNextMonth", () => {
  it("predicts non-negative", () => {
    const fc = forecastNextMonth([], 6);
    expect(fc.nextMonth.predicted).toBeGreaterThanOrEqual(0);
  });
});
