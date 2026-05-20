import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/utils/currency";

export const DEFAULT_CATEGORIES = [
  "Food",
  "Rent",
  "Utilities",
  "Internet",
  "Travel",
  "Shopping",
  "Entertainment",
  "Health",
  "Investments",
  "Education",
  "Family",
  "Miscellaneous",
] as const;

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "mobile_wallet",
  "crypto",
  "other",
] as const;

export const RecurrenceSchema = z
  .object({
    interval: z.enum(["daily", "weekly", "monthly", "yearly"]),
    until: z.string().datetime().optional(),
  })
  .nullable();

export const ExpenseInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  amountMajor: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(1_000_000_000, "Amount too large"),
  currency: z.enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]]),
  category: z.string().min(1, "Category is required").max(64),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(32)).max(20),
  receiptUrl: z.string().url().optional(),
  recurrence: RecurrenceSchema.nullable().optional(),
});

export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;

export const ExpenseDocSchema = ExpenseInputSchema.extend({
  id: z.string(),
  userId: z.string(),
  amount: z.number().int().nonnegative(), // minor units
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ExpenseDoc = z.infer<typeof ExpenseDocSchema>;
