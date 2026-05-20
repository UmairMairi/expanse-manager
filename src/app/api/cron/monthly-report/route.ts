import { NextResponse, type NextRequest } from "next/server";
import { withCronSecret } from "@/lib/with-cron-secret";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { gatherReport } from "@/services/reports.service";
import { customRange } from "@/features/reports/range";
import { renderReportPdf } from "@/features/reports/pdf-builder";
import { sendEmail, isEmailConfigured } from "@/services/email.service";
import { MonthlyReportEmail } from "../../../../../emails/monthly-report";
import { logger } from "@/lib/logger";

interface UserDoc {
  username: string;
  name?: string;
  email?: string;
}

export const GET = withCronSecret(async (_req: NextRequest) => {
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "SMTP not configured" }, { status: 500 });
  }

  // Compute range for the previous calendar month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const monthLabel = monthStart.toLocaleString("en-US", { month: "long", year: "numeric" });
  const range = customRange(
    monthStart.toISOString().slice(0, 10),
    monthEnd.toISOString().slice(0, 10),
  );
  range.label = monthLabel;

  // Fan out across all users (we have one admin in practice — keeps the
  // code multi-user-ready without leaking PII across accounts).
  const usersSnap = await getDb().collection(COLLECTIONS.USERS).get();
  const results: Array<{ user: string; status: "sent" | "skipped" | "failed"; reason?: string }> = [];

  for (const doc of usersSnap.docs) {
    const user = doc.data() as UserDoc;
    if (!user.email) {
      results.push({ user: user.username, status: "skipped", reason: "no email" });
      continue;
    }
    try {
      const bundle = await gatherReport(user.username, range);
      const pdf = await renderReportPdf(bundle, user.name ?? user.username);
      await sendEmail({
        to: user.email,
        subject: `Monthly report — ${monthLabel}`,
        body: MonthlyReportEmail({
          recipientName: user.name ?? user.username,
          monthLabel,
          incomeByCurrency: Array.from(bundle.summary.totalIncomeByCurrency),
          expensesByCurrency: Array.from(bundle.summary.totalExpensesByCurrency),
          netByCurrency: Array.from(bundle.summary.netByCurrency),
          expenseCount: bundle.summary.expenseCount,
          incomeCount: bundle.summary.incomeCount,
        }),
        attachments: [
          {
            filename: `monthly-report-${monthStart.toISOString().slice(0, 7)}.pdf`,
            content: pdf,
            contentType: "application/pdf",
          },
        ],
      });
      results.push({ user: user.username, status: "sent" });
    } catch (err) {
      logger.error({ err, user: user.username }, "monthly_report_failed");
      results.push({
        user: user.username,
        status: "failed",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ month: monthLabel, results });
});
