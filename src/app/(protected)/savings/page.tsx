import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Savings" };

export default function SavingsPage() {
  return (
    <ComingSoon
      title="Savings"
      description="Savings goals, emergency funds, and monthly targets."
      icon={PiggyBank}
      phase="Phase 2"
      features={["Goal tracking with progress rings", "Emergency-fund flag", "Monthly targets"]}
    />
  );
}
