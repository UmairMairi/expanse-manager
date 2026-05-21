import "server-only";
import { ulid } from "ulid";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { type Result, err, ok, notFound } from "@/lib/errors";
import type { CategoryInput } from "@/features/settings/schemas";

export interface CategoryDoc {
  id: string;
  userId: string;
  name: string;
  color?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stored {
  id: string;
  userId: string;
  name: string;
  color?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDoc(s: Stored): CategoryDoc {
  return {
    ...s,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
  };
}

export async function listCategories(userId: string): Promise<CategoryDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.CATEGORIES)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => toDoc(d.data() as Stored))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCategory(
  userId: string,
  id: string,
): Promise<Result<CategoryDoc>> {
  const snap = await getDb().collection(COLLECTIONS.CATEGORIES).doc(id).get();
  if (!snap.exists) return err(notFound(`Category ${id} not found`));
  const data = snap.data() as Stored;
  if (data.userId !== userId) return err(notFound(`Category ${id} not found`));
  return ok(toDoc(data));
}

export async function createCategory(
  userId: string,
  input: CategoryInput,
): Promise<CategoryDoc> {
  const id = ulid();
  const now = Timestamp.now();
  const stored: Stored = {
    id,
    userId,
    name: input.name,
    color: input.color || undefined,
    notes: input.notes || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection(COLLECTIONS.CATEGORIES).doc(id).set(stored);
  return toDoc(stored);
}

export async function updateCategory(
  userId: string,
  id: string,
  input: CategoryInput,
): Promise<Result<CategoryDoc>> {
  const existing = await getCategory(userId, id);
  if (!existing.ok) return existing;
  const updated: Stored = {
    id,
    userId,
    name: input.name,
    color: input.color || undefined,
    notes: input.notes || undefined,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.CATEGORIES).doc(id).set(updated);
  return ok(toDoc(updated));
}

export async function deleteCategory(
  userId: string,
  id: string,
): Promise<Result<void>> {
  const existing = await getCategory(userId, id);
  if (!existing.ok) return existing;
  await getDb().collection(COLLECTIONS.CATEGORIES).doc(id).delete();
  return ok(undefined);
}
