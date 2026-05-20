import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import { getClient, listProjectsForClient } from "@/services/clients.service";
import { ClientProjectsView } from "@/features/clients/components/client-projects-view.client";

export const metadata: Metadata = { title: "Client" };

type Params = Promise<{ clientId: string }>;

export default async function ClientDetailPage({ params }: { params: Params }) {
  const { clientId } = await params;
  const user = await requireUser();
  const clientRes = await getClient(user.username, clientId);
  if (!clientRes.ok) notFound();
  const projects = await listProjectsForClient(user.username, clientId);
  return <ClientProjectsView client={clientRes.data} projects={projects} />;
}
