import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatMoney, money, type Currency } from "@/lib/money";

interface Props {
  recipientName: string;
  monthLabel: string;
  incomeByCurrency: Array<[string, number]>;
  expensesByCurrency: Array<[string, number]>;
  netByCurrency: Array<[string, number]>;
  expenseCount: number;
  incomeCount: number;
}

export function MonthlyReportEmail({
  recipientName,
  monthLabel,
  incomeByCurrency,
  expensesByCurrency,
  netByCurrency,
  expenseCount,
  incomeCount,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{`Your ${monthLabel} financial report`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Monthly report — {monthLabel}</Heading>
          <Text style={text}>Hi {recipientName},</Text>
          <Text style={text}>
            Here&apos;s your snapshot for {monthLabel}. {incomeCount} income entries,{" "}
            {expenseCount} expenses recorded.
          </Text>
          {netByCurrency.map(([currency, net]) => {
            const inc = incomeByCurrency.find((p) => p[0] === currency)?.[1] ?? 0;
            const exp = expensesByCurrency.find((p) => p[0] === currency)?.[1] ?? 0;
            return (
              <Section key={currency} style={card}>
                <Text style={cardCurrency}>{currency}</Text>
                <Text style={cardRow}>
                  <span style={cardLabel}>Income</span>
                  <span style={cardValuePos}>{formatMoney(money(inc, currency as Currency))}</span>
                </Text>
                <Text style={cardRow}>
                  <span style={cardLabel}>Expenses</span>
                  <span style={cardValue}>{formatMoney(money(exp, currency as Currency))}</span>
                </Text>
                <Text style={cardRow}>
                  <span style={cardLabel}>Net</span>
                  <span style={net >= 0 ? cardValuePos : cardValueNeg}>
                    {formatMoney(money(net, currency as Currency), { sign: true })}
                  </span>
                </Text>
              </Section>
            );
          })}
          <Text style={footer}>
            Open the app for detailed reports and exports.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = { backgroundColor: "#f4f4f5", fontFamily: "system-ui, sans-serif", margin: 0, padding: "32px 0" };
const container: React.CSSProperties = { backgroundColor: "#ffffff", borderRadius: 8, maxWidth: 560, margin: "0 auto", padding: 32 };
const h1: React.CSSProperties = { fontSize: 22, fontWeight: 600, color: "#18181b", marginTop: 0 };
const text: React.CSSProperties = { fontSize: 15, lineHeight: "22px", color: "#3f3f46", margin: "12px 0" };
const card: React.CSSProperties = { backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: 6, padding: "12px 18px", margin: "12px 0" };
const cardCurrency: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#71717a", letterSpacing: 1, textTransform: "uppercase", margin: 0 };
const cardRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", margin: "6px 0", fontSize: 14, color: "#52525b" };
const cardLabel: React.CSSProperties = { color: "#71717a" };
const cardValue: React.CSSProperties = { color: "#18181b", fontWeight: 600, fontVariantNumeric: "tabular-nums" };
const cardValuePos: React.CSSProperties = { color: "#059669", fontWeight: 600, fontVariantNumeric: "tabular-nums" };
const cardValueNeg: React.CSSProperties = { color: "#dc2626", fontWeight: 600, fontVariantNumeric: "tabular-nums" };
const footer: React.CSSProperties = { fontSize: 12, color: "#a1a1aa", marginTop: 24 };
