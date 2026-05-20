"use client";

import { Plus, Receipt, TrendingUp, FileText, PiggyBank, Wallet, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  { id: "new-expense", label: "Add Expense", icon: Receipt },
  { id: "new-income", label: "Add Income", icon: TrendingUp },
  { id: "new-client", label: "New Client", icon: FileText },
  { id: "new-saving", label: "Set Saving Goal", icon: PiggyBank, disabled: true },
  { id: "new-budget", label: "Set Budget", icon: Wallet, disabled: true },
  { id: "download-report", label: "Download Report", icon: Download, disabled: true },
] as const;

export function QuickActions() {
  function fire(id: string) {
    window.dispatchEvent(new CustomEvent(`palette:${id}`));
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Plus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Quick actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Button
              key={a.id}
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              disabled={"disabled" in a && a.disabled}
              onClick={() => fire(a.id)}
              title={"disabled" in a && a.disabled ? "Coming in a later phase" : undefined}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{a.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
