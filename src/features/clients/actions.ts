"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/auth.service";
import {
  createClient,
  updateClient,
  deleteClient,
  createProject,
  updateProject,
  deleteProject,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  transitionMilestoneStatus,
} from "@/services/clients.service";
import { ClientSchema, ProjectSchema, MilestoneSchema } from "./schemas";
import type { MilestoneStatus } from "./schemas";

function bust() {
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

// Clients
export async function createClientAction(input: unknown) {
  const user = await requireUser();
  const parsed = ClientSchema.parse(input);
  const result = await createClient(user.username, parsed);
  bust();
  return result;
}

export async function updateClientAction(id: string, input: unknown) {
  const user = await requireUser();
  const parsed = ClientSchema.parse(input);
  const result = await updateClient(user.username, id, parsed);
  bust();
  return result;
}

export async function deleteClientAction(id: string) {
  const user = await requireUser();
  const result = await deleteClient(user.username, id);
  bust();
  return result;
}

// Projects
export async function createProjectAction(input: unknown) {
  const user = await requireUser();
  const parsed = ProjectSchema.parse(input);
  const result = await createProject(user.username, parsed);
  bust();
  return result;
}

export async function updateProjectAction(id: string, input: unknown) {
  const user = await requireUser();
  const parsed = ProjectSchema.parse(input);
  const result = await updateProject(user.username, id, parsed);
  bust();
  return result;
}

export async function deleteProjectAction(id: string) {
  const user = await requireUser();
  const result = await deleteProject(user.username, id);
  bust();
  return result;
}

// Milestones
export async function createMilestoneAction(input: unknown) {
  const user = await requireUser();
  const parsed = MilestoneSchema.parse(input);
  const result = await createMilestone(user.username, parsed);
  bust();
  revalidatePath("/income");
  return result;
}

export async function updateMilestoneAction(id: string, input: unknown) {
  const user = await requireUser();
  const parsed = MilestoneSchema.parse(input);
  const result = await updateMilestone(user.username, id, parsed);
  bust();
  return result;
}

export async function deleteMilestoneAction(id: string) {
  const user = await requireUser();
  const result = await deleteMilestone(user.username, id);
  bust();
  return result;
}

export async function transitionMilestoneStatusAction(
  milestoneId: string,
  toStatus: MilestoneStatus,
) {
  const user = await requireUser();
  const result = await transitionMilestoneStatus({
    userId: user.username,
    milestoneId,
    toStatus,
  });
  bust();
  revalidatePath("/income");
  return result;
}
