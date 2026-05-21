import type { Metadata } from "next";
import { requireUser } from "@/services/auth.service";
import { listExpenses } from "@/services/expenses.service";
import { listCategories } from "@/services/categories.service";
import { listPaymentMethods } from "@/services/payment-methods.service";
import { ExpensePageClient } from "@/features/expenses/components/expense-page-client";

export const metadata: Metadata = {
  title: "Expenses",
};

export default async function ExpensesPage() {
  const user = await requireUser();
  const [expenses, customCategories, customMethods] = await Promise.all([
    listExpenses(user.username, { limit: 500 }),
    listCategories(user.username),
    listPaymentMethods(user.username),
  ]);
  return (
    <ExpensePageClient
      initialExpenses={expenses}
      customCategories={customCategories.map((c) => c.name)}
      customPaymentMethods={customMethods.map((m) => m.name)}
    />
  );
}
