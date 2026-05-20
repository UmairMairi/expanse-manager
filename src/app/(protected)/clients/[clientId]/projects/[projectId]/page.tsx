import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/auth.service";
import {
  getClient,
  getProject,
  listMilestonesForProject,
} from "@/services/clients.service";
import { MilestonesView } from "@/features/clients/components/milestones-view.client";

export const metadata: Metadata = { title: "Project" };

type Params = Promise<{ clientId: string; projectId: string }>;

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { clientId, projectId } = await params;
  const user = await requireUser();
  const [clientRes, projectRes] = await Promise.all([
    getClient(user.username, clientId),
    getProject(user.username, projectId),
  ]);
  if (!clientRes.ok || !projectRes.ok) notFound();
  if (projectRes.data.clientId !== clientId) notFound();
  const milestones = await listMilestonesForProject(user.username, projectId);
  return (
    <MilestonesView client={clientRes.data} project={projectRes.data} milestones={milestones} />
  );
}
