import { z } from "zod";

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED"] as const;

export const LineItemSchema = z.object({
  description: z.string().min(1).max(300),
  quantity: z.number().min(0.01),
  unitPrice: z.number().int().min(0), // minor units
  taxPercent: z.number().min(0).max(100).default(0),
});

export type LineItemInput = z.infer<typeof LineItemSchema>;

export const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(40),
  clientId: z.string().min(1),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  currency: z.enum(INVOICE_CURRENCIES),
  lineItems: z.array(LineItemSchema).min(1, "At least one line item required"),
  notes: z.string().max(2000).optional(),
  status: z.enum(INVOICE_STATUSES),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;
