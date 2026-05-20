import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/services/auth.service";
import { listSavingsGoals } from "@/services/savings.service";
import { SavingsView } from "@/features/savings/components/savings-view.client";

export const metadata: Metadata = { title: "Savings" };

export default async function SavingsPage() {
  const user = await requireUser();
  const goals = await listSavingsGoals(user.username);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings"
        description="Track goals, emergency funds, and monthly targets."
      />
      <SavingsView goals={goals} />
    </div>
  );
}
