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
import type { ReportBundle } from "@/services/reports.service";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#18181b" },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 700, color: "#7c3aed" },
  subtitle: { fontSize: 11, color: "#71717a", marginTop: 4 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 8,
    color: "#18181b",
  },
  row: { flexDirection: "row", paddingVertical: 3, borderBottom: "0.5px solid #f4f4f5" },
  th: {
    fontSize: 8,
    fontWeight: 700,
    color: "#71717a",
    textTransform: "uppercase",
    paddingVertical: 4,
    borderBottom: "0.5px solid #e4e4e7",
  },
  card: {
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 4,
    marginBottom: 12,
  },
  cardLabel: { fontSize: 9, color: "#71717a", textTransform: "uppercase" },
  cardValue: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  cardValuePositive: { color: "#059669" },
  cardValueNegative: { color: "#dc2626" },
});

function fmt(amount: number, currency: string): string {
  return formatMoney(money(amount, currency as Currency));
}

interface Props {
  bundle: ReportBundle;
  userName: string;
}

export function ReportPdfDocument({ bundle, userName }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Financial report</Text>
          <Text style={styles.subtitle}>
            {bundle.range.label} · {userName} · Generated{" "}
            {new Date().toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        {Array.from(bundle.summary.netByCurrency).map(([currency, net]) => {
          const income = bundle.summary.totalIncomeByCurrency.get(currency) ?? 0;
          const expenses = bundle.summary.totalExpensesByCurrency.get(currency) ?? 0;
          return (
            <View key={currency} style={styles.card}>
              <Text style={styles.cardLabel}>{currency}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                <View>
                  <Text style={styles.cardLabel}>Income</Text>
                  <Text style={styles.cardValue}>{fmt(income, currency)}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Expenses</Text>
                  <Text style={styles.cardValue}>{fmt(expenses, currency)}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>Net</Text>
                  <Text
                    style={[
                      styles.cardValue,
                      net >= 0 ? styles.cardValuePositive : styles.cardValueNegative,
                    ]}
                  >
                    {fmt(net, currency)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Expenses ({bundle.expenses.length})</Text>
        <View style={[styles.row, { borderBottom: "none" }]}>
          <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>
          <Text style={[styles.th, { flex: 3 }]}>Title</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Category</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
        </View>
        {bundle.expenses.slice(0, 40).map((e) => (
          <View key={e.id} style={styles.row}>
            <Text style={{ flex: 1.2 }}>{e.date}</Text>
            <Text style={{ flex: 3 }}>{e.title}</Text>
            <Text style={{ flex: 1.5 }}>{e.category}</Text>
            <Text style={{ flex: 1.5, textAlign: "right" }}>
              {fmt(e.amount, e.currency)}
            </Text>
          </View>
        ))}
        {bundle.expenses.length > 40 ? (
          <Text style={{ fontSize: 9, color: "#a1a1aa", marginTop: 6 }}>
            … {bundle.expenses.length - 40} more rows in the Excel/CSV export
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>Income ({bundle.income.length})</Text>
        <View style={[styles.row, { borderBottom: "none" }]}>
          <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Source</Text>
          <Text style={[styles.th, { flex: 2.5 }]}>Platform</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: "right" }]}>Amount</Text>
        </View>
        {bundle.income.slice(0, 40).map((i) => (
          <View key={i.id} style={styles.row}>
            <Text style={{ flex: 1.2 }}>{i.date}</Text>
            <Text style={{ flex: 1.5 }}>{i.source}</Text>
            <Text style={{ flex: 2.5 }}>{i.platform}</Text>
            <Text style={{ flex: 1.5, textAlign: "right" }}>
              {fmt(i.amount, i.currency)}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function renderReportPdf(
  bundle: ReportBundle,
  userName: string,
): Promise<Buffer> {
  return renderToBuffer(<ReportPdfDocument bundle={bundle} userName={userName} />);
}
