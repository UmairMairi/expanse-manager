import "server-only";
import { ulid } from "ulid";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { createIncome } from "@/services/income.service";
import { type Result, err, ok, notFound, businessRule } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  ClientInput,
  ProjectInput,
  MilestoneInput,
  MilestoneStatus,
  ProjectStatus,
} from "@/features/clients/schemas";

// ============================================================================
// Clients
// ============================================================================

export interface ClientDoc {
  id: string;
  userId: string;
  name: string;
  source: ClientInput["source"];
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientStored {
  id: string;
  userId: string;
  name: string;
  source?: ClientInput["source"];
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toClientDoc(s: ClientStored): ClientDoc {
  return {
    ...s,
    // Backfill legacy clients written before the source field existed.
    source: s.source ?? "other",
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
  };
}

export async function listClients(userId: string): Promise<ClientDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.CLIENTS)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => toClientDoc(d.data() as ClientStored))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClient(
  userId: string,
  id: string,
): Promise<Result<ClientDoc>> {
  const snap = await getDb().collection(COLLECTIONS.CLIENTS).doc(id).get();
  if (!snap.exists) return err(notFound(`Client ${id} not found`));
  const data = snap.data() as ClientStored;
  if (data.userId !== userId) return err(notFound(`Client ${id} not found`));
  return ok(toClientDoc(data));
}

export async function createClient(
  userId: string,
  input: ClientInput,
): Promise<ClientDoc> {
  const id = ulid();
  const now = Timestamp.now();
  const stored: ClientStored = {
    id,
    userId,
    name: input.name,
    source: input.source,
    email: input.email || undefined,
    phone: input.phone,
    address: input.address,
    taxId: input.taxId,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection(COLLECTIONS.CLIENTS).doc(id).set(stored);
  return toClientDoc(stored);
}

export async function updateClient(
  userId: string,
  id: string,
  input: ClientInput,
): Promise<Result<ClientDoc>> {
  const existing = await getClient(userId, id);
  if (!existing.ok) return existing;
  const updated: ClientStored = {
    id,
    userId,
    name: input.name,
    source: input.source,
    email: input.email || undefined,
    phone: input.phone,
    address: input.address,
    taxId: input.taxId,
    notes: input.notes,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.CLIENTS).doc(id).set(updated);
  return ok(toClientDoc(updated));
}

export async function deleteClient(
  userId: string,
  id: string,
): Promise<Result<void>> {
  const existing = await getClient(userId, id);
  if (!existing.ok) return existing;
  // Cascade-check: refuse if projects exist (caller surfaces this)
  const projects = await listProjectsForClient(userId, id);
  if (projects.length > 0) {
    return err(
      businessRule(
        `Client has ${projects.length} project(s). Delete or reassign them first.`,
      ),
    );
  }
  await getDb().collection(COLLECTIONS.CLIENTS).doc(id).delete();
  return ok(undefined);
}

// ============================================================================
// Projects
// ============================================================================

export interface ProjectDoc {
  id: string;
  userId: string;
  clientId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  currency: string;
  totalQuoted?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStored {
  id: string;
  userId: string;
  clientId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  currency: string;
  totalQuoted?: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toProjectDoc(s: ProjectStored): ProjectDoc {
  return {
    ...s,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
  };
}

export async function listProjectsForClient(
  userId: string,
  clientId: string,
): Promise<ProjectDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.PROJECTS)
    .where("userId", "==", userId)
    .where("clientId", "==", clientId)
    .get();
  return snap.docs
    .map((d) => toProjectDoc(d.data() as ProjectStored))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllProjects(userId: string): Promise<ProjectDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.PROJECTS)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => toProjectDoc(d.data() as ProjectStored))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProject(
  userId: string,
  id: string,
): Promise<Result<ProjectDoc>> {
  const snap = await getDb().collection(COLLECTIONS.PROJECTS).doc(id).get();
  if (!snap.exists) return err(notFound(`Project ${id} not found`));
  const data = snap.data() as ProjectStored;
  if (data.userId !== userId) return err(notFound(`Project ${id} not found`));
  return ok(toProjectDoc(data));
}

