"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

type Slice = { name: string; value: number };

const CHART_VARS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

export function CategoryBreakdown({ data, currency }: { data: Slice[]; currency: string }) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Spend by category</h3>
        <p className="text-xs text-muted-foreground">Month to date · {currency}</p>
      </div>
      <div className="h-60">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No category data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_VARS[i % CHART_VARS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--color-popover-foreground)",
                }}
                formatter={(v, name) => {
                  const n = typeof v === "number" ? v : Number(v ?? 0);
                  return [
                    Intl.NumberFormat("en", {
                      style: "currency",
                      currency,
                      maximumFractionDigits: 0,
                    }).format(n),
                    name,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {data.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: CHART_VARS[i % CHART_VARS.length] }}
                aria-hidden="true"
              />
              {d.name}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
