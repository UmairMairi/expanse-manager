"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/auth.service";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categories.service";
import {
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/services/payment-methods.service";
import { CategorySchema, PaymentMethodSchema } from "./schemas";

function bust() {
  revalidatePath("/settings");
  revalidatePath("/expenses");
  revalidatePath("/budgets");
}

// --- Categories ---
export async function createCategoryAction(input: unknown) {
  const user = await requireUser();
  const parsed = CategorySchema.parse(input);
  const result = await createCategory(user.username, parsed);
  bust();
  return result;
}

export async function updateCategoryAction(id: string, input: unknown) {
  const user = await requireUser();
  const parsed = CategorySchema.parse(input);
  const result = await updateCategory(user.username, id, parsed);
  bust();
  return result;
}

export async function deleteCategoryAction(id: string) {
  const user = await requireUser();
  const result = await deleteCategory(user.username, id);
  bust();
  return result;
}

// --- Payment Methods ---
export async function createPaymentMethodAction(input: unknown) {
  const user = await requireUser();
  const parsed = PaymentMethodSchema.parse(input);
  const result = await createPaymentMethod(user.username, parsed);
  bust();
  return result;
}

export async function updatePaymentMethodAction(id: string, input: unknown) {
  const user = await requireUser();
  const parsed = PaymentMethodSchema.parse(input);
  const result = await updatePaymentMethod(user.username, id, parsed);
  bust();
  return result;
}

export async function deletePaymentMethodAction(id: string) {
  const user = await requireUser();
  const result = await deletePaymentMethod(user.username, id);
  bust();
  return result;
}
