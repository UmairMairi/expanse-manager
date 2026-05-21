"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Pencil, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deletePaymentMethodAction,
} from "../actions";
import { PaymentMethodSchema, type PaymentMethodInput } from "../schemas";
import type { PaymentMethodDoc } from "@/services/payment-methods.service";

const TYPES: PaymentMethodInput["type"][] = [
  "cash",
  "card",
  "bank_transfer",
  "wallet",
  "crypto",
  "other",
];

type Props = { initial: PaymentMethodDoc[] };

export function PaymentMethodsManager({ initial }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethodDoc | undefined>();
  const [deleting, setDeleting] = useState<PaymentMethodDoc | null>(null);

  const form = useForm<PaymentMethodInput>({
    resolver: zodResolver(PaymentMethodSchema),
    defaultValues: { name: "", type: "card", notes: "" },
  });

  function openNew() {
    setEditing(undefined);
    form.reset({ name: "", type: "card", notes: "" });
    setEditorOpen(true);
  }

  function openEdit(m: PaymentMethodDoc) {
    setEditing(m);
    form.reset({
      name: m.name,
      type: m.type,
      notes: m.notes ?? "",
    });
    setEditorOpen(true);
  }

  function handleSubmit(values: PaymentMethodInput) {
    startTransition(async () => {
      try {
        if (editing) {
          await updatePaymentMethodAction(editing.id, values);
          toast.success("Payment method updated");
        } else {
          await createPaymentMethodAction(values);
          toast.success("Payment method added");
        }
        setEditorOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    startTransition(async () => {
      try {
        await deletePaymentMethodAction(target.id);
        toast.success(`Deleted "${target.name}"`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add the cards, wallets, or accounts you actually use. They appear in the
          expense form&apos;s payment dropdown.
        </p>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New method
        </Button>
      </div>

      {initial.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment methods yet"
          description="Add HBL Debit, JazzCash, Binance USDT, or whatever you use."
          action={{ label: "Add method", onClick: openNew }}
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {initial.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {m.type.replace("_", " ")}
                  </Badge>
                </div>
                {m.notes ? (
                  <p className="mt-1 text-xs text-muted-foreground truncate">{m.notes}</p>
                ) : null}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(m)}
                  aria-label={`Edit ${m.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setDeleting(m)}
                  aria-label={`Delete ${m.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit payment method" : "New payment method"}</DialogTitle>
            <DialogDescription>
              Used to tag how an expense was paid for.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="HBL Debit · *1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace("_", " ")}
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
                <Button type="button" variant="ghost" onClick={() => setEditorOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editing ? "Save" : "Add method"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing expenses keep their label. Future expense forms won&apos;t list this
              option.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
