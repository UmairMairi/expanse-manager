import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatMoney, money, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BudgetStatus } from "@/services/budgets.service";

type Props = {
  status: BudgetStatus;
  onEdit: () => void;
  onDelete: () => void;
};

export function BudgetRow({ status, onEdit, onDelete }: Props) {
  const { budget, spent, percentUsed, state } = status;
  const remaining = Math.max(0, budget.monthlyLimit - spent);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold leading-tight">{budget.category}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            {formatMoney(money(spent, budget.currency as Currency))} of{" "}
            {formatMoney(money(budget.monthlyLimit, budget.currency as Currency))}
          </p>
        </div>
        <Badge
          variant={state === "ok" ? "secondary" : state === "warning" ? "default" : "destructive"}
          className={cn(
            "tabular-nums",
            state === "warning" && "bg-amber-500 text-white hover:bg-amber-500",
          )}
        >
          {Math.round(percentUsed)}%
        </Badge>
      </div>

      <Progress
        value={Math.min(100, percentUsed)}
        indicatorClassName={cn(
          state === "warning" && "bg-amber-500",
          state === "exceeded" && "bg-destructive",
        )}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tabular-nums">
          {state === "exceeded"
            ? `Over by ${formatMoney(money(spent - budget.monthlyLimit, budget.currency as Currency))}`
            : `${formatMoney(money(remaining, budget.currency as Currency))} left`}
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive">
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
