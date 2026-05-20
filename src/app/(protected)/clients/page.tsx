import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/services/auth.service";
import { getClientSummaries } from "@/services/clients.service";
import { ClientsView } from "@/features/clients/components/clients-view.client";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const user = await requireUser();
  const summaries = await getClientSummaries(user.username);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Track clients, projects, and payment milestones."
      />
      <ClientsView summaries={summaries} />
    </div>
  );
}
