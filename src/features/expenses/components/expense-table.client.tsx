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
import { ExpenseForm } from "./expense-form.client";
import { deleteExpenseAction } from "../actions";
import type { ExpenseDoc } from "@/types/expense";

type Props = {
  initialExpenses: ExpenseDoc[];
};

export function ExpenseTable({ initialExpenses }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ExpenseDoc | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return initialExpenses;
    return initialExpenses.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.category.toLowerCase().includes(term) ||
        (e.notes ?? "").toLowerCase().includes(term) ||
        e.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }, [q, initialExpenses]);

  function handleDelete(e: ExpenseDoc) {
    startTransition(async () => {
      const res = await deleteExpenseAction(e.id);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(`Deleted "${e.title}"`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
          placeholder="Search title, category, notes, or tags…"
          className="max-w-sm"
        />
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {initialExpenses.length}
        </span>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  {initialExpenses.length === 0
                    ? "No expenses yet. Click \"Add expense\" to start."
                    : "No matches for your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.title}</div>
                    {e.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {formatShortDate(e.date)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground capitalize">
                    {e.paymentMethod.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatMoney(money(e.amount, e.currency as Currency))}
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
                        <DropdownMenuItem onSelect={() => setEditing(e)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleDelete(e)}
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
        <ExpenseForm
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          existing={editing}
        />
      )}
    </div>
  );
}
