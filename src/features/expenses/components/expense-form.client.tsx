"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_CATEGORIES,
  PAYMENT_METHODS,
  ExpenseInputSchema,
  type ExpenseInput,
  type ExpenseDoc,
} from "@/types/expense";
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/utils/currency";
import { createExpenseAction, updateExpenseAction } from "../actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: ExpenseDoc;
  customCategories?: string[];
  customPaymentMethods?: string[];
};

export function ExpenseForm({
  open,
  onOpenChange,
  existing,
  customCategories = [],
  customPaymentMethods = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tagInput, setTagInput] = useState("");
  // Merge built-in + user-added, dedupe, built-in first.
  const categoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));
  const paymentOptions = Array.from(new Set([...PAYMENT_METHODS, ...customPaymentMethods]));

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(ExpenseInputSchema),
    defaultValues: existing
      ? {
          title: existing.title,
          amountMajor: existing.amountMajor,
          currency: existing.currency,
          category: existing.category,
          date: existing.date.slice(0, 10),
          paymentMethod: existing.paymentMethod,
          notes: existing.notes ?? "",
          tags: existing.tags ?? [],
          receiptUrl: existing.receiptUrl,
          recurrence: existing.recurrence ?? null,
        }
      : {
          title: "",
          amountMajor: 0,
          currency: DEFAULT_CURRENCY,
          category: "Miscellaneous",
          date: format(new Date(), "yyyy-MM-dd"),
          paymentMethod: "card",
          notes: "",
          tags: [],
          recurrence: null,
        },
  });

  // Register tags so it round-trips through form state cleanly. Without this
  // explicit register, react-hook-form occasionally drops setValue-only fields
  // on submit when zodResolver re-parses.
  useEffect(() => {
    form.register("tags");
  }, [form]);

  function onSubmit(values: ExpenseInput) {
    // Pull tags directly from form state (more reliable than the resolved
    // values for setValue-managed fields) and append any pending input the
    // user typed but never pressed Enter for.
    const existingTags = form.getValues("tags") ?? [];
    const pending = tagInput.trim();
    const finalTags =
      pending && !existingTags.includes(pending)
        ? [...existingTags, pending]
        : existingTags;
    const payload: ExpenseInput = { ...values, tags: finalTags };

    startTransition(async () => {
      const res = existing
        ? await updateExpenseAction(existing.id, payload)
        : await createExpenseAction(payload);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(existing ? "Expense updated" : "Expense added");
      setTagInput("");
      onOpenChange(false);
      form.reset();
      router.refresh();
    });
  }

  function addTag() {
    const v = tagInput.trim();
    if (!v) return;
    const current = form.getValues("tags") ?? [];
    if (!current.includes(v)) {
      form.setValue("tags", [...current, v], { shouldDirty: true });
    }
    setTagInput("");
  }

  function removeTag(t: string) {
    form.setValue("tags", (form.getValues("tags") ?? []).filter((x) => x !== t), {
      shouldDirty: true,
    });
  }

  const tags = form.watch("tags") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit expense" : "New expense"}</DialogTitle>
          <DialogDescription>
            Record an expense with category, date, and payment method.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Groceries at Carrefour" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="amountMajor"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        className="font-mono"
                        value={Number.isFinite(field.value) ? String(field.value) : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? Number.NaN : Number(v));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentOptions.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => removeTag(t)}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-muted/70"
                  >
                    {t}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag…"
                  className="w-32"
                />
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Optional context…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {existing ? "Save changes" : "Add expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
