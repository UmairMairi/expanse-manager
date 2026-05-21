"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/utils/date";
import { formatMoney, money, type Currency } from "@/lib/money";
import { IncomeForm } from "./income-form.client";
import { deleteIncomeAction } from "../actions";
import type { IncomeDoc } from "@/types/income";

type Props = {
  initialIncome: IncomeDoc[];
};

const SOURCE_TONE: Record<string, "default" | "secondary" | "outline"> = {
  salary: "default",
  freelance: "secondary",
  direct: "secondary",
  other: "outline",
};

export function IncomeTable({ initialIncome }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<IncomeDoc | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return initialIncome;
    return initialIncome.filter(
      (i) =>
        i.platform.toLowerCase().includes(term) ||
        i.source.toLowerCase().includes(term) ||
        (i.notes ?? "").toLowerCase().includes(term),
    );
  }, [q, initialIncome]);

  function handleDelete(i: IncomeDoc) {
    startTransition(async () => {
      const res = await deleteIncomeAction(i.id);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(`Deleted income from ${i.platform}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
          placeholder="Search by platform, source, notes…"
          className="max-w-sm"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {initialIncome.length}
        </span>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  {initialIncome.length === 0
                    ? "No income recorded yet. Click \"Record income\" to start."
                    : "No matches for your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <Badge variant={SOURCE_TONE[i.source] ?? "outline"} className="capitalize">
                      {i.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{i.platform}</div>
                    {i.notes && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{i.notes}</div>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatShortDate(i.date)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-success">
                    {formatMoney(money(i.amount, i.currency as Currency))}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Actions"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(i)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(i)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <IncomeForm
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          existing={editing}
        />
      )}
    </div>
  );
}
