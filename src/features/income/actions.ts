"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/auth.service";
import {
  createIncome as createIncomeSvc,
  updateIncome as updateIncomeSvc,
  deleteIncome as deleteIncomeSvc,
} from "@/services/income.service";
import { IncomeInputSchema, type IncomeDoc } from "@/types/income";
import { toAppError, type Result } from "@/lib/errors";

function bust() {
  revalidatePath("/dashboard");
  revalidatePath("/income");
}

export async function createIncomeAction(raw: unknown): Promise<Result<IncomeDoc>> {
  try {
    const user = await requireUser();
    const parsed = IncomeInputSchema.parse(raw);
    const res = await createIncomeSvc(user.username, parsed);
    if (res.ok) bust();
    return res;
  } catch (e) {
    return { ok: false, error: toAppError(e) };
  }
}

export async function updateIncomeAction(
  id: string,
  raw: unknown,
): Promise<Result<IncomeDoc>> {
  try {
    const user = await requireUser();
    const parsed = IncomeInputSchema.parse(raw);
    const res = await updateIncomeSvc(user.username, id, parsed);
    if (res.ok) bust();
    return res;
  } catch (e) {
    return { ok: false, error: toAppError(e) };
  }
}

export async function deleteIncomeAction(id: string): Promise<Result<true>> {
  try {
    const user = await requireUser();
    const res = await deleteIncomeSvc(user.username, id);
    if (res.ok) bust();
    return res;
  } catch (e) {
    return { ok: false, error: toAppError(e) };
  }
}
