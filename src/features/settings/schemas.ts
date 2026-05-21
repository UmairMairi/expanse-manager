import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #6366f1")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(200).optional(),
});
export type CategoryInput = z.infer<typeof CategorySchema>;

export const PaymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(40),
  type: z.enum(["cash", "card", "bank_transfer", "wallet", "crypto", "other"]),
  notes: z.string().max(200).optional(),
});
export type PaymentMethodInput = z.infer<typeof PaymentMethodSchema>;
