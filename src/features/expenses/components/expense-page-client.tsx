"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "./expense-form.client";
import { ExpenseTable } from "./expense-table.client";
import { PageHeader } from "@/components/page-header";
import type { ExpenseDoc } from "@/types/expense";

type Props = {
  initialExpenses: ExpenseDoc[];
};

export function ExpensePageClient({ initialExpenses }: Props) {
  const [open, setOpen] = useState(false);

  // Listen for the keyboard shortcut / palette action.
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("palette:new-expense", handler);
    return () => window.removeEventListener("palette:new-expense", handler);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track every spend, by category and tag."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add expense
          </Button>
        }
      />
      <ExpenseTable initialExpenses={initialExpenses} />
      <ExpenseForm open={open} onOpenChange={setOpen} />
    </div>
  );
}
