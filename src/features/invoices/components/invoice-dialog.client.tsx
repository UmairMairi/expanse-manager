"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, money, parseMoney, type Currency } from "@/lib/money";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createInvoiceAction, updateInvoiceAction } from "../actions";
import { INVOICE_CURRENCIES, INVOICE_STATUSES, type InvoiceStatus } from "../schemas";
import type { InvoiceDoc } from "@/services/invoices.service";
import type { ClientDoc } from "@/services/clients.service";

type LineItemDraft = {
  description: string;
  quantity: string;
  unitPriceText: string;
  taxPercent: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientDoc[];
  invoice?: InvoiceDoc;
  defaults?: {
    clientId?: string;
    projectId?: string;
    milestoneId?: string;
    invoiceNumber?: string;
    title?: string;
    amount?: number; // minor units
    currency?: string;
  };
};

function emptyLine(): LineItemDraft {
  return { description: "", quantity: "1", unitPriceText: "", taxPercent: "0" };
}

export function InvoiceDialog({
  open,
  onOpenChange,
  clients,
  invoice,
  defaults,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(
    invoice?.clientId ?? defaults?.clientId ?? clients[0]?.id ?? "",
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoice?.invoiceNumber ??
      defaults?.invoiceNumber ??
      `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
  );
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate ?? new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ??
      new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  );
  const [currency, setCurrency] = useState<Currency>(
    (invoice?.currency ?? defaults?.currency ?? "PKR") as Currency,
  );
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status ?? "draft");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [lines, setLines] = useState<LineItemDraft[]>(
    invoice?.lineItems.map((li) => ({
      description: li.description,
      quantity: String(li.quantity),
      unitPriceText: (li.unitPrice / 100).toFixed(2),
      taxPercent: String(li.taxPercent),
    })) ??
      (defaults?.title && defaults?.amount
        ? [
            {
              description: defaults.title,
              quantity: "1",
              unitPriceText: (defaults.amount / 100).toFixed(2),
              taxPercent: "0",
            },
          ]
        : [emptyLine()]),
  );

  function updateLine(i: number, patch: Partial<LineItemDraft>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }
  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  const totals = lines.reduce(
    (acc, l) => {
      const qty = parseFloat(l.quantity) || 0;
      const unitMoney = parseMoney(l.unitPriceText, currency);
      const unit = unitMoney?.amount ?? 0;
      const tax = parseFloat(l.taxPercent) || 0;
      const line = Math.round(qty * unit);
      const taxAmt = Math.round((line * tax) / 100);
      acc.subtotal += line;
      acc.tax += taxAmt;
      return acc;
    },
    { subtotal: 0, tax: 0 },
  );

  function submit() {
    if (!clientId) {
      toast.error("Pick a client");
      return;
    }
    const lineItems = lines.map((l) => ({
      description: l.description,
      quantity: parseFloat(l.quantity) || 0,
      unitPrice: parseMoney(l.unitPriceText, currency)?.amount ?? 0,
      taxPercent: parseFloat(l.taxPercent) || 0,
    }));
    if (lineItems.some((li) => !li.description || li.quantity <= 0)) {
      toast.error("Each line needs a description and positive quantity");
      return;
    }
    const payload = {
      invoiceNumber,
      clientId,
      projectId: invoice?.projectId ?? defaults?.projectId,
      milestoneId: invoice?.milestoneId ?? defaults?.milestoneId,
      issueDate,
      dueDate,
      currency,
      lineItems,
      notes: notes || undefined,
      status,
    };
    startTransition(async () => {
      try {
        if (invoice) {
          await updateInvoiceAction(invoice.id, payload);
          toast.success("Invoice updated");
        } else {
          await createInvoiceAction(payload);
          toast.success("Invoice created");
        }
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{invoice ? "Edit invoice" : "New invoice"}</DialogTitle>
          <DialogDescription>Generate, download, or email an invoice.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Invoice number</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Issued</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Due</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Line items</Label>
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_100px_60px_28px] gap-2 items-start">
                    <Input
                      placeholder="Description"
                      value={l.description}
                      onChange={(e) => updateLine(i, { description: e.target.value })}
                    />
                    <Input
                      inputMode="decimal"
                      placeholder="Qty"
                      value={l.quantity}
                      onChange={(e) => updateLine(i, { quantity: e.target.value })}
                    />
                    <Input
                      inputMode="decimal"
                      placeholder="Unit"
                      value={l.unitPriceText}
                      onChange={(e) => updateLine(i, { unitPriceText: e.target.value })}
                    />
                    <Input
                      inputMode="decimal"
                      placeholder="Tax %"
                      value={l.taxPercent}
                      onChange={(e) => updateLine(i, { taxPercent: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
            </div>

            <div className="border-t border-border pt-3 space-y-1 font-mono tabular-nums text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(money(totals.subtotal, currency))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(money(totals.tax, currency))}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{formatMoney(money(totals.subtotal + totals.tax, currency))}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 pb-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Saving…" : invoice ? "Save" : "Create invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
