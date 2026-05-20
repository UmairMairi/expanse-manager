import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/services/auth.service";
import { getBudgetStatuses } from "@/services/budgets.service";
import { listExpenses } from "@/services/expenses.service";
import { BudgetsView } from "@/features/budgets/components/budgets-view.client";

export const metadata: Metadata = { title: "Budgets" };

const DEFAULT_CATEGORIES = [
  "Food",
  "Rent",
  "Utilities",
  "Internet",
  "Travel",
  "Shopping",
  "Entertainment",
  "Health",
  "Investments",
  "Education",
  "Family",
  "Miscellaneous",
];

export default async function BudgetsPage() {
  const user = await requireUser();
  const [statuses, expenses] = await Promise.all([
    getBudgetStatuses(user.username),
    listExpenses(user.username, { limit: 200 }),
  ]);
  const categories = new Set<string>(DEFAULT_CATEGORIES);
  for (const e of expenses) if (e.category) categories.add(e.category);
  const knownCategories = Array.from(categories).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Set monthly category limits and get warned when you approach them."
      />
      <BudgetsView statuses={statuses} knownCategories={knownCategories} />
    </div>
  );
}
