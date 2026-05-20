import "server-only";
import { Type, type FunctionDeclaration } from "@google/genai";
import { listExpenses } from "@/services/expenses.service";
import { listIncome } from "@/services/income.service";
import { listSavingsGoals } from "@/services/savings.service";
import { getBudgetStatuses } from "@/services/budgets.service";
import {
  getClientSummaries,
  listAllMilestones,
} from "@/services/clients.service";
import { rangeForPreset, customRange, type RangePreset } from "@/features/reports/range";

/**
 * Tools exposed to Gemini. Each entry pairs a JSON-schema function declaration
 * (sent to the model) with a TypeScript implementation that actually runs the
 * query against Firestore.
 */
export interface ToolBundle {
  declarations: FunctionDeclaration[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlers: Record<string, (args: any, userId: string) => Promise<unknown>>;
}

function resolveRange(args: { preset?: string; from?: string; to?: string }) {
  if (args.from && args.to) return customRange(args.from, args.to);
  return rangeForPreset((args.preset ?? "month") as RangePreset);
}

export function buildTools(): ToolBundle {
  return {
    declarations: [
      {
        name: "getExpenses",
        description:
          "Get the user's expenses for a date range. Optionally filter by category.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            preset: {
              type: Type.STRING,
              description: "Range preset: week | month | quarter | year | ytd",
            },
            from: { type: Type.STRING, description: "Custom range start YYYY-MM-DD" },
            to: { type: Type.STRING, description: "Custom range end YYYY-MM-DD" },
            category: {
              type: Type.STRING,
              description: "Optional category filter (e.g. Food, Travel)",
            },
          },
        },
      },
      {
        name: "getIncome",
        description:
          "Get the user's income entries for a date range. Optionally filter by source or platform.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            preset: { type: Type.STRING },
            from: { type: Type.STRING },
            to: { type: Type.STRING },
            source: {
              type: Type.STRING,
              description: "Optional: salary | freelance | direct | other",
            },
            platform: { type: Type.STRING, description: "Optional platform name" },
          },
        },
      },
      {
        name: "getSavingsProgress",
        description: "Get all savings goals with their current progress.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "getBudgetStatus",
        description:
          "Get the current month's budget statuses (spent vs limit) for every category.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "getClientSummary",
        description: "Get totals (billed, paid, outstanding) per client.",
        parameters: { type: Type.OBJECT, properties: {} },
      },
      {
        name: "getMilestonesByStatus",
        description:
          "Get payment milestones, optionally filtered by status (pending | in-progress | invoiced | paid | cancelled).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
          },
        },
      },
    ],
    handlers: {
      async getExpenses(args, userId) {
        const range = resolveRange(args);
        const rows = await listExpenses(userId, { from: range.from, to: range.to });
        const filtered = args.category
          ? rows.filter((r) => r.category.toLowerCase() === String(args.category).toLowerCase())
          : rows;
        return {
          range: { from: range.from.toISOString().slice(0, 10), to: range.to.toISOString().slice(0, 10), label: range.label },
          count: filtered.length,
          // Minor units → major for the model's convenience.
          totalsByCurrency: tallies(filtered),
          rows: filtered.slice(0, 50).map((r) => ({
            date: r.date,
            title: r.title,
            category: r.category,
            paymentMethod: r.paymentMethod,
            currency: r.currency,
            amount: r.amount / 100,
          })),
        };
      },
      async getIncome(args, userId) {
        const range = resolveRange(args);
        let rows = await listIncome(userId, { from: range.from, to: range.to });
        if (args.source) rows = rows.filter((r) => r.source === args.source);
        if (args.platform)
          rows = rows.filter((r) =>
            r.platform.toLowerCase().includes(String(args.platform).toLowerCase()),
          );
        return {
          range: { from: range.from.toISOString().slice(0, 10), to: range.to.toISOString().slice(0, 10), label: range.label },
          count: rows.length,
          totalsByCurrency: tallies(rows),
          rows: rows.slice(0, 50).map((r) => ({
            date: r.date,
            source: r.source,
            platform: r.platform,
            currency: r.currency,
            amount: r.amount / 100,
          })),
        };
      },
      async getSavingsProgress(_args, userId) {
        const goals = await listSavingsGoals(userId);
        return goals.map((g) => ({
          goalName: g.goalName,
          currency: g.currency,
          target: g.targetAmount / 100,
          saved: g.savedAmount / 100,
          percent: Math.round((g.savedAmount / Math.max(1, g.targetAmount)) * 100),
          deadline: g.deadline ?? null,
          isEmergencyFund: g.isEmergencyFund,
        }));
      },
      async getBudgetStatus(_args, userId) {
        const statuses = await getBudgetStatuses(userId);
        return statuses.map((s) => ({
          category: s.budget.category,
          currency: s.budget.currency,
          limit: s.budget.monthlyLimit / 100,
          spent: s.spent / 100,
          percentUsed: Math.round(s.percentUsed),
          state: s.state,
        }));
      },
      async getClientSummary(_args, userId) {
        const summaries = await getClientSummaries(userId);
        return summaries.map((s) => ({
          name: s.client.name,
          activeProjects: s.activeProjects,
          billed: s.totalBilled / 100,
          paid: s.totalPaid / 100,
          outstanding: s.outstanding / 100,
          currency: s.primaryCurrency,
        }));
      },
      async getMilestonesByStatus(args, userId) {
        const status = args.status as
          | "pending"
          | "in-progress"
          | "invoiced"
          | "paid"
          | "cancelled"
          | undefined;
        const ms = await listAllMilestones(userId, status ? { status } : {});
        return ms.map((m) => ({
          title: m.title,
          status: m.status,
          currency: m.currency,
          amount: m.amount / 100,
          dueDate: m.dueDate ?? null,
          paidAt: m.paidAt ?? null,
        }));
      },
    },
  };
}

function tallies(rows: Array<{ amount: number; currency: string }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.currency] = (out[r.currency] ?? 0) + r.amount;
  // Convert each to major units for the LLM's convenience.
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v / 100]));
}
