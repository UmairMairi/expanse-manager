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

interface BudgetWarningEmailProps {
  recipientName: string;
  category: string;
  monthlyLimit: number;
  currentSpend: number;
  currency: string;
  percentUsed: number;
  month: string; // "May 2026"
}

export function BudgetWarningEmail({
  recipientName,
  category,
  monthlyLimit,
  currentSpend,
  currency,
  percentUsed,
  month,
}: BudgetWarningEmailProps) {
  const over = currentSpend > monthlyLimit;
  const subject = over ? "Budget exceeded" : "Budget threshold crossed";

  return (
    <Html>
      <Head />
      <Preview>{`${subject} for ${category} (${Math.round(percentUsed)}%)`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>{subject}</Heading>
          <Text style={text}>Hi {recipientName},</Text>
          <Text style={text}>
            Your <strong>{category}</strong> budget for {month} is at{" "}
            <strong>{Math.round(percentUsed)}%</strong> of the monthly limit.
          </Text>
          <Section style={card}>
            <Text style={cardRow}>
              <span style={cardLabel}>Spent so far</span>
              <span style={over ? cardValueAlert : cardValue}>
                {formatMoney(money(currentSpend, currency as Currency))}
              </span>
            </Text>
            <Text style={cardRow}>
              <span style={cardLabel}>Monthly limit</span>
              <span style={cardValue}>{formatMoney(money(monthlyLimit, currency as Currency))}</span>
            </Text>
          </Section>
          <Text style={footer}>
            This is an automated alert from Expense Manager.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = { backgroundColor: "#f4f4f5", fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: "32px 0" };
const container: React.CSSProperties = { backgroundColor: "#ffffff", borderRadius: 8, maxWidth: 560, margin: "0 auto", padding: 32 };
const h1: React.CSSProperties = { fontSize: 22, fontWeight: 600, color: "#18181b", marginTop: 0 };
const text: React.CSSProperties = { fontSize: 15, lineHeight: "22px", color: "#3f3f46", margin: "12px 0" };
const card: React.CSSProperties = { backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: 6, padding: "16px 20px", margin: "20px 0" };
const cardRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", margin: "8px 0", fontSize: 14, color: "#52525b" };
const cardLabel: React.CSSProperties = { color: "#71717a" };
const cardValue: React.CSSProperties = { color: "#18181b", fontWeight: 600, fontVariantNumeric: "tabular-nums" };
const cardValueAlert: React.CSSProperties = { color: "#dc2626", fontWeight: 600, fontVariantNumeric: "tabular-nums" };
const footer: React.CSSProperties = { fontSize: 12, color: "#a1a1aa", marginTop: 32 };
