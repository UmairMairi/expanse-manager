import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <ComingSoon
      title="Reports"
      description="Custom-range analytics and exports."
      icon={BarChart3}
      phase="Phase 2"
      features={["Date-range picker", "Excel · CSV · PDF exports", "Monthly auto-email reports"]}
    />
  );
}
