import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <ComingSoon
      title="Clients"
      description="Track clients, projects, and payment milestones."
      icon={Users}
      phase="Phase 2"
      features={[
        "Clients with projects + milestones",
        "Milestone → invoice + income auto-link",
        "Outstanding milestones dashboard widget",
      ]}
    />
  );
}
