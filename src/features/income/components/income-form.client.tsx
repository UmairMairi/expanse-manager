"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  INCOME_SOURCES,
  IncomeInputSchema,
  PLATFORMS_BY_SOURCE,
  type IncomeInput,
  type IncomeDoc,
  type IncomeSource,
} from "@/types/income";
import { SUPPORTED_CURRENCIES } from "@/utils/currency";
import { createIncomeAction, updateIncomeAction } from "../actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: IncomeDoc;
};

export function IncomeForm({ open, onOpenChange, existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<IncomeInput>({
    resolver: zodResolver(IncomeInputSchema),
    defaultValues: existing
      ? {
          source: existing.source as IncomeSource,
          platform: existing.platform,
          amountMajor: existing.amountMajor,
          currency: existing.currency,
          date: existing.date.slice(0, 10),
          notes: existing.notes ?? "",
        }
      : {
          source: "freelance",
          platform: "Upwork",
          amountMajor: 0,
          currency: "USD",
          date: format(new Date(), "yyyy-MM-dd"),
          notes: "",
        },
  });

  const source = form.watch("source") as IncomeSource;
  const platformOptions = PLATFORMS_BY_SOURCE[source] ?? [];

  function onSubmit(values: IncomeInput) {
    startTransition(async () => {
      const res = existing
        ? await updateIncomeAction(existing.id, values)
        : await createIncomeAction(values);
      if (!res.ok) {
        toast.error(res.error.message);
        return;
      }
      toast.success(existing ? "Income updated" : "Income recorded");
      onOpenChange(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit income" : "Record income"}</DialogTitle>
          <DialogDescription>
            Capture earnings from salaries, freelance platforms, or direct payments.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        const defaultPlatform = PLATFORMS_BY_SOURCE[v as IncomeSource]?.[0] ?? "";
                        form.setValue("platform", defaultPlatform);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INCOME_SOURCES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
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
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    {platformOptions.length > 0 ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {platformOptions.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input placeholder="Custom platform" {...field} />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {existing ? "Save changes" : "Record income"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Re-export for typing convenience in callers
export type { IncomeSource };
