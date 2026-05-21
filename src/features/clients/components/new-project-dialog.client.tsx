"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronLeft } from "lucide-react";
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
import { parseMoney, type Currency } from "@/lib/money";
import { createProjectAction, createClientAction } from "../actions";
import {
  PROJECT_STATUSES,
  PROJECT_CURRENCIES,
  type ProjectStatus,
} from "../schemas";
import type { ClientDoc } from "@/services/clients.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientDoc[];
};

const NEW_CLIENT_SENTINEL = "__new__";

export function NewProjectDialog({ open, onOpenChange, clients }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Client picker
  const [clientPick, setClientPick] = useState<string>(clients[0]?.id ?? NEW_CLIENT_SENTINEL);

  // Inline new-client fields
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Project fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [currency, setCurrency] = useState<(typeof PROJECT_CURRENCIES)[number]>("PKR");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quotedText, setQuotedText] = useState("");
  const [rateText, setRateText] = useState("");

  useEffect(() => {
    if (!open) {
      // Reset when dialog closes
      setClientPick(clients[0]?.id ?? NEW_CLIENT_SENTINEL);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      setName("");
      setDescription("");
      setStatus("active");
      setCurrency("PKR");
      setStartDate("");
      setEndDate("");
      setQuotedText("");
      setRateText("");
    }
  }, [open, clients]);

  const useNewClient = clientPick === NEW_CLIENT_SENTINEL || clients.length === 0;

  function submit() {
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (useNewClient && !newClientName.trim()) {
      toast.error("New client name is required");
      return;
    }

    startTransition(async () => {
      try {
        // 1. Create client if needed
        let clientId = clientPick;
        if (useNewClient) {
          const created = await createClientAction({
            name: newClientName.trim(),
            email: newClientEmail.trim() || undefined,
            phone: newClientPhone.trim() || undefined,
          });
          clientId = created.id;
          toast.success(`Client "${created.name}" added`);
        }

        // 2. Create project
        const quotedMoney = quotedText ? parseMoney(quotedText, currency as Currency) : null;
        const rateMoney = rateText ? parseMoney(rateText, currency as Currency) : null;
        const res = await createProjectAction({
          clientId,
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          hourlyRate: rateMoney?.amount ?? 0,
          currency,
          totalQuoted: quotedMoney?.amount ?? 0,
        });
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        toast.success("Project created");
        onOpenChange(false);
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
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Pick an existing client or add a new one inline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Client</Label>
            {clients.length > 0 ? (
              <Select
                value={clientPick}
                onValueChange={(v) => setClientPick(v ?? NEW_CLIENT_SENTINEL)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_CLIENT_SENTINEL}>+ Add new client…</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground">
                No clients yet — we&apos;ll create your first one below.
              </p>
            )}
          </div>

          {useNewClient ? (
            <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">New client details</p>
                {clients.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs"
                    onClick={() => setClientPick(clients[0]!.id)}
                  >
                    <ChevronLeft className="h-3 w-3" /> Pick existing
                  </Button>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input
                  placeholder="Acme Inc."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    placeholder="ops@acme.com"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Project name</Label>
            <Input
              placeholder="Website redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus((v ?? "active") as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={(v) =>
                  setCurrency((v ?? "PKR") as (typeof PROJECT_CURRENCIES)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hourly rate (optional)</Label>
              <Input
                inputMode="decimal"
                placeholder="0.00"
                value={rateText}
                onChange={(e) => setRateText(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Total quoted (optional)</Label>
              <Input
                inputMode="decimal"
                placeholder="0.00"
                value={quotedText}
                onChange={(e) => setQuotedText(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={isPending} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {isPending ? "Saving…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
