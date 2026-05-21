import "server-only";
import { ulid } from "ulid";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { type Result, err, ok, notFound } from "@/lib/errors";
import type { PaymentMethodInput } from "@/features/settings/schemas";

export interface PaymentMethodDoc {
  id: string;
  userId: string;
  name: string;
  type: PaymentMethodInput["type"];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stored {
  id: string;
  userId: string;
  name: string;
  type: PaymentMethodInput["type"];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDoc(s: Stored): PaymentMethodDoc {
  return {
    ...s,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
  };
}

export async function listPaymentMethods(userId: string): Promise<PaymentMethodDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.PAYMENT_METHODS)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => toDoc(d.data() as Stored))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPaymentMethod(
  userId: string,
  id: string,
): Promise<Result<PaymentMethodDoc>> {
  const snap = await getDb().collection(COLLECTIONS.PAYMENT_METHODS).doc(id).get();
  if (!snap.exists) return err(notFound(`Payment method ${id} not found`));
  const data = snap.data() as Stored;
  if (data.userId !== userId) return err(notFound(`Payment method ${id} not found`));
  return ok(toDoc(data));
}

export async function createPaymentMethod(
  userId: string,
  input: PaymentMethodInput,
): Promise<PaymentMethodDoc> {
  const id = ulid();
  const now = Timestamp.now();
  const stored: Stored = {
    id,
    userId,
    name: input.name,
    type: input.type,
    notes: input.notes || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection(COLLECTIONS.PAYMENT_METHODS).doc(id).set(stored);
  return toDoc(stored);
}

export async function updatePaymentMethod(
  userId: string,
  id: string,
  input: PaymentMethodInput,
): Promise<Result<PaymentMethodDoc>> {
  const existing = await getPaymentMethod(userId, id);
  if (!existing.ok) return existing;
  const updated: Stored = {
    id,
    userId,
    name: input.name,
    type: input.type,
    notes: input.notes || undefined,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.PAYMENT_METHODS).doc(id).set(updated);
  return ok(toDoc(updated));
}

export async function deletePaymentMethod(
  userId: string,
  id: string,
): Promise<Result<void>> {
  const existing = await getPaymentMethod(userId, id);
  if (!existing.ok) return existing;
  await getDb().collection(COLLECTIONS.PAYMENT_METHODS).doc(id).delete();
  return ok(undefined);
}
