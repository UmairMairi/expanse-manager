"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Download,
  Mail,
  MoreHorizontal,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { InvoiceDialog } from "./invoice-dialog.client";
import {
  deleteInvoiceAction,
  emailInvoiceAction,
  markInvoiceStatusAction,
} from "../actions";
import type { InvoiceDoc } from "@/services/invoices.service";
import type { ClientDoc } from "@/services/clients.service";
import {
  INVOICE_STATUSES,
  type InvoiceStatus,
} from "../schemas";

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  cancelled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500",
};

type Props = {
  invoices: InvoiceDoc[];
  clients: ClientDoc[];
};

function isOverdue(inv: InvoiceDoc): boolean {
  if (inv.status === "paid" || inv.status === "cancelled") return false;
  return new Date(inv.dueDate) < new Date();
}

export function InvoicesView({ invoices, clients }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceDoc | undefined>();
  const [deleting, setDeleting] = useState<InvoiceDoc | null>(null);

  const clientById = new Map(clients.map((c) => [c.id, c]));

  function openNew() {
    setEditing(undefined);
    setEditorOpen(true);
  }

  function emailIt(inv: InvoiceDoc) {
    startTransition(async () => {
      try {
        const res = await emailInvoiceAction(inv.id);
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        toast.success(`Invoice emailed to ${clientById.get(inv.clientId)?.email ?? "client"}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to send");
      }
    });
  }

  function downloadPdf(inv: InvoiceDoc) {
    window.open(`/api/invoices/${inv.id}/pdf`, "_blank");
  }

  function setStatus(inv: InvoiceDoc, s: InvoiceStatus) {
    startTransition(async () => {
      try {
        await markInvoiceStatusAction(inv.id, s);
        toast.success(`Marked ${s}`);
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
        await deleteInvoiceAction(target.id);
        toast.success(`Deleted invoice ${target.invoiceNumber}`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Add a client first"
        description="Invoices need a client. Create one over on /clients."
      />
    );
  }

  if (invoices.length === 0) {
    return (
      <>
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create your first invoice — download as PDF, email to the client, mark paid."
          action={{ label: "New invoice", onClick: openNew }}
        />
        <InvoiceDialog open={editorOpen} onOpenChange={setEditorOpen} clients={clients} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New invoice
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const overdue = isOverdue(inv);
              const displayStatus = overdue ? "overdue" : inv.status;
              const client = clientById.get(inv.clientId);
              return (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                  <TableCell>{client?.name ?? "Unknown"}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.issueDate}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.dueDate}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatMoney(money(inv.total, inv.currency as Currency))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("capitalize", STATUS_BADGE[displayStatus])}
                    >
                      {displayStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Invoice actions"
                        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onSelect={() => downloadPdf(inv)}>
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => emailIt(inv)}
                          disabled={!client?.email}
                        >
                          <Mail className="mr-2 h-4 w-4" /> Email to client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {INVOICE_STATUSES.filter((s) => s !== inv.status).map((s) => (
                          <DropdownMenuItem key={s} onSelect={() => setStatus(inv, s)}>
                            Mark {s}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(inv);
                            setEditorOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setDeleting(inv)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <InvoiceDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        clients={clients}
        invoice={editing}
      />
      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.invoiceNumber} will be permanently removed.
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
