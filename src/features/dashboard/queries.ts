import "server-only";
import { rangeForPreset } from "@/utils/date";
import { totalsByCurrency as expenseTotals } from "@/services/expenses.service";
import { totalsByCurrency as incomeTotals } from "@/services/income.service";
import type { Currency } from "@/lib/money";

export type CurrencyTotal = { currency: Currency; amount: number };

export type DashboardOverview = {
  totalIncome: CurrencyTotal[];
  totalExpenses: CurrencyTotal[];
  netSavings: CurrencyTotal[];
  totalBalance: CurrencyTotal[];
};

function mapToList(m: Map<Currency, number>): CurrencyTotal[] {
  return Array.from(m.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function combine(a: Map<Currency, number>, b: Map<Currency, number>): Map<Currency, number> {
  const out = new Map(a);
  for (const [c, v] of b) out.set(c, (out.get(c) ?? 0) - v);
  return out;
}

export async function getDashboardOverview(userId: string): Promise<DashboardOverview> {
  const { start, end } = rangeForPreset("this-month");
  const [exp, inc] = await Promise.all([
    expenseTotals(userId, start, end),
    incomeTotals(userId, start, end),
  ]);
  const balance = combine(inc, exp);
  return {
    totalIncome: mapToList(inc),
    totalExpenses: mapToList(exp),
    netSavings: mapToList(balance),
    totalBalance: mapToList(balance),
  };
}
