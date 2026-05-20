"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, money, type Currency } from "@/lib/money";
import type { ReportBundle } from "@/services/reports.service";
import type { RangePreset } from "../range";

type Props = {
  initialBundle: ReportBundle;
  initialPreset: RangePreset;
};

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
  { value: "ytd", label: "Year to date" },
  { value: "custom", label: "Custom range" },
];

function downloadUrl(
  kind: "excel" | "csv" | "pdf",
  preset: RangePreset,
  from: string,
  to: string,
): string {
  const params = new URLSearchParams({ preset });
  if (preset === "custom") {
    params.set("from", from);
    params.set("to", to);
  }
  return `/api/reports/${kind}?${params.toString()}`;
}

export function ReportsView({ initialBundle, initialPreset }: Props) {
  const [preset, setPreset] = useState<RangePreset>(initialPreset);
  const [fromDate, setFromDate] = useState(
    initialBundle.range.from.toISOString().slice(0, 10),
  );
  const [toDate, setToDate] = useState(
    initialBundle.range.to.toISOString().slice(0, 10),
  );

  const bundle = initialBundle;
  const currencies = Array.from(bundle.summary.netByCurrency.keys());

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label>Range</Label>
            <Select
              value={preset}
              onValueChange={(v) => setPreset((v ?? "month") as RangePreset)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {preset === "custom" ? (
            <>
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </>
          ) : null}
          <div className="flex flex-wrap gap-2 sm:self-end">
            <Button
              variant="default"
              className="gap-2"
              onClick={() => window.open(downloadUrl("excel", preset, fromDate, toDate), "_blank")}
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(downloadUrl("csv", preset, fromDate, toDate), "_blank")}
            >
              <FileType2 className="h-4 w-4" /> CSV
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(downloadUrl("pdf", preset, fromDate, toDate), "_blank")}
            >
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Showing preview for <strong>{bundle.range.label}</strong>. Use a different range above and re-export.
        </p>
      </Card>

      {currencies.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No financial activity in this range yet.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currencies.map((c) => {
            const inc = bundle.summary.totalIncomeByCurrency.get(c) ?? 0;
            const exp = bundle.summary.totalExpensesByCurrency.get(c) ?? 0;
            const net = bundle.summary.netByCurrency.get(c) ?? 0;
            return (
              <Card key={c} className="p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{c}</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Income</p>
                    <p className="mt-1 font-mono text-sm tabular-nums text-emerald-600">
                      {formatMoney(money(inc, c as Currency), { compact: true })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expenses</p>
                    <p className="mt-1 font-mono text-sm tabular-nums">
                      {formatMoney(money(exp, c as Currency), { compact: true })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net</p>
                    <p
                      className={`mt-1 font-mono text-sm tabular-nums ${net >= 0 ? "text-emerald-600" : "text-destructive"}`}
                    >
                      {formatMoney(money(net, c as Currency), { compact: true, sign: true })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Entry counts</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="font-mono text-lg tabular-nums">{bundle.summary.expenseCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="font-mono text-lg tabular-nums">{bundle.summary.incomeCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Savings goals</p>
            <p className="font-mono text-lg tabular-nums">{bundle.savings.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budgets</p>
            <p className="font-mono text-lg tabular-nums">{bundle.budgets.length}</p>
          </div>
        </div>
      </Card>

      <Card className="flex items-center gap-3 p-4">
        <Download className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Excel includes all rows across 5 sheets (Summary, Expenses, Income, Savings, Budgets).
          CSV concatenates the four modules. PDF gives a quick overview (first 40 rows per
          section).
        </p>
      </Card>
    </div>
  );
}
