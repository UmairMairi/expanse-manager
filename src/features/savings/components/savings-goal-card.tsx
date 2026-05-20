import { Shield, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatMoney, money, type Currency } from "@/lib/money";
import type { SavingsGoalDoc } from "@/services/savings.service";

type Props = {
  goal: SavingsGoalDoc;
  onContribute: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function SavingsGoalCard({ goal, onContribute, onEdit, onDelete }: Props) {
  const pct = Math.min(
    100,
    Math.round((goal.savedAmount / Math.max(1, goal.targetAmount)) * 100),
  );
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const completed = goal.savedAmount >= goal.targetAmount;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold leading-tight">{goal.goalName}</h3>
            {goal.isEmergencyFund ? (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Emergency
              </Badge>
            ) : null}
            {completed ? <Badge className="bg-emerald-600 hover:bg-emerald-600">Complete</Badge> : null}
          </div>
          {goal.deadline ? (
            <p className="text-xs text-muted-foreground">
              Target by {new Date(goal.deadline).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-mono tabular-nums font-semibold">
            {formatMoney(money(goal.savedAmount, goal.currency as Currency))}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            of {formatMoney(money(goal.targetAmount, goal.currency as Currency))} ({pct}%)
          </span>
        </div>
        <Progress value={pct} />
      </div>

      {!completed ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="h-3 w-3" />
          <span className="tabular-nums">
            {formatMoney(money(remaining, goal.currency as Currency))} to go
            {goal.monthlyTarget
              ? ` · ${formatMoney(money(goal.monthlyTarget, goal.currency as Currency))}/mo target`
              : ""}
          </span>
        </div>
      ) : null}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onContribute} className="flex-1">
          Add savings
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive">
          Delete
        </Button>
      </div>
    </Card>
  );
}
