"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
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
import { formatMoney, money, type Currency } from "@/lib/money";
import { ClientDialog } from "./client-dialog.client";
import { deleteClientAction } from "../actions";
import { CLIENT_SOURCE_LABELS } from "../schemas";
import type { ClientDoc, ClientSummary } from "@/services/clients.service";

type Props = { summaries: ClientSummary[] };

export function ClientsView({ summaries }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ClientDoc | undefined>();
  const [deleting, setDeleting] = useState<ClientDoc | null>(null);

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    startTransition(async () => {
      try {
        const res = await deleteClientAction(target.id);
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        toast.success(`Deleted "${target.name}"`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  if (summaries.length === 0) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking projects, milestones, and payments."
          action={{ label: "New client", onClick: () => setEditorOpen(true) }}
        />
        <ClientDialog open={editorOpen} onOpenChange={setEditorOpen} client={editing} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => { setEditing(undefined); setEditorOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New client
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((s) => (
          <Card key={s.client.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/clients/${s.client.id}`}
                className="text-base font-semibold leading-tight hover:underline"
              >
                {s.client.name}
              </Link>
              <span className="text-xs text-muted-foreground tabular-nums">
                {s.activeProjects} active
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] font-medium">
                {CLIENT_SOURCE_LABELS[s.client.source]}
              </Badge>
              {s.client.email ? <span>{s.client.email}</span> : null}
            </div>

            <div className="mt-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Billed</p>
                <p className="text-sm font-mono tabular-nums">
                  {formatMoney(money(s.totalBilled, s.primaryCurrency as Currency), { compact: true })}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Paid</p>
                <p className="text-sm font-mono tabular-nums text-emerald-600">
                  {formatMoney(money(s.totalPaid, s.primaryCurrency as Currency), { compact: true })}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Open</p>
                <p className="text-sm font-mono tabular-nums">
                  {formatMoney(money(s.outstanding, s.primaryCurrency as Currency), { compact: true })}
                </p>
              </div>
            </div>

            <div className="mt-1 flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/clients/${s.client.id}`)}
              >
                Open
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(s.client);
                  setEditorOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setDeleting(s.client)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ClientDialog open={editorOpen} onOpenChange={setEditorOpen} client={editing} />
      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; will be permanently removed. If they still have
              projects, you&apos;ll need to delete those first.
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
