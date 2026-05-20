import "server-only";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { ulid } from "ulid";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { fromMajor, type Currency } from "@/lib/money";
import { type Result, ok, err, notFound, internal } from "@/lib/errors";
import type { ExpenseDoc, ExpenseInput } from "@/types/expense";

type Stored = {
  id: string;
  userId: string;
  title: string;
  amount: number; // minor units
  currency: Currency;
  category: string;
  date: Timestamp;
  paymentMethod: string;
  notes?: string;
  tags: string[];
  receiptUrl?: string;
  recurrence?: { interval: string; until?: Timestamp } | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

function toDoc(s: Stored): ExpenseDoc {
  return {
    id: s.id,
    userId: s.userId,
    title: s.title,
    amountMajor: s.amount / 100,
    amount: s.amount,
    currency: s.currency as ExpenseDoc["currency"],
    category: s.category,
    date: s.date.toDate().toISOString(),
    paymentMethod: s.paymentMethod as ExpenseDoc["paymentMethod"],
    notes: s.notes,
    tags: s.tags ?? [],
    receiptUrl: s.receiptUrl,
    recurrence: s.recurrence
      ? {
          interval: s.recurrence.interval as "daily" | "weekly" | "monthly" | "yearly",
          until: s.recurrence.until?.toDate().toISOString(),
        }
      : null,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
  };
}

export async function listExpenses(
  userId: string,
  options: { limit?: number; from?: Date; to?: Date } = {},
): Promise<ExpenseDoc[]> {
  // Single-field filter only (auto-indexed). Date filter + sort happen in JS
  // to avoid the composite-index requirement Firestore would otherwise enforce
  // on `where + orderBy` across different fields.
  const snap = await getDb()
    .collection(COLLECTIONS.EXPENSES)
    .where("userId", "==", userId)
    .get();

  const fromMs = options.from?.getTime();
  const toMs = options.to?.getTime();

  let docs = snap.docs.map((d) => toDoc(d.data() as Stored));

  if (fromMs !== undefined || toMs !== undefined) {
    docs = docs.filter((d) => {
      const t = new Date(d.date).getTime();
      if (fromMs !== undefined && t < fromMs) return false;
      if (toMs !== undefined && t > toMs) return false;
      return true;
    });
  }

  docs.sort((a, b) => b.date.localeCompare(a.date));

  if (options.limit) docs = docs.slice(0, options.limit);
  return docs;
}

export async function getExpense(
  userId: string,
  id: string,
): Promise<Result<ExpenseDoc>> {
  const snap = await getDb().collection(COLLECTIONS.EXPENSES).doc(id).get();
  if (!snap.exists) return err(notFound("expense", id));
  const data = snap.data() as Stored;
  if (data.userId !== userId) return err(notFound("expense", id));
  return ok(toDoc(data));
}

function recurrenceToStored(
  r: ExpenseInput["recurrence"],
): Stored["recurrence"] {
  if (!r) return null;
  return {
    interval: r.interval,
    ...(r.until ? { until: Timestamp.fromDate(new Date(r.until)) } : {}),
  };
}

export async function createExpense(
  userId: string,
  input: ExpenseInput,
): Promise<Result<ExpenseDoc>> {
  try {
    const id = ulid();
    const now = Timestamp.now();
    const money = fromMajor(input.amountMajor, input.currency as Currency);
    const stored: Stored = {
      id,
      userId,
      title: input.title,
      amount: money.amount,
      currency: money.currency,
      category: input.category,
      date: Timestamp.fromDate(new Date(input.date)),
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      tags: input.tags,
      receiptUrl: input.receiptUrl,
      recurrence: recurrenceToStored(input.recurrence),
      createdAt: now,
      updatedAt: now,
    };
    await getDb().collection(COLLECTIONS.EXPENSES).doc(id).set(stored);
    return ok(toDoc(stored));
  } catch (e) {
    return err(internal(e instanceof Error ? e.message : "Failed to create expense"));
  }
}

export async function updateExpense(
  userId: string,
  id: string,
  input: ExpenseInput,
): Promise<Result<ExpenseDoc>> {
  const ref = getDb().collection(COLLECTIONS.EXPENSES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return err(notFound("expense", id));
  const existing = snap.data() as Stored;
  if (existing.userId !== userId) return err(notFound("expense", id));

  const money = fromMajor(input.amountMajor, input.currency as Currency);
  const update: Partial<Stored> = {
    title: input.title,
    amount: money.amount,
    currency: money.currency,
    category: input.category,
    date: Timestamp.fromDate(new Date(input.date)),
    paymentMethod: input.paymentMethod,
    notes: input.notes,
    tags: input.tags,
    receiptUrl: input.receiptUrl,
    recurrence: recurrenceToStored(input.recurrence),
    updatedAt: Timestamp.now(),
  };
  await ref.update(update);
  const updated = await ref.get();
  return ok(toDoc(updated.data() as Stored));
}

export async function deleteExpense(
  userId: string,
  id: string,
): Promise<Result<true>> {
  const ref = getDb().collection(COLLECTIONS.EXPENSES).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return err(notFound("expense", id));
  const existing = snap.data() as Stored;
  if (existing.userId !== userId) return err(notFound("expense", id));
  await ref.delete();
  return ok(true);
}

export async function totalsByCurrency(
  userId: string,
  from: Date,
  to: Date,
): Promise<Map<Currency, number>> {
  const docs = await listExpenses(userId, { from, to });
  const out = new Map<Currency, number>();
  for (const d of docs) {
    out.set(d.currency as Currency, (out.get(d.currency as Currency) ?? 0) + d.amount);
  }
  return out;
}
// FieldValue retained for future delete-field operations.
export const _firestoreUnused = FieldValue;