export async function createProject(
  userId: string,
  input: ProjectInput,
): Promise<Result<ProjectDoc>> {
  // Verify client exists for this user
  const clientCheck = await getClient(userId, input.clientId);
  if (!clientCheck.ok) return clientCheck;

  const id = ulid();
  const now = Timestamp.now();
  const stored: ProjectStored = {
    id,
    userId,
    clientId: input.clientId,
    name: input.name,
    description: input.description,
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    hourlyRate: input.hourlyRate,
    currency: input.currency,
    totalQuoted: input.totalQuoted,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection(COLLECTIONS.PROJECTS).doc(id).set(stored);
  return ok(toProjectDoc(stored));
}

export async function updateProject(
  userId: string,
  id: string,
  input: ProjectInput,
): Promise<Result<ProjectDoc>> {
  const existing = await getProject(userId, id);
  if (!existing.ok) return existing;

  // If status is being changed to "completed", verify all milestones are paid/cancelled
  if (input.status === "completed" && existing.data.status !== "completed") {
    const milestones = await listMilestonesForProject(userId, id);
    const blocking = milestones.filter(
      (m) => m.status !== "paid" && m.status !== "cancelled",
    );
    if (blocking.length > 0) {
      return err(
        businessRule(
          `${blocking.length} milestone(s) are still open. Mark them paid or cancelled before completing the project.`,
        ),
      );
    }
  }

  const updated: ProjectStored = {
    id,
    userId,
    clientId: existing.data.clientId, // immutable after create
    name: input.name,
    description: input.description,
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    hourlyRate: input.hourlyRate,
    currency: input.currency,
    totalQuoted: input.totalQuoted,
    notes: input.notes,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.PROJECTS).doc(id).set(updated);
  return ok(toProjectDoc(updated));
}

export async function deleteProject(
  userId: string,
  id: string,
): Promise<Result<void>> {
  const existing = await getProject(userId, id);
  if (!existing.ok) return existing;
  const milestones = await listMilestonesForProject(userId, id);
  if (milestones.length > 0) {
    return err(
      businessRule(
        `Project has ${milestones.length} milestone(s). Delete them first.`,
      ),
    );
  }
  await getDb().collection(COLLECTIONS.PROJECTS).doc(id).delete();
  return ok(undefined);
}

// ============================================================================
// Milestones
// ============================================================================

export interface MilestoneDoc {
  id: string;
  userId: string;
  projectId: string;
  clientId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  dueDate?: string;
  status: MilestoneStatus;
  sortOrder: number;
  linkedInvoiceId?: string;
  linkedIncomeId?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MilestoneStored {
  id: string;
  userId: string;
  projectId: string;
  clientId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  dueDate?: string;
  status: MilestoneStatus;
  sortOrder: number;
  linkedInvoiceId?: string;
  linkedIncomeId?: string;
  notes?: string;
  paidAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toMilestoneDoc(s: MilestoneStored): MilestoneDoc {
  return {
    ...s,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
    paidAt: s.paidAt ? s.paidAt.toDate().toISOString() : undefined,
  };
}

export async function listMilestonesForProject(
  userId: string,
  projectId: string,
): Promise<MilestoneDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.MILESTONES)
    .where("userId", "==", userId)
    .where("projectId", "==", projectId)
    .get();
  return snap.docs
    .map((d) => toMilestoneDoc(d.data() as MilestoneStored))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listAllMilestones(
  userId: string,
  options: { status?: MilestoneStatus } = {},
): Promise<MilestoneDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.MILESTONES)
    .where("userId", "==", userId)
    .get();
  let docs = snap.docs.map((d) => toMilestoneDoc(d.data() as MilestoneStored));
  if (options.status) docs = docs.filter((d) => d.status === options.status);
  docs.sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return docs;
}

export async function getMilestone(
  userId: string,
  id: string,
): Promise<Result<MilestoneDoc>> {
  const snap = await getDb().collection(COLLECTIONS.MILESTONES).doc(id).get();
  if (!snap.exists) return err(notFound(`Milestone ${id} not found`));
  const data = snap.data() as MilestoneStored;
  if (data.userId !== userId) return err(notFound(`Milestone ${id} not found`));
  return ok(toMilestoneDoc(data));
}

