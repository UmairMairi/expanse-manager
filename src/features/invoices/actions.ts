"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/auth.service";
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  markInvoiceStatus,
} from "@/services/invoices.service";
import { getClient } from "@/services/clients.service";
import { sendEmail, isEmailConfigured } from "@/services/email.service";
import { renderInvoicePdf } from "./pdf-renderer";
import { InvoiceSendEmail } from "../../../emails/invoice-send";
import { InvoiceSchema, type InvoiceStatus } from "./schemas";
import { type Result, err, businessRule } from "@/lib/errors";
import type { InvoiceDoc } from "@/services/invoices.service";

function bust() {
  revalidatePath("/invoices");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

export async function createInvoiceAction(input: unknown): Promise<InvoiceDoc> {
  const user = await requireUser();
  const parsed = InvoiceSchema.parse(input);
  const result = await createInvoice(user.username, parsed);
  bust();
  return result;
}

export async function updateInvoiceAction(id: string, input: unknown) {
  const user = await requireUser();
  const parsed = InvoiceSchema.parse(input);
  const result = await updateInvoice(user.username, id, parsed);
  bust();
  return result;
}

export async function deleteInvoiceAction(id: string) {
  const user = await requireUser();
  const result = await deleteInvoice(user.username, id);
  bust();
  return result;
}

export async function markInvoiceStatusAction(id: string, status: InvoiceStatus) {
  const user = await requireUser();
  const result = await markInvoiceStatus(user.username, id, status);
  bust();
  return result;
}

export async function emailInvoiceAction(id: string): Promise<Result<true>> {
  const user = await requireUser();
  const invoiceRes = await getInvoice(user.username, id);
  if (!invoiceRes.ok) return invoiceRes;
  const invoice = invoiceRes.data;
  const clientRes = await getClient(user.username, invoice.clientId);
  if (!clientRes.ok) return clientRes;
  const client = clientRes.data;
  if (!client.email) {
    return err(businessRule("Client has no email address. Add one before sending."));
  }
  if (!isEmailConfigured()) {
    return err(businessRule("SMTP not configured. Set SMTP_* env vars to send."));
  }

  const pdf = await renderInvoicePdf(invoice, client);

  await sendEmail({
    to: client.email,
    subject: `Invoice ${invoice.invoiceNumber}`,
    body: InvoiceSendEmail({
      clientName: client.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      senderName: user.name,
    }),
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });

  await markInvoiceStatus(user.username, id, "sent");
  bust();
  return { ok: true, data: true };
}
