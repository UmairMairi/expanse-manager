import { z } from "zod";

export const SAVINGS_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED"] as const;

export const SAVINGS_LINKED_SOURCES = [
  "any",
  "salary",
  "freelance",
  "direct",
  "other",
] as const;

export const SavingsGoalSchema = z.object({
  goalName: z.string().min(1, "Goal name is required").max(80),
  targetAmount: z.number().int().positive("Target must be positive"),
  savedAmount: z.number().int().min(0),
  currency: z.enum(SAVINGS_CURRENCIES),
  deadline: z.string().optional(),
  monthlyTarget: z.number().int().min(0).optional(),
  isEmergencyFund: z.boolean(),
  // Optional linkage to an income stream. "any" means the goal isn't tied to
  // a specific source. `linkedPlatform` further narrows within a source
  // (e.g. source="freelance", platform="Upwork").
  linkedSource: z.enum(SAVINGS_LINKED_SOURCES),
  linkedPlatform: z.string().max(60).optional(),
  /**
   * If set, automatically contribute this percentage of every matching income
   * record to the goal when the income is created. 0 = manual contributions only.
   */
  autoContributePercent: z.number().min(0).max(100),
  notes: z.string().max(500).optional(),
});

export type SavingsGoalInput = z.infer<typeof SavingsGoalSchema>;

export const ContributionSchema = z.object({
  goalId: z.string().min(1),
  amount: z.number().int().refine((v) => v !== 0, "Amount cannot be zero"),
  note: z.string().max(200).optional(),
});

export type ContributionInput = z.infer<typeof ContributionSchema>;
