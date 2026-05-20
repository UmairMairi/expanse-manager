import { z } from "zod";

export const ClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  taxId: z.string().max(60).optional(),
  notes: z.string().max(1000).optional(),
});

export type ClientInput = z.infer<typeof ClientSchema>;

export const PROJECT_STATUSES = ["active", "on-hold", "completed", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "AED"] as const;

export const ProjectSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(2000).optional(),
  status: z.enum(PROJECT_STATUSES),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hourlyRate: z.number().int().min(0).optional(),
  currency: z.enum(PROJECT_CURRENCIES),
  totalQuoted: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;

export const MILESTONE_STATUSES = [
  "pending",
  "in-progress",
  "invoiced",
  "paid",
  "cancelled",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MilestoneSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(160),
  description: z.string().max(1000).optional(),
  amount: z.number().int().positive("Amount must be positive"),
  currency: z.enum(PROJECT_CURRENCIES),
  dueDate: z.string().optional(),
  status: z.enum(MILESTONE_STATUSES),
  sortOrder: z.number().int().min(0),
  notes: z.string().max(500).optional(),
});

export type MilestoneInput = z.infer<typeof MilestoneSchema>;
