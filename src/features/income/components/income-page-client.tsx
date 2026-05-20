"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncomeForm } from "./income-form.client";
import { IncomeTable } from "./income-table.client";
import { PageHeader } from "@/components/page-header";
import type { IncomeDoc } from "@/types/income";

type Props = {
  initialIncome: IncomeDoc[];
};

export function IncomePageClient({ initialIncome }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("palette:new-income", handler);
    return () => window.removeEventListener("palette:new-income", handler);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income"
        description="Track salaries, freelance earnings, and direct payments across currencies."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Record income
          </Button>
        }
      />
      <IncomeTable initialIncome={initialIncome} />
      <IncomeForm open={open} onOpenChange={setOpen} />
    </div>
  );
}
