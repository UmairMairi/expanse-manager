"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";

type Point = { date: string; amount: number };

type Props = {
  data: Point[];
  currency: string;
};

export function ExpenseTrendChart({ data, currency }: Props) {
  const series = useMemo(
    () => data.map((p) => ({ ...p, label: format(parseISO(p.date), "MMM d") })),
    [data],
  );

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Expense trend</h3>
          <p className="text-xs text-muted-foreground">Last 30 days · {currency}</p>
        </div>
      </div>
      <div className="h-60">
        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No expenses yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-destructive)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-destructive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                minTickGap={32}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                tickFormatter={(v) => Intl.NumberFormat("en", { notation: "compact" }).format(v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--color-popover-foreground)",
                }}
                labelStyle={{ color: "var(--color-muted-foreground)" }}
                formatter={(v) => {
                  const n = typeof v === "number" ? v : Number(v ?? 0);
                  return [
                    Intl.NumberFormat("en", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(n),
                    "Spent",
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--color-destructive)"
                strokeWidth={2}
                fill="url(#expenseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
