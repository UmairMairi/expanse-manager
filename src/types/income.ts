import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/utils/currency";

export const INCOME_SOURCES = ["salary", "freelance", "direct", "other"] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

export const PLATFORMS_BY_SOURCE: Record<IncomeSource, ReadonlyArray<string>> = {
  salary: ["THQ", "Xint"],
  freelance: ["Upwork", "Fiverr", "Freelancer.com"],
  direct: ["Wise", "Payoneer", "Binance"],
  other: [],
};

export const IncomeInputSchema = z.object({
  source: z.enum(INCOME_SOURCES),
  platform: z.string().min(1).max(64),
  amountMajor: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(1_000_000_000, "Amount too large"),
  currency: z.enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]]),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(2000).optional(),
});

export type IncomeInput = z.infer<typeof IncomeInputSchema>;

export const IncomeDocSchema = IncomeInputSchema.extend({
  id: z.string(),
  userId: z.string(),
  amount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type IncomeDoc = z.infer<typeof IncomeDocSchema>;
