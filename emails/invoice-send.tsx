import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { formatMoney, money, type Currency } from "@/lib/money";

interface Props {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  senderName: string;
}

export function InvoiceSendEmail({
  clientName,
  invoiceNumber,
  amount,
  currency,
  dueDate,
  senderName,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Invoice {invoiceNumber} attached</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Invoice {invoiceNumber}</Heading>
          <Text style={text}>Hi {clientName},</Text>
          <Text style={text}>
            Please find invoice <strong>{invoiceNumber}</strong> attached for{" "}
            <strong>{formatMoney(money(amount, currency as Currency))}</strong>, due{" "}
            <strong>{dueDate}</strong>.
          </Text>
          <Text style={text}>Thanks,<br />{senderName}</Text>
          <Text style={footer}>Sent via Expense Manager.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = { backgroundColor: "#f4f4f5", fontFamily: "system-ui, sans-serif", margin: 0, padding: "32px 0" };
const container: React.CSSProperties = { backgroundColor: "#ffffff", borderRadius: 8, maxWidth: 560, margin: "0 auto", padding: 32 };
const h1: React.CSSProperties = { fontSize: 22, fontWeight: 600, color: "#18181b", marginTop: 0 };
const text: React.CSSProperties = { fontSize: 15, lineHeight: "22px", color: "#3f3f46", margin: "12px 0" };
const footer: React.CSSProperties = { fontSize: 12, color: "#a1a1aa", marginTop: 32 };
