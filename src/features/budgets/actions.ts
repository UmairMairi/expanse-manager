"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/auth.service";
import { createBudget, deleteBudget, updateBudget } from "@/services/budgets.service";
import { BudgetSchema } from "./schemas";

export async function createBudgetAction(input: unknown) {
  const user = await requireUser();
  const parsed = BudgetSchema.parse(input);
  const result = await createBudget(user.username, parsed);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return result;
}

export async function updateBudgetAction(id: string, input: unknown) {
  const user = await requireUser();
  const parsed = BudgetSchema.parse(input);
  const result = await updateBudget(user.username, id, parsed);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return result;
}

export async function deleteBudgetAction(id: string) {
  const user = await requireUser();
  const result = await deleteBudget(user.username, id);
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return result;
}
