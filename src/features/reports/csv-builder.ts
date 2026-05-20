import "server-only";
import type { ReportBundle } from "@/services/reports.service";

function escape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rows(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.map(escape).join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

function toMajor(n: number): string {
  return (n / 100).toFixed(2);
}

export interface CsvFile {
  filename: string;
  content: string;
}

export function buildCsvFiles(bundle: ReportBundle): CsvFile[] {
  const expensesCsv = rows(
    bundle.expenses.map((e) => ({
      date: e.date,
      title: e.title,
      category: e.category,
      paymentMethod: e.paymentMethod,
      currency: e.currency,
      amount: toMajor(e.amount),
      tags: (e.tags ?? []).join("|"),
      notes: e.notes ?? "",
    })),
    ["date", "title", "category", "paymentMethod", "currency", "amount", "tags", "notes"],
  );

  const incomeCsv = rows(
    bundle.income.map((i) => ({
      date: i.date,
      source: i.source,
      platform: i.platform,
      currency: i.currency,
      amount: toMajor(i.amount),
      notes: i.notes ?? "",
    })),
    ["date", "source", "platform", "currency", "amount", "notes"],
  );

  const savingsCsv = rows(
    bundle.savings.map((g) => ({
      goal: g.goalName,
      currency: g.currency,
      target: toMajor(g.targetAmount),
      saved: toMajor(g.savedAmount),
      deadline: g.deadline ?? "",
      emergency: g.isEmergencyFund ? "Yes" : "",
    })),
    ["goal", "currency", "target", "saved", "deadline", "emergency"],
  );

  const budgetsCsv = rows(
    bundle.budgets.map((s) => ({
      category: s.budget.category,
      currency: s.budget.currency,
      limit: toMajor(s.budget.monthlyLimit),
      spent: toMajor(s.spent),
      percent: Math.round(s.percentUsed),
      state: s.state,
    })),
    ["category", "currency", "limit", "spent", "percent", "state"],
  );

  return [
    { filename: "expenses.csv", content: expensesCsv },
    { filename: "income.csv", content: incomeCsv },
    { filename: "savings.csv", content: savingsCsv },
    { filename: "budgets.csv", content: budgetsCsv },
  ];
}
