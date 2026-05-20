"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/auth.service";
import {
  createExpense as createExpenseSvc,
  updateExpense as updateExpenseSvc,
  deleteExpense as deleteExpenseSvc,
} from "@/services/expenses.service";
import { ExpenseInputSchema } from "@/types/expense";
import { toAppError, type Result } from "@/lib/errors";
import type { ExpenseDoc } from "@/types/expense";

function bust() {
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function createExpenseAction(
  raw: unknown,
): Promise<Result<ExpenseDoc>> {
  try {
    const user = await requireUser();
    const parsed = ExpenseInputSchema.parse(raw);
    const res = await createExpenseSvc(user.username, parsed);
    if (res.ok) bust();
    return res;
  } catch (e) {
    return { ok: false, error: toAppError(e) };
  }
}

export async function updateExpenseAction(
  id: string,
  raw: unknown,
): Promise<Result<ExpenseDoc>> {
  try {
    const user = await requireUser();
    const parsed = ExpenseInputSchema.parse(raw);
    const res = await updateExpenseSvc(user.username, id, parsed);
    if (res.ok) bust();
    return res;
  } catch (e) {
    return { ok: false, error: toAppError(e) };
  }
}

export async function deleteExpenseAction(id: string): Promise<Result<true>> {
  try {
    const user = await requireUser();
    const res = await deleteExpenseSvc(user.username, id);
    if (res.ok) bust();
    return res;
  } catch (e) {
    return { ok: false, error: toAppError(e) };
  }
}
