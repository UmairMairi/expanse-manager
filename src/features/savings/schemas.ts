import { z } from "zod";

export const SAVINGS_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED"] as const;

export const SavingsGoalSchema = z.object({
  goalName: z.string().min(1, "Goal name is required").max(80),
  targetAmount: z.number().int().positive("Target must be positive"),
  savedAmount: z.number().int().min(0),
  currency: z.enum(SAVINGS_CURRENCIES),
  deadline: z.string().optional(),
  monthlyTarget: z.number().int().min(0).optional(),
  isEmergencyFund: z.boolean(),
  notes: z.string().max(500).optional(),
});

export type SavingsGoalInput = z.infer<typeof SavingsGoalSchema>;

export const ContributionSchema = z.object({
  goalId: z.string().min(1),
  amount: z.number().int().refine((v) => v !== 0, "Amount cannot be zero"),
  note: z.string().max(200).optional(),
});

export type ContributionInput = z.infer<typeof ContributionSchema>;
