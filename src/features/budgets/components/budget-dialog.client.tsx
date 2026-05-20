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
import { parseMoney, type Currency } from "@/lib/money";
import { createBudgetAction, updateBudgetAction } from "../actions";
import { BudgetSchema, type BudgetInput } from "../schemas";
import type { BudgetDoc } from "@/services/budgets.service";

const CURRENCIES: Currency[] = ["PKR", "USD", "EUR", "GBP", "AED"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: BudgetDoc;
  knownCategories: string[];
};

export function BudgetDialog({ open, onOpenChange, budget, knownCategories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [limitText, setLimitText] = useState("");

  const form = useForm<BudgetInput>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: budget
      ? {
          category: budget.category,
          monthlyLimit: budget.monthlyLimit,
          warningThreshold: budget.warningThreshold,
          currency: budget.currency,
          notes: budget.notes ?? "",
        }
      : {
          category: knownCategories[0] ?? "Food",
          monthlyLimit: 0,
          warningThreshold: 80,
          currency: "PKR",
          notes: "",
        },
  });

  function handleSubmit(values: BudgetInput) {
    startTransition(async () => {
      const limitMoney = limitText ? parseMoney(limitText, values.currency as Currency) : null;
      const payload: BudgetInput = {
        ...values,
        monthlyLimit: limitMoney?.amount ?? values.monthlyLimit,
      };
      try {
        if (budget) {
          await updateBudgetAction(budget.id, payload);
          toast.success("Budget updated");
        } else {
          await createBudgetAction(payload);
          toast.success("Budget created");
        }
        onOpenChange(false);
        form.reset();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit budget" : "New budget"}</DialogTitle>
          <DialogDescription>
            Set a monthly spending limit per category. We&apos;ll warn you when you approach it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input list="known-categories" {...field} />
                  </FormControl>
                  <datalist id="known-categories">
                    {knownCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
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
                        {CURRENCIES.map((c) => (
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
              <FormItem>
                <FormLabel>Monthly limit</FormLabel>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={limitText || (budget ? (budget.monthlyLimit / 100).toFixed(2) : "")}
                    onChange={(e) => setLimitText(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="warningThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warning threshold (% of limit)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
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
                {isPending ? "Saving…" : budget ? "Save" : "Create budget"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
