import type { Metadata } from "next";
import { requireUser } from "@/services/auth.service";
import { listExpenses } from "@/services/expenses.service";
import { ExpensePageClient } from "@/features/expenses/components/expense-page-client";

export const metadata: Metadata = {
  title: "Expenses",
};

export default async function ExpensesPage() {
  const user = await requireUser();
  const expenses = await listExpenses(user.username, { limit: 500 });
  return <ExpensePageClient initialExpenses={expenses} />;
}
