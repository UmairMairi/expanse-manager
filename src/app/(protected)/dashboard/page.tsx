import type { Metadata } from "next";
import { requireUser } from "@/services/auth.service";
import { listExpenses } from "@/services/expenses.service";
import { rangeForPreset } from "@/utils/date";
import { format, parseISO, startOfDay } from "date-fns";
import { getDashboardOverview } from "@/features/dashboard/queries";
import { OverviewCards } from "@/features/dashboard/components/overview-cards";
import { AiInsightsPanel } from "@/features/dashboard/components/ai-insights-panel";
import { getCachedInsights } from "@/ai/insights";
import { isGeminiConfigured } from "@/ai/gemini";
import { QuickActions } from "@/features/dashboard/components/quick-actions.client";
import { ExpenseTrendChart } from "@/features/dashboard/components/expense-trend-chart.client";
import { CategoryBreakdown } from "@/features/dashboard/components/category-breakdown.client";
import { PageHeader } from "@/components/page-header";
import { DEFAULT_CURRENCY } from "@/utils/currency";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const overview = await getDashboardOverview(user.username);

  // Build last-30-days expense trend in the primary currency.
  const { start, end } = rangeForPreset("last-30-days");
  const recent = await listExpenses(user.username, { from: start, to: end });
  const primaryCurrency = DEFAULT_CURRENCY;
  const byDay = new Map<string, number>();
  for (const e of recent) {
    if (e.currency !== primaryCurrency) continue;
    const key = format(startOfDay(parseISO(e.date)), "yyyy-MM-dd");
    byDay.set(key, (byDay.get(key) ?? 0) + e.amount / 100);
  }
  const trend = Array.from(byDay.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Category breakdown for MTD
  const mtdRange = rangeForPreset("this-month");
  const mtdExpenses = await listExpenses(user.username, {
    from: mtdRange.start,
    to: mtdRange.end,
  });
  const byCategory = new Map<string, number>();
  for (const e of mtdExpenses) {
    if (e.currency !== primaryCurrency) continue;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount / 100);
  }
  const categories = Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const insights = isGeminiConfigured()
    ? await getCachedInsights(user.username)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here's a snapshot of your finances this month."
      />

      <OverviewCards data={overview} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExpenseTrendChart data={trend} currency={primaryCurrency} />
        </div>
        <CategoryBreakdown data={categories} currency={primaryCurrency} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AiInsightsPanel insights={insights} configured={isGeminiConfigured()} />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
