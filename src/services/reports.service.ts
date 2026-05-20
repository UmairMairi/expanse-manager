import "server-only";
import { listExpenses } from "@/services/expenses.service";
import { listIncome } from "@/services/income.service";
import { listSavingsGoals } from "@/services/savings.service";
import { getBudgetStatuses } from "@/services/budgets.service";
import type { DateRange } from "@/features/reports/range";
import type { ExpenseDoc } from "@/types/expense";
import type { IncomeDoc } from "@/types/income";
import type { SavingsGoalDoc } from "@/services/savings.service";
import type { BudgetStatus } from "@/services/budgets.service";

export interface ReportBundle {
  range: DateRange;
  expenses: ExpenseDoc[];
  income: IncomeDoc[];
  savings: SavingsGoalDoc[];
  budgets: BudgetStatus[];
  summary: {
    totalExpensesByCurrency: Map<string, number>;
    totalIncomeByCurrency: Map<string, number>;
    netByCurrency: Map<string, number>;
    expenseCount: number;
    incomeCount: number;
  };
}

function sumByCurrency(items: { amount: number; currency: string }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(it.currency, (m.get(it.currency) ?? 0) + it.amount);
  return m;
}

export async function gatherReport(userId: string, range: DateRange): Promise<ReportBundle> {
  const [expenses, income, savings, budgets] = await Promise.all([
    listExpenses(userId, { from: range.from, to: range.to }),
    listIncome(userId, { from: range.from, to: range.to }),
    listSavingsGoals(userId),
    getBudgetStatuses(userId),
  ]);

  const totalExpensesByCurrency = sumByCurrency(expenses);
  const totalIncomeByCurrency = sumByCurrency(income);
  const netByCurrency = new Map<string, number>();
  const allCurrencies = new Set([
    ...totalExpensesByCurrency.keys(),
    ...totalIncomeByCurrency.keys(),
  ]);
  for (const c of allCurrencies) {
    const inc = totalIncomeByCurrency.get(c) ?? 0;
    const exp = totalExpensesByCurrency.get(c) ?? 0;
    netByCurrency.set(c, inc - exp);
  }

  return {
    range,
    expenses,
    income,
    savings,
    budgets,
    summary: {
      totalExpensesByCurrency,
      totalIncomeByCurrency,
      netByCurrency,
      expenseCount: expenses.length,
      incomeCount: income.length,
    },
  };
}
