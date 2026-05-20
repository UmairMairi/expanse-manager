import "server-only";
import { ulid } from "ulid";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { listExpenses } from "@/services/expenses.service";
import { createNotification } from "@/services/notifications.service";
import { sendEmail, isEmailConfigured } from "@/services/email.service";
import { BudgetWarningEmail } from "../../emails/budget-warning";
import { type Result, err, ok, notFound } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { BudgetInput } from "@/features/budgets/schemas";

export interface BudgetDoc {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  warningThreshold: number;
  currency: string;
  notes?: string;
  lastNotifiedThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

interface Stored {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  warningThreshold: number;
  currency: string;
  notes?: string;
  lastNotifiedThreshold?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function toDoc(s: Stored): BudgetDoc {
  return {
    ...s,
    createdAt: s.createdAt.toDate().toISOString(),
    updatedAt: s.updatedAt.toDate().toISOString(),
  };
}

export async function listBudgets(userId: string): Promise<BudgetDoc[]> {
  const snap = await getDb()
    .collection(COLLECTIONS.BUDGETS)
    .where("userId", "==", userId)
    .get();
  return snap.docs
    .map((d) => toDoc(d.data() as Stored))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export async function getBudget(
  userId: string,
  id: string,
): Promise<Result<BudgetDoc>> {
  const snap = await getDb().collection(COLLECTIONS.BUDGETS).doc(id).get();
  if (!snap.exists) return err(notFound(`Budget ${id} not found`));
  const data = snap.data() as Stored;
  if (data.userId !== userId) return err(notFound(`Budget ${id} not found`));
  return ok(toDoc(data));
}

export async function createBudget(
  userId: string,
  input: BudgetInput,
): Promise<BudgetDoc> {
  const id = ulid();
  const now = Timestamp.now();
  const stored: Stored = {
    id,
    userId,
    category: input.category,
    monthlyLimit: input.monthlyLimit,
    warningThreshold: input.warningThreshold,
    currency: input.currency,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().collection(COLLECTIONS.BUDGETS).doc(id).set(stored);
  return toDoc(stored);
}

export async function updateBudget(
  userId: string,
  id: string,
  input: BudgetInput,
): Promise<Result<BudgetDoc>> {
  const existing = await getBudget(userId, id);
  if (!existing.ok) return existing;
  const updated: Stored = {
    id,
    userId,
    category: input.category,
    monthlyLimit: input.monthlyLimit,
    warningThreshold: input.warningThreshold,
    currency: input.currency,
    notes: input.notes,
    lastNotifiedThreshold: existing.data.lastNotifiedThreshold,
    createdAt: Timestamp.fromDate(new Date(existing.data.createdAt)),
    updatedAt: Timestamp.now(),
  };
  await getDb().collection(COLLECTIONS.BUDGETS).doc(id).set(updated);
  return ok(toDoc(updated));
}

export async function deleteBudget(
  userId: string,
  id: string,
): Promise<Result<void>> {
  const existing = await getBudget(userId, id);
  if (!existing.ok) return existing;
  await getDb().collection(COLLECTIONS.BUDGETS).doc(id).delete();
  return ok(undefined);
}

export interface BudgetStatus {
  budget: BudgetDoc;
  spent: number;
  percentUsed: number;
  state: "ok" | "warning" | "exceeded";
}

function monthRange(d: Date = new Date()): { from: Date; to: Date } {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

export async function getBudgetStatuses(userId: string): Promise<BudgetStatus[]> {
  const [budgets, expenses] = await Promise.all([
    listBudgets(userId),
    (async () => {
      const range = monthRange();
      return listExpenses(userId, { from: range.from, to: range.to });
    })(),
  ]);

  return budgets.map((b) => {
    const spent = expenses
      .filter((e) => e.category === b.category && e.currency === b.currency)
      .reduce((sum, e) => sum + e.amount, 0);
    const percent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
    const state: BudgetStatus["state"] =
      percent >= 100 ? "exceeded" : percent >= b.warningThreshold ? "warning" : "ok";
    return { budget: b, spent, percentUsed: percent, state };
  });
}

/**
 * Called by expense create/update Server Actions. Recomputes the affected
 * budget; if a new threshold is crossed (vs lastNotifiedThreshold), fires
 * a notification + email. Idempotent: re-crossing the same threshold in
 * the same month won't re-notify.
 */
export async function checkBudgetThreshold(args: {
  userId: string;
  recipientEmail: string;
  recipientName: string;
  category: string;
  currency: string;
}): Promise<void> {
  const { userId, recipientEmail, recipientName, category, currency } = args;

  // Find the budget for this category + currency
  const budgets = await listBudgets(userId);
  const budget = budgets.find((b) => b.category === category && b.currency === currency);
  if (!budget) return;

  const range = monthRange();
  const expenses = await listExpenses(userId, { from: range.from, to: range.to });
  const spent = expenses
    .filter((e) => e.category === category && e.currency === currency)
    .reduce((sum, e) => sum + e.amount, 0);
  const percent = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;

  let crossedThreshold: 80 | 100 | null = null;
  if (percent >= 100) crossedThreshold = 100;
  else if (percent >= budget.warningThreshold) crossedThreshold = 80;

  if (!crossedThreshold) return;
  if (budget.lastNotifiedThreshold && budget.lastNotifiedThreshold >= crossedThreshold) {
    // Already notified at this or higher threshold this month
    return;
  }

  const monthLabel = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const subject =
    crossedThreshold === 100
      ? `Budget exceeded: ${category} (${monthLabel})`
      : `Budget warning: ${category} at ${Math.round(percent)}%`;

  try {
    await createNotification({
      userId,
      type: crossedThreshold === 100 ? "budget_exceeded" : "budget_warning",
      title: subject,
      body: `Your ${category} spend is ${Math.round(percent)}% of the monthly limit.`,
      href: "/budgets",
    });

    if (isEmailConfigured()) {
      await sendEmail({
        to: recipientEmail,
        subject,
        body: BudgetWarningEmail({
          recipientName,
          category,
          monthlyLimit: budget.monthlyLimit,
          currentSpend: spent,
          currency,
          percentUsed: percent,
          month: monthLabel,
        }),
      });
    }

    await getDb()
      .collection(COLLECTIONS.BUDGETS)
      .doc(budget.id)
      .update({ lastNotifiedThreshold: crossedThreshold });
  } catch (error) {
    logger.error({ error, budgetId: budget.id }, "budget_threshold_check_failed");
    // Don't throw — we don't want to fail the expense write because of a notification glitch.
  }
}
