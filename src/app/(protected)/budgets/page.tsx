import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Budgets" };

export default function BudgetsPage() {
  return (
    <ComingSoon
      title="Budgets"
      description="Category-based monthly limits with threshold alerts."
      icon={Wallet}
      phase="Phase 2"
      features={["Per-category monthly limits", "Threshold warnings (80% / 100%)", "Inline email alerts"]}
    />
  );
}
