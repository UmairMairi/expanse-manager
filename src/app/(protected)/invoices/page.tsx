import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return (
    <ComingSoon
      title="Invoices"
      description="Generate, download, and email PDF invoices."
      icon={FileText}
      phase="Phase 2"
      features={["On-demand PDF generation", "Send via Gmail SMTP", "Auto-link to milestones"]}
    />
  );
}
