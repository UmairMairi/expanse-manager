import { describe, it, expect } from "vitest";
import { ExpenseInputSchema } from "@/types/expense";

describe("ExpenseInputSchema", () => {
  const baseValid = {
    title: "Lunch",
    amountMajor: 12.5,
    currency: "PKR",
    category: "Food",
    date: "2026-05-20",
    paymentMethod: "card",
    notes: "",
    tags: [],
  };

  it("accepts a minimal valid record", () => {
    expect(ExpenseInputSchema.parse(baseValid).title).toBe("Lunch");
  });

  it("rejects zero or negative amounts", () => {
    expect(() => ExpenseInputSchema.parse({ ...baseValid, amountMajor: 0 })).toThrow();
    expect(() => ExpenseInputSchema.parse({ ...baseValid, amountMajor: -5 })).toThrow();
  });

  it("rejects missing title", () => {
    expect(() => ExpenseInputSchema.parse({ ...baseValid, title: "" })).toThrow();
  });

  it("rejects non-numeric amount strings", () => {
    // Schema is strict (no coercion); the form converts string→number at the boundary.
    expect(() =>
      ExpenseInputSchema.parse({ ...baseValid, amountMajor: "not-a-number" as unknown as number }),
    ).toThrow();
  });

  it("requires tags to be an array (explicit, no default)", () => {
    const { tags, ...rest } = baseValid;
    void tags;
    expect(() => ExpenseInputSchema.parse(rest)).toThrow();
    expect(ExpenseInputSchema.parse({ ...rest, tags: [] }).tags).toEqual([]);
  });
});
