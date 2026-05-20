import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth.service";
import { getInvoice } from "@/services/invoices.service";
import { getClient } from "@/services/clients.service";
import { renderInvoicePdf } from "@/features/invoices/pdf-renderer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const invoiceRes = await getInvoice(user.username, id);
  if (!invoiceRes.ok) return new NextResponse("Not found", { status: 404 });
  const clientRes = await getClient(user.username, invoiceRes.data.clientId);
  if (!clientRes.ok) return new NextResponse("Client missing", { status: 404 });
  const pdf = await renderInvoicePdf(invoiceRes.data, clientRes.data);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoiceRes.data.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
