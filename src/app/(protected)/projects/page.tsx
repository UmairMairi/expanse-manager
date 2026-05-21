import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/services/auth.service";
import { listAllProjects, listClients } from "@/services/clients.service";
import { ProjectsView } from "@/features/clients/components/projects-view.client";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await requireUser();
  const [projects, clients] = await Promise.all([
    listAllProjects(user.username),
    listClients(user.username),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Every project across all clients. Status, dates, milestones, and totals."
      />
      <ProjectsView projects={projects} clients={clients} />
    </div>
  );
}
