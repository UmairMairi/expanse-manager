import { describe, it, expect } from "vitest";
import {
  money,
  fromMajor,
  toMajor,
  add,
  subtract,
  sumByCurrency,
  formatMoney,
  parseMoney,
} from "./money";

describe("money", () => {
  it("constructs Money from integer minor units", () => {
    const m = money(1250, "PKR");
    expect(m).toEqual({ amount: 1250, currency: "PKR" });
  });

  it("rejects non-integer minor units (float drift guard)", () => {
    expect(() => money(12.5, "PKR")).toThrow();
  });

  it("converts major→minor without float drift", () => {
    expect(fromMajor(0.1, "USD").amount).toBe(10);
    expect(fromMajor(0.2, "USD").amount).toBe(20);
    expect(fromMajor(0.3, "USD").amount).toBe(30);
    // The classic 0.1 + 0.2 != 0.3 case
    expect(fromMajor(0.1).amount + fromMajor(0.2).amount).toBe(
      fromMajor(0.3).amount,
    );
  });

  it("round-trips major↔minor", () => {
    const m = fromMajor(12345.67, "USD");
    expect(toMajor(m)).toBe(12345.67);
  });
});

describe("arithmetic", () => {
  it("adds same-currency amounts", () => {
    expect(add(money(100, "PKR"), money(50, "PKR"))).toEqual(money(150, "PKR"));
  });

  it("refuses to add different currencies", () => {
    expect(() => add(money(100, "PKR"), money(100, "USD"))).toThrow();
  });

  it("subtracts same-currency amounts (negative allowed)", () => {
    expect(subtract(money(100, "PKR"), money(150, "PKR"))).toEqual(
      money(-50, "PKR"),
    );
  });

  it("sums by currency", () => {
    const totals = sumByCurrency([
      money(100, "PKR"),
      money(50, "USD"),
      money(200, "PKR"),
    ]);
    expect(totals.get("PKR")).toBe(300);
    expect(totals.get("USD")).toBe(50);
  });
});

describe("formatMoney", () => {
  it("formats PKR without decimals", () => {
    expect(formatMoney(money(1_234_500, "PKR"))).toMatch(/12,?345/);
  });

  it("formats USD with cents", () => {
    expect(formatMoney(money(12345, "USD"))).toMatch(/123\.45/);
  });

  it("supports compact notation", () => {
    expect(formatMoney(money(150_000_000, "PKR"), { compact: true })).toMatch(/M|m|cr/i);
  });
});

describe("parseMoney", () => {
  it("strips currency symbols and thousands separators", () => {
    expect(parseMoney("PKR 12,345.50", "PKR")).toEqual(fromMajor(12345.5, "PKR"));
  });

  it("returns null on garbage input", () => {
    expect(parseMoney("not a number")).toBeNull();
    expect(parseMoney("")).toBeNull();
  });

  it("handles plain numbers", () => {
    expect(parseMoney("99.99", "USD")).toEqual(fromMajor(99.99, "USD"));
  });
});
