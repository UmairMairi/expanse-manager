"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [targetText, setTargetText] = useState(
    goal ? (goal.targetAmount / 100).toFixed(2) : "",
  );
  const [savedText, setSavedText] = useState(
    goal ? (goal.savedAmount / 100).toFixed(2) : "",
  );
  const [monthlyText, setMonthlyText] = useState(
    goal?.monthlyTarget ? (goal.monthlyTarget / 100).toFixed(2) : "",
  );

  useEffect(() => {
    if (open) {
      setTargetText(goal ? (goal.targetAmount / 100).toFixed(2) : "");
      setSavedText(goal ? (goal.savedAmount / 100).toFixed(2) : "");
      setMonthlyText(goal?.monthlyTarget ? (goal.monthlyTarget / 100).toFixed(2) : "");
    }
  }, [open, goal]);

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
          linkedSource: goal.linkedSource ?? "any",
          linkedPlatform: goal.linkedPlatform ?? "",
          autoContributePercent: goal.autoContributePercent ?? 0,
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
          linkedSource: "any" as const,
          linkedPlatform: "",
          autoContributePercent: 0,
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
              <FormField
                control={form.control}
                name="targetAmount"
                render={() => (
                  <FormItem>
                    <FormLabel>Target amount</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="0.00"
                        value={targetText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTargetText(v);
                          const parsed = parseMoney(
                            v,
                            form.getValues("currency") as Currency,
                          );
                          form.setValue("targetAmount", parsed?.amount ?? 0, {
                            shouldValidate: true,
                          });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="savedAmount"
                render={() => (
                  <FormItem>
                    <FormLabel>Saved so far</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="0.00"
                        value={savedText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSavedText(v);
                          const parsed = parseMoney(
                            v,
                            form.getValues("currency") as Currency,
                          );
                          form.setValue("savedAmount", parsed?.amount ?? 0, {
                            shouldValidate: true,
                          });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="monthlyTarget"
              render={() => (
                <FormItem>
                  <FormLabel>Monthly target (optional)</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={monthlyText}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMonthlyText(v);
                        const parsed = parseMoney(
                          v,
                          form.getValues("currency") as Currency,
                        );
                        form.setValue("monthlyTarget", parsed?.amount ?? 0, {
                          shouldValidate: true,
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="space-y-3 rounded-md border border-dashed border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Tie to an income source (optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="linkedSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="any">Any source</SelectItem>
                          <SelectItem value="salary">Salary</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="direct">Direct payment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedPlatform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Platform (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Upwork, Xint…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="autoContributePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Auto-save % of matching income (0 = manual only)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-[11px] text-muted-foreground leading-snug">
                When you record income that matches the source/platform and currency,
                this percentage will be added to the goal automatically.
              </p>
            </div>

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
