import "server-only";
import { ulid } from "ulid";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { type Result, err, ok, notFound } from "@/lib/errors";
import type { SavingsGoalInput, ContributionInput } from "@/features/savings/schemas";

export interface SavingsGoalDoc {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  currency: string;
  deadline?: string;
  monthlyTarget?: number;
  isEmergencyFund: boolean;
  linkedSource: "any" | "salary" | "freelance" | "direct" | "other";
  linkedPlatform?: string;
  autoContributePercent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stored {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  savedAmount: number;
  currency: string;
  deadline?: string;
  monthlyTarget?: number;
  isEmergencyFund: boolean;
  linkedSource?: SavingsGoalDoc["linkedSource"];
  linkedPlatform?: string;
  autoContributePercent?: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDoc(s: Stored): SavingsGoalDoc {
  return {
    ...s,
    linkedSource: s.linkedSource ?? "any",
    autoContributePercent: s.autoContributePercent ?? 0,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
  };
}

export async function listSavingsGoals(userId: string): Promise<SavingsGoalDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.SAVINGS)
    .where("userId", "==", userId)
    .get();
  const docs = snap.docs.map((d) => toDoc(d.data() as Stored));
  docs.sort((a, b) => {
    // Emergency funds first, then by created date descending
    if (a.isEmergencyFund && !b.isEmergencyFund) return -1;
    if (!a.isEmergencyFund && b.isEmergencyFund) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return docs;
}

export async function getSavingsGoal(
  userId: string,
  id: string,
): Promise<Result<SavingsGoalDoc>> {
  const snap = await getDb().collection(COLLECTIONS.SAVINGS).doc(id).get();
  if (!snap.exists) return err(notFound(`Goal ${id} not found`));
  const data = snap.data() as Stored;
  if (data.userId !== userId) return err(notFound(`Goal ${id} not found`));
  return ok(toDoc(data));
}

export async function createSavingsGoal(
  userId: string,
  input: SavingsGoalInput,
): Promise<SavingsGoalDoc> {
  const id = ulid();
  const now = Timestamp.now();
  const stored: Stored = {
    id,
    userId,
    goalName: input.goalName,
    targetAmount: input.targetAmount,
    savedAmount: input.savedAmount,
    currency: input.currency,
    deadline: input.deadline,
    monthlyTarget: input.monthlyTarget,
    isEmergencyFund: input.isEmergencyFund,
    linkedSource: input.linkedSource,
    linkedPlatform: input.linkedPlatform || undefined,
    autoContributePercent: input.autoContributePercent,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection(COLLECTIONS.SAVINGS).doc(id).set(stored);
  return toDoc(stored);
}

export async function updateSavingsGoal(
  userId: string,
  id: string,
  input: SavingsGoalInput,
): Promise<Result<SavingsGoalDoc>> {
  const existing = await getSavingsGoal(userId, id);
  if (!existing.ok) return existing;
  const updated: Stored = {
    id,
    userId,
    goalName: input.goalName,
    targetAmount: input.targetAmount,
    savedAmount: input.savedAmount,
    currency: input.currency,
    deadline: input.deadline,
    monthlyTarget: input.monthlyTarget,
    isEmergencyFund: input.isEmergencyFund,
    linkedSource: input.linkedSource,
    linkedPlatform: input.linkedPlatform || undefined,
    autoContributePercent: input.autoContributePercent,
    notes: input.notes,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.SAVINGS).doc(id).set(updated);
  return ok(toDoc(updated));
}

export async function deleteSavingsGoal(
  userId: string,
  id: string,
): Promise<Result<void>> {
  const existing = await getSavingsGoal(userId, id);
  if (!existing.ok) return existing;
  await getDb().collection(COLLECTIONS.SAVINGS).doc(id).delete();
  return ok(undefined);
}

/**
 * When an income record lands, look at every savings goal with autoContributePercent > 0
 * that matches the income's source/platform and currency, and bump savedAmount by the
 * configured slice. Failures are swallowed — must never break the income create.
 */
export async function applyAutoContributions(args: {
  userId: string;
  source: string;
  platform: string;
  currency: string;
  amount: number; // minor units
}): Promise<void> {
  try {
    const goals = await listSavingsGoals(args.userId);
    for (const goal of goals) {
      if (!goal.autoContributePercent || goal.autoContributePercent <= 0) continue;
      if (goal.currency !== args.currency) continue;
      const linked = goal.linkedSource ?? "any";
      if (linked !== "any" && linked !== args.source) continue;
      if (
        goal.linkedPlatform &&
        goal.linkedPlatform.trim().toLowerCase() !==
          args.platform.trim().toLowerCase()
      ) {
        continue;
      }
      const slice = Math.round((args.amount * goal.autoContributePercent) / 100);
      if (slice <= 0) continue;
      const newSaved = goal.savedAmount + slice;
      await getDb()
        .collection(COLLECTIONS.SAVINGS)
        .doc(goal.id)
        .update({
          savedAmount: newSaved,
          updatedAt: Timestamp.now(),
        });
    }
  } catch {
    // best-effort only — never block the income write
  }
}

export async function contributeToGoal(
  userId: string,
  input: ContributionInput,
): Promise<Result<SavingsGoalDoc>> {
  const existing = await getSavingsGoal(userId, input.goalId);
  if (!existing.ok) return existing;
  const newSaved = Math.max(0, existing.data.savedAmount + input.amount);
  const updated: Stored = {
    id: existing.data.id,
    userId,
    goalName: existing.data.goalName,
    targetAmount: existing.data.targetAmount,
    savedAmount: newSaved,
    currency: existing.data.currency,
    deadline: existing.data.deadline,
    monthlyTarget: existing.data.monthlyTarget,
    isEmergencyFund: existing.data.isEmergencyFund,
    notes: existing.data.notes,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.SAVINGS).doc(input.goalId).set(updated);
  return ok(toDoc(updated));
}
