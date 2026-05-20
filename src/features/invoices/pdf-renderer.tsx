import "server-only";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatMoney, money, type Currency } from "@/lib/money";
import type { InvoiceDoc } from "@/services/invoices.service";
import type { ClientDoc } from "@/services/clients.service";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#18181b" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brand: { fontSize: 22, fontWeight: 700, color: "#7c3aed" },
  meta: { textAlign: "right" },
  metaLabel: { color: "#71717a", fontSize: 10, marginBottom: 2 },
  metaValue: { fontWeight: 600 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 9,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  table: { borderTop: "1px solid #e4e4e7", marginTop: 8 },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottom: "1px solid #f4f4f5",
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: "1px solid #e4e4e7",
    backgroundColor: "#fafafa",
  },
  th: { fontSize: 9, fontWeight: 700, color: "#71717a", textTransform: "uppercase" },
  td: { fontSize: 11 },
  colDesc: { flex: 4, paddingHorizontal: 8 },
  colQty: { flex: 1, paddingHorizontal: 8, textAlign: "right" },
  colPrice: { flex: 2, paddingHorizontal: 8, textAlign: "right" },
  colTotal: { flex: 2, paddingHorizontal: 8, textAlign: "right" },
  totals: { marginTop: 16, alignSelf: "flex-end", width: 240 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTop: "1px solid #18181b",
    marginTop: 4,
    fontWeight: 700,
  },
  notes: { marginTop: 32, padding: 12, backgroundColor: "#fafafa", borderRadius: 4 },
  footer: { marginTop: 32, color: "#a1a1aa", fontSize: 9, textAlign: "center" },
});

function fmt(amount: number, currency: string): string {
  return formatMoney(money(amount, currency as Currency));
}

interface Props {
  invoice: InvoiceDoc;
  client: ClientDoc;
}

export function InvoicePdfDocument({ invoice, client }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Expense Manager</Text>
            <Text style={{ fontSize: 10, color: "#71717a", marginTop: 4 }}>Invoice</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Issued</Text>
            <Text style={styles.metaValue}>{invoice.issueDate}</Text>
            <Text style={[styles.metaLabel, { marginTop: 8 }]}>Due</Text>
            <Text style={styles.metaValue}>{invoice.dueDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Bill to</Text>
          <Text style={{ fontWeight: 600 }}>{client.name}</Text>
          {client.email ? <Text>{client.email}</Text> : null}
          {client.address ? <Text>{client.address}</Text> : null}
          {client.taxId ? <Text>Tax ID: {client.taxId}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Unit</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>
          {invoice.lineItems.map((li, i) => {
            const line = Math.round(li.quantity * li.unitPrice);
            const tax = Math.round((line * li.taxPercent) / 100);
            return (
              <View key={i} style={styles.row}>
                <Text style={[styles.td, styles.colDesc]}>
                  {li.description}
                  {li.taxPercent ? ` (incl ${li.taxPercent}% tax)` : ""}
                </Text>
                <Text style={[styles.td, styles.colQty]}>{li.quantity}</Text>
                <Text style={[styles.td, styles.colPrice]}>{fmt(li.unitPrice, invoice.currency)}</Text>
                <Text style={[styles.td, styles.colTotal]}>{fmt(line + tax, invoice.currency)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{fmt(invoice.subtotal, invoice.currency)}</Text>
          </View>
          {invoice.taxTotal > 0 ? (
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{fmt(invoice.taxTotal, invoice.currency)}</Text>
            </View>
          ) : null}
          <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>{fmt(invoice.total, invoice.currency)}</Text>
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.notes}>
            <Text style={[styles.sectionLabel, { marginBottom: 4 }]}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Thank you for your business.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(
  invoice: InvoiceDoc,
  client: ClientDoc,
): Promise<Buffer> {
  return renderToBuffer(<InvoicePdfDocument invoice={invoice} client={client} />);
}
