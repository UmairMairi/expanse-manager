import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/services/auth.service";
import { listInvoices } from "@/services/invoices.service";
import { listClients } from "@/services/clients.service";
import { InvoicesView } from "@/features/invoices/components/invoices-view.client";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const user = await requireUser();
  const [invoices, clients] = await Promise.all([
    listInvoices(user.username),
    listClients(user.username),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Generate, download as PDF, email to client, mark paid."
      />
      <InvoicesView invoices={invoices} clients={clients} />
    </div>
  );
}
