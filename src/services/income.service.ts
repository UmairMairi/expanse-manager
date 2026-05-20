import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { ulid } from "ulid";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { fromMajor, type Currency } from "@/lib/money";
import { type Result, ok, err, notFound, internal } from "@/lib/errors";
import type { IncomeDoc, IncomeInput } from "@/types/income";

type Stored = {
  id: string;
  userId: string;
  source: string;
  platform: string;
  amount: number;
  currency: Currency;
  date: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

function toDoc(s: Stored): IncomeDoc {
  return {
    id: s.id,
    userId: s.userId,
    source: s.source as IncomeDoc["source"],
    platform: s.platform,
    amountMajor: s.amount / 100,
    amount: s.amount,
    currency: s.currency as IncomeDoc["currency"],
    date: s.date.toDate().toISOString(),
    notes: s.notes,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
  };
}

export async function listIncome(
  userId: string,
  options: { limit?: number; from?: Date; to?: Date } = {},
): Promise<IncomeDoc[]> {
  let query = getDb()
    .collection(COLLECTIONS.INCOME)
    .where("userId", "==", userId)
    .orderBy("date", "desc");

  if (options.from) query = query.where("date", ">=", Timestamp.fromDate(options.from));
  if (options.to) query = query.where("date", "<=", Timestamp.fromDate(options.to));
  if (options.limit) query = query.limit(options.limit);

  const snap = await query.get();
  return snap.docs.map((d) => toDoc(d.data() as Stored));
}

export async function createIncome(
  userId: string,
  input: IncomeInput,
): Promise<Result<IncomeDoc>> {
  try {
    const id = ulid();
    const now = Timestamp.now();
    const money = fromMajor(input.amountMajor, input.currency as Currency);
    const stored: Stored = {
      id,
      userId,
      source: input.source,
      platform: input.platform,
      amount: money.amount,
      currency: money.currency,
      date: Timestamp.fromDate(new Date(input.date)),
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    await getDb().collection(COLLECTIONS.INCOME).doc(id).set(stored);
    return ok(toDoc(stored));
  } catch (e) {
    return err(internal(e instanceof Error ? e.message : "Failed to create income"));
  }
}

export async function updateIncome(
  userId: string,
  id: string,
  input: IncomeInput,
): Promise<Result<IncomeDoc>> {
  const ref = getDb().collection(COLLECTIONS.INCOME).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return err(notFound("income", id));
  const existing = snap.data() as Stored;
  if (existing.userId !== userId) return err(notFound("income", id));

  const money = fromMajor(input.amountMajor, input.currency as Currency);
  await ref.update({
    source: input.source,
    platform: input.platform,
    amount: money.amount,
    currency: money.currency,
    date: Timestamp.fromDate(new Date(input.date)),
    notes: input.notes,
    updatedAt: Timestamp.now(),
  });
  const updated = await ref.get();
  return ok(toDoc(updated.data() as Stored));
}

export async function deleteIncome(
  userId: string,
  id: string,
): Promise<Result<true>> {
  const ref = getDb().collection(COLLECTIONS.INCOME).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return err(notFound("income", id));
  const existing = snap.data() as Stored;
  if (existing.userId !== userId) return err(notFound("income", id));
  await ref.delete();
  return ok(true);
}

export async function totalsByCurrency(
  userId: string,
  from: Date,
  to: Date,
): Promise<Map<Currency, number>> {
  const docs = await listIncome(userId, { from, to });
  const out = new Map<Currency, number>();
  for (const d of docs) {
    out.set(d.currency as Currency, (out.get(d.currency as Currency) ?? 0) + d.amount);
  }
  return out;
}
