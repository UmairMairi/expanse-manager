"use server";

import { requireUser } from "@/services/auth.service";
import { suggestCategory } from "@/ai/categorization";

export async function suggestCategoryAction(args: {
  title: string;
  notes?: string;
}): Promise<{ category: string | null }> {
  const user = await requireUser();
  if (!args.title || args.title.trim().length === 0) {
    return { category: null };
  }
  const category = await suggestCategory({
    userId: user.username,
    title: args.title,
    notes: args.notes,
  });
  return { category };
}
