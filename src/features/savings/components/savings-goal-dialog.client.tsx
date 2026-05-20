"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { parseMoney, type Currency } from "@/lib/money";
import { createSavingsGoalAction, updateSavingsGoalAction } from "../actions";
import { SAVINGS_CURRENCIES, SavingsGoalSchema, type SavingsGoalInput } from "../schemas";
import type { SavingsGoalDoc } from "@/services/savings.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: SavingsGoalDoc;
};

export function SavingsGoalDialog({ open, onOpenChange, goal }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetText, setTargetText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [monthlyText, setMonthlyText] = useState("");

  const form = useForm<SavingsGoalInput>({
    resolver: zodResolver(SavingsGoalSchema),
    defaultValues: goal
      ? {
          goalName: goal.goalName,
          targetAmount: goal.targetAmount,
          savedAmount: goal.savedAmount,
          currency: goal.currency as (typeof SAVINGS_CURRENCIES)[number],
          deadline: goal.deadline ?? "",
          monthlyTarget: goal.monthlyTarget ?? 0,
          isEmergencyFund: goal.isEmergencyFund,
          notes: goal.notes ?? "",
        }
      : {
          goalName: "",
          targetAmount: 0,
          savedAmount: 0,
          currency: "PKR" as const,
          deadline: "",
          monthlyTarget: 0,
          isEmergencyFund: false,
          notes: "",
        },
  });

  function handleSubmit(values: SavingsGoalInput) {
    startTransition(async () => {
      const targetMoney = targetText ? parseMoney(targetText, values.currency as Currency) : null;
      const savedMoney = savedText ? parseMoney(savedText, values.currency as Currency) : null;
      const monthlyMoney = monthlyText ? parseMoney(monthlyText, values.currency as Currency) : null;
      const payload = {
        ...values,
        targetAmount: targetMoney?.amount ?? values.targetAmount,
        savedAmount: savedMoney?.amount ?? values.savedAmount,
        monthlyTarget: monthlyMoney?.amount ?? values.monthlyTarget,
      };
      try {
        if (goal) {
          await updateSavingsGoalAction(goal.id, payload);
          toast.success("Goal updated");
        } else {
          await createSavingsGoalAction(payload);
          toast.success("Goal created");
        }
        onOpenChange(false);
        form.reset();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save goal");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit savings goal" : "New savings goal"}</DialogTitle>
          <DialogDescription>
            Track progress toward a savings target.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="goalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal name</FormLabel>
                  <FormControl>
                    <Input placeholder="Emergency fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SAVINGS_CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormItem>
                <FormLabel>Target amount</FormLabel>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={targetText || (goal ? (goal.targetAmount / 100).toFixed(2) : "")}
                    onChange={(e) => setTargetText(e.target.value)}
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Saved so far</FormLabel>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={savedText || (goal ? (goal.savedAmount / 100).toFixed(2) : "")}
                    onChange={(e) => setSavedText(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            </div>

            <FormItem>
              <FormLabel>Monthly target (optional)</FormLabel>
              <FormControl>
                <Input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={monthlyText || (goal?.monthlyTarget ? (goal.monthlyTarget / 100).toFixed(2) : "")}
                  onChange={(e) => setMonthlyText(e.target.value)}
                />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="isEmergencyFund"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 text-sm font-normal">
                    Mark as emergency fund
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : goal ? "Save" : "Create goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