export async function createMilestone(
  userId: string,
  input: MilestoneInput,
): Promise<Result<MilestoneDoc>> {
  const projectCheck = await getProject(userId, input.projectId);
  if (!projectCheck.ok) return projectCheck;

  const id = ulid();
  const now = Timestamp.now();
  const stored: MilestoneStored = {
    id,
    userId,
    projectId: input.projectId,
    clientId: projectCheck.data.clientId,
    title: input.title,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    dueDate: input.dueDate,
    status: input.status,
    sortOrder: input.sortOrder,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection(COLLECTIONS.MILESTONES).doc(id).set(stored);
  return ok(toMilestoneDoc(stored));
}

export async function updateMilestone(
  userId: string,
  id: string,
  input: MilestoneInput,
): Promise<Result<MilestoneDoc>> {
  const existing = await getMilestone(userId, id);
  if (!existing.ok) return existing;
  const updated: MilestoneStored = {
    id,
    userId,
    projectId: existing.data.projectId, // immutable
    clientId: existing.data.clientId,
    title: input.title,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    dueDate: input.dueDate,
    status: input.status,
    sortOrder: input.sortOrder,
    notes: input.notes,
    linkedInvoiceId: existing.data.linkedInvoiceId,
    linkedIncomeId: existing.data.linkedIncomeId,
    paidAt: existing.data.paidAt ? Timestamp.fromDate(new Date(existing.data.paidAt)) : undefined,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.MILESTONES).doc(id).set(updated);
  return ok(toMilestoneDoc(updated));
}

export async function deleteMilestone(
  userId: string,
  id: string,
): Promise<Result<void>> {
  const existing = await getMilestone(userId, id);
  if (!existing.ok) return existing;
  await getDb().collection(COLLECTIONS.MILESTONES).doc(id).delete();
  return ok(undefined);
}

/**
 * Transition a milestone to a new status, handling side effects:
 * - status → `paid`: auto-create an income record (freelance / clientName),
 *   write linkedIncomeId back, set paidAt.
 * - status → `invoiced`: marker only; the actual invoice doc creation is
 *   triggered by the Invoice generator UI (and writes linkedInvoiceId back).
 */
export async function transitionMilestoneStatus(args: {
  userId: string;
  milestoneId: string;
  toStatus: MilestoneStatus;
}): Promise<Result<MilestoneDoc>> {
  const { userId, milestoneId, toStatus } = args;
  const existing = await getMilestone(userId, milestoneId);
  if (!existing.ok) return existing;

  if (existing.data.status === toStatus) {
    return ok(existing.data);
  }

  // Side effect: paid → create income
  let linkedIncomeId = existing.data.linkedIncomeId;
  let paidAt: Timestamp | undefined = existing.data.paidAt
    ? Timestamp.fromDate(new Date(existing.data.paidAt))
    : undefined;

  if (toStatus === "paid" && existing.data.status !== "paid") {
    // Fetch client to use their name as the platform tag
    const client = await getClient(userId, existing.data.clientId);
    const platform = client.ok ? client.data.name : "Client payment";
    try {
      // Income service expects amount in MAJOR units; convert from milestone's minor units.
      const amountMajor = existing.data.amount / 100;
      const incomeRes = await createIncome(userId, {
        source: "freelance",
        platform,
        amountMajor,
        currency: existing.data.currency as "PKR" | "USD" | "EUR" | "GBP" | "AED",
        date: new Date().toISOString().slice(0, 10),
        notes: `Milestone: ${existing.data.title}`,
      });
      if (incomeRes.ok) {
        linkedIncomeId = incomeRes.data.id;
      }
    } catch (e) {
      logger.error({ err: e, milestoneId }, "milestone_paid_income_create_failed");
      // continue — milestone still transitions even if income creation glitched
    }
    paidAt = Timestamp.now();
  }

  // Side effect: unpaid → null out paid timestamp
  if (existing.data.status === "paid" && toStatus !== "paid") {
    paidAt = undefined;
  }

  const updated: MilestoneStored = {
    id: existing.data.id,
    userId,
    projectId: existing.data.projectId,
    clientId: existing.data.clientId,
    title: existing.data.title,
    description: existing.data.description,
    amount: existing.data.amount,
    currency: existing.data.currency,
    dueDate: existing.data.dueDate,
    status: toStatus,
    sortOrder: existing.data.sortOrder,
    notes: existing.data.notes,
    linkedInvoiceId: existing.data.linkedInvoiceId,
    linkedIncomeId,
    paidAt,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.MILESTONES).doc(milestoneId).set(updated);
  return ok(toMilestoneDoc(updated));
}

export async function linkMilestoneInvoice(
  userId: string,
  milestoneId: string,
  invoiceId: string,
): Promise<Result<void>> {
  const existing = await getMilestone(userId, milestoneId);
  if (!existing.ok) return existing;
  await getDb()
    .collection(COLLECTIONS.MILESTONES)
    .doc(milestoneId)
    .update({ linkedInvoiceId: invoiceId, status: "invoiced", updatedAt: Timestamp.now() });
  return ok(undefined);
}

// ============================================================================
// Aggregates
// ============================================================================

export interface ClientSummary {
  client: ClientDoc;
  activeProjects: number;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  primaryCurrency: string;
}

export async function getClientSummaries(userId: string): Promise<ClientSummary[]> {
  const [clients, projects, milestones] = await Promise.all([
    listClients(userId),
    listAllProjects(userId),
    listAllMilestones(userId),
  ]);

  return clients.map((client) => {
    const clientProjects = projects.filter((p) => p.clientId === client.id);
    const clientMilestones = milestones.filter((m) => m.clientId === client.id);
    const active = clientProjects.filter((p) => p.status === "active").length;
    let totalBilled = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let primaryCurrency = clientProjects[0]?.currency ?? "PKR";
    for (const m of clientMilestones) {
      if (m.status === "cancelled") continue;
      totalBilled += m.amount;
      if (m.status === "paid") totalPaid += m.amount;
      else outstanding += m.amount;
      primaryCurrency = m.currency;
    }
    return {
      client,
      activeProjects: active,
      totalBilled,
      totalPaid,
      outstanding,
      primaryCurrency,
    };
  });
}

export async function getOutstandingMilestonesTotal(
  userId: string,
): Promise<Map<string, number>> {
  const milestones = await listAllMilestones(userId);
  const totals = new Map<string, number>();
  for (const m of milestones) {
    if (m.status === "paid" || m.status === "cancelled") continue;
    totals.set(m.currency, (totals.get(m.currency) ?? 0) + m.amount);
  }
  return totals;
}
