import "server-only";
import { ulid } from "ulid";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { type Result, err, ok, notFound } from "@/lib/errors";
import { linkMilestoneInvoice } from "@/services/clients.service";
import type { InvoiceInput, InvoiceStatus, LineItemInput } from "@/features/invoices/schemas";

export interface InvoiceDoc {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  milestoneId?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: LineItemInput[];
  subtotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
  status: InvoiceStatus;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stored {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  milestoneId?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  lineItems: LineItemInput[];
  subtotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
  status: InvoiceStatus;
  sentAt?: Timestamp;
  paidAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function computeTotals(lineItems: LineItemInput[]): {
  subtotal: number;
  taxTotal: number;
  total: number;
} {
  let subtotal = 0;
  let taxTotal = 0;
  for (const li of lineItems) {
    const line = Math.round(li.quantity * li.unitPrice);
    const tax = Math.round((line * li.taxPercent) / 100);
    subtotal += line;
    taxTotal += tax;
  }
  return { subtotal, taxTotal, total: subtotal + taxTotal };
}

function toDoc(s: Stored): InvoiceDoc {
  return {
    ...s,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
    sentAt: s.sentAt?.toDate().toISOString(),
    paidAt: s.paidAt?.toDate().toISOString(),
  };
}

export async function listInvoices(userId: string): Promise<InvoiceDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.INVOICES)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => toDoc(d.data() as Stored))
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
}

export async function getInvoice(
  userId: string,
  id: string,
): Promise<Result<InvoiceDoc>> {
  const snap = await getDb().collection(COLLECTIONS.INVOICES).doc(id).get();
  if (!snap.exists) return err(notFound(`Invoice ${id} not found`));
  const data = snap.data() as Stored;
  if (data.userId !== userId) return err(notFound(`Invoice ${id} not found`));
  return ok(toDoc(data));
}

export async function createInvoice(
  userId: string,
  input: InvoiceInput,
): Promise<InvoiceDoc> {
  const id = ulid();
  const now = Timestamp.now();
  const totals = computeTotals(input.lineItems);
  const stored: Stored = {
    id,
    userId,
    invoiceNumber: input.invoiceNumber,
    clientId: input.clientId,
    projectId: input.projectId,
    milestoneId: input.milestoneId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    lineItems: input.lineItems,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    notes: input.notes,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection(COLLECTIONS.INVOICES).doc(id).set(stored);

  if (input.milestoneId) {
    await linkMilestoneInvoice(userId, input.milestoneId, id);
  }

  return toDoc(stored);
}

export async function updateInvoice(
  userId: string,
  id: string,
  input: InvoiceInput,
): Promise<Result<InvoiceDoc>> {
  const existing = await getInvoice(userId, id);
  if (!existing.ok) return existing;
  const totals = computeTotals(input.lineItems);
  const updated: Stored = {
    id,
    userId,
    invoiceNumber: input.invoiceNumber,
    clientId: input.clientId,
    projectId: input.projectId,
    milestoneId: input.milestoneId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    lineItems: input.lineItems,
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    notes: input.notes,
    status: input.status,
    sentAt: existing.data.sentAt ? Timestamp.fromDate(new Date(existing.data.sentAt)) : undefined,
    paidAt: existing.data.paidAt ? Timestamp.fromDate(new Date(existing.data.paidAt)) : undefined,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.INVOICES).doc(id).set(updated);
  return ok(toDoc(updated));
}

export async function deleteInvoice(
  userId: string,
  id: string,
): Promise<Result<void>> {
  const existing = await getInvoice(userId, id);
  if (!existing.ok) return existing;
  await getDb().collection(COLLECTIONS.INVOICES).doc(id).delete();
  return ok(undefined);
}

export async function markInvoiceStatus(
  userId: string,
  id: string,
  status: InvoiceStatus,
): Promise<Result<InvoiceDoc>> {
  const existing = await getInvoice(userId, id);
  if (!existing.ok) return existing;
  const updates: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
  };
  if (status === "sent" && !existing.data.sentAt) updates.sentAt = Timestamp.now();
  if (status === "paid" && !existing.data.paidAt) updates.paidAt = Timestamp.now();
  await getDb().collection(COLLECTIONS.INVOICES).doc(id).update(updates);
  return getInvoice(userId, id);
}
