"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseMoney, type Currency } from "@/lib/money";
import { contributeToGoalAction } from "../actions";
import type { SavingsGoalDoc } from "@/services/savings.service";

type Props = {
  goal: SavingsGoalDoc | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ContributeDialog({ goal, open, onOpenChange }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [direction, setDirection] = useState<"deposit" | "withdraw">("deposit");

  function submit() {
    if (!goal) return;
    const parsed = parseMoney(amountText, goal.currency as Currency);
    if (!parsed || parsed.amount <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    const amount = parsed.amount;
    startTransition(async () => {
      try {
        await contributeToGoalAction({
          goalId: goal.id,
          amount: direction === "deposit" ? amount : -amount,
          note: note || undefined,
        });
        toast.success(direction === "deposit" ? "Contribution added" : "Withdrawal recorded");
        onOpenChange(false);
        setAmountText("");
        setNote("");
        setDirection("deposit");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{goal?.goalName}</DialogTitle>
          <DialogDescription>Record a deposit or withdrawal.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direction === "deposit" ? "default" : "outline"}
              onClick={() => setDirection("deposit")}
            >
              Deposit
            </Button>
            <Button
              type="button"
              variant={direction === "withdraw" ? "default" : "outline"}
              onClick={() => setDirection("withdraw")}
            >
              Withdraw
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contribution-amount">Amount ({goal?.currency})</Label>
            <Input
              id="contribution-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contribution-note">Note (optional)</Label>
            <Textarea
              id="contribution-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
