import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatMoney, money } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CurrencyTotal, DashboardOverview } from "@/features/dashboard/queries";

type CardSpec = {
  label: string;
  icon: LucideIcon;
  totals: CurrencyTotal[];
  tone: "neutral" | "positive" | "negative";
};

function MoneyStack({ totals }: { totals: CurrencyTotal[] }) {
  if (totals.length === 0) {
    return <div className="font-mono text-2xl font-semibold">—</div>;
  }
  const [primary, ...rest] = totals;
  if (!primary) return null;
  return (
    <div>
      <div
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          primary.amount < 0 && "text-destructive",
          primary.amount > 0 && totals.length > 0 && "",
        )}
      >
        {formatMoney(money(primary.amount, primary.currency))}
      </div>
      {rest.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          {rest.map((t) => (
            <span key={t.currency} className="font-mono text-xs text-muted-foreground tabular-nums">
              {formatMoney(money(t.amount, t.currency))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function OverviewCards({ data }: { data: DashboardOverview }) {
  const cards: CardSpec[] = [
    {
      label: "Total Balance",
      icon: Wallet,
      totals: data.totalBalance,
      tone: "neutral",
    },
    {
      label: "Total Income (MTD)",
      icon: TrendingUp,
      totals: data.totalIncome,
      tone: "positive",
    },
    {
      label: "Total Expenses (MTD)",
      icon: TrendingDown,
      totals: data.totalExpenses,
      tone: "negative",
    },
    {
      label: "Net Savings",
      icon: PiggyBank,
      totals: data.netSavings,
      tone: "positive",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.label}
            className="p-5"
          >
            <div className="flex items-start justify-between">
              <div className="text-sm font-medium text-muted-foreground">{c.label}</div>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  c.tone === "positive" && "bg-success/10 text-success",
                  c.tone === "negative" && "bg-destructive/10 text-destructive",
                  c.tone === "neutral" && "bg-primary/10 text-primary",
                )}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <MoneyStack totals={c.totals} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
