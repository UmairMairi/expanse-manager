import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/services/auth.service";
import { getBudgetStatuses } from "@/services/budgets.service";
import { listExpenses } from "@/services/expenses.service";
import { listCategories } from "@/services/categories.service";
import { BudgetsView } from "@/features/budgets/components/budgets-view.client";

export const metadata: Metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  const user = await requireUser();
  const [statuses, expenses, customCategories] = await Promise.all([
    getBudgetStatuses(user.username),
    listExpenses(user.username, { limit: 200 }),
    listCategories(user.username),
  ]);
  // Categories shown in the dialog: user-defined ones, plus any category
  // that already appears on an existing expense (so editing keeps working
  // for legacy records). No built-in defaults.
  const categories = new Set<string>(customCategories.map((c) => c.name));
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
