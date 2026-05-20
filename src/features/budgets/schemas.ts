import { z } from "zod";

export const BudgetSchema = z.object({
  category: z.string().min(1).max(60),
  monthlyLimit: z.number().int().positive("Limit must be positive"),
  warningThreshold: z.number().int().min(1).max(99),
  currency: z.string().min(1).max(8),
  notes: z.string().max(500).optional(),
});

export type BudgetInput = z.infer<typeof BudgetSchema>;
