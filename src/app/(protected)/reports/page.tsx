import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/services/auth.service";
import { gatherReport } from "@/services/reports.service";
import { rangeForPreset } from "@/features/reports/range";
import { ReportsView } from "@/features/reports/components/reports-view.client";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await requireUser();
  const range = rangeForPreset("month");
  const bundle = await gatherReport(user.username, range);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Range-based summaries with Excel, CSV, and PDF exports."
      />
      <ReportsView initialBundle={bundle} initialPreset="month" />
    </div>
  );
}
