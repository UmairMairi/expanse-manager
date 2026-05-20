"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/auth.service";
import {
  contributeToGoal,
  createSavingsGoal,
  deleteSavingsGoal,
  updateSavingsGoal,
} from "@/services/savings.service";
import { SavingsGoalSchema, ContributionSchema } from "./schemas";

export async function createSavingsGoalAction(input: unknown) {
  const user = await requireUser();
  const parsed = SavingsGoalSchema.parse(input);
  const result = await createSavingsGoal(user.username, parsed);
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return result;
}

export async function updateSavingsGoalAction(id: string, input: unknown) {
  const user = await requireUser();
  const parsed = SavingsGoalSchema.parse(input);
  const result = await updateSavingsGoal(user.username, id, parsed);
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return result;
}

export async function deleteSavingsGoalAction(id: string) {
  const user = await requireUser();
  const result = await deleteSavingsGoal(user.username, id);
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return result;
}

export async function contributeToGoalAction(input: unknown) {
  const user = await requireUser();
  const parsed = ContributionSchema.parse(input);
  const result = await contributeToGoal(user.username, parsed);
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  return result;
}
