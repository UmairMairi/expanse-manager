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
import { createMilestoneAction, updateMilestoneAction } from "../actions";
import {
  MilestoneSchema,
  MILESTONE_STATUSES,
  PROJECT_CURRENCIES,
  type MilestoneInput,
} from "../schemas";
import type { MilestoneDoc } from "@/services/clients.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultCurrency: string;
  defaultSortOrder: number;
  milestone?: MilestoneDoc;
};

export function MilestoneDialog({
  open,
  onOpenChange,
  projectId,
  defaultCurrency,
  defaultSortOrder,
  milestone,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amountText, setAmountText] = useState("");

  const form = useForm<MilestoneInput>({
    resolver: zodResolver(MilestoneSchema),
    defaultValues: milestone
      ? {
          projectId: milestone.projectId,
          title: milestone.title,
          description: milestone.description ?? "",
          amount: milestone.amount,
          currency: milestone.currency as MilestoneInput["currency"],
          dueDate: milestone.dueDate ?? "",
          status: milestone.status,
          sortOrder: milestone.sortOrder,
          notes: milestone.notes ?? "",
        }
      : {
          projectId,
          title: "",
          description: "",
          amount: 0,
          currency: (PROJECT_CURRENCIES as readonly string[]).includes(defaultCurrency)
            ? (defaultCurrency as MilestoneInput["currency"])
            : "PKR",
          dueDate: "",
          status: "pending",
          sortOrder: defaultSortOrder,
          notes: "",
        },
  });

  function handleSubmit(values: MilestoneInput) {
    startTransition(async () => {
      const amountMoney = amountText ? parseMoney(amountText, values.currency as Currency) : null;
      const payload: MilestoneInput = {
        ...values,
        amount: amountMoney?.amount ?? values.amount,
      };
      if (payload.amount <= 0) {
        toast.error("Amount must be positive");
        return;
      }
      try {
        const res = milestone
          ? await updateMilestoneAction(milestone.id, payload)
          : await createMilestoneAction(payload);
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        toast.success(milestone ? "Milestone updated" : "Milestone created");
        onOpenChange(false);
        form.reset();
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit milestone" : "New milestone"}</DialogTitle>
          <DialogDescription>Payment milestone for this project.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Phase 1 delivery" {...field} />
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
                        {PROJECT_CURRENCIES.map((c) => (
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
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amountText || (milestone ? (milestone.amount / 100).toFixed(2) : "")}
                    onChange={(e) => setAmountText(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MILESTONE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
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
                {isPending ? "Saving…" : milestone ? "Save" : "Create milestone"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
