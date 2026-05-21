"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Receipt, MoreHorizontal } from "lucide-react";
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
import { MilestoneDialog } from "./milestone-dialog.client";
import {
  deleteMilestoneAction,
  transitionMilestoneStatusAction,
} from "../actions";
import type {
  ClientDoc,
  ProjectDoc,
  MilestoneDoc,
} from "@/services/clients.service";
import {
  MILESTONE_STATUSES,
  type MilestoneStatus,
  type ProjectStatus,
} from "../schemas";

type Props = {
  client: ClientDoc;
  project: ProjectDoc;
  milestones: MilestoneDoc[];
};

const STATUS_BADGE: Record<MilestoneStatus, string> = {
  pending: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  invoiced: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

const PROJECT_STATUS_BADGE: Record<ProjectStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "on-hold": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  completed: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function MilestonesView({ client, project, milestones }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MilestoneDoc | undefined>();
  const [deleting, setDeleting] = useState<MilestoneDoc | null>(null);

  function openNew() {
    setEditing(undefined);
    setEditorOpen(true);
  }

  function changeStatus(m: MilestoneDoc, to: MilestoneStatus) {
    startTransition(async () => {
      try {
        const res = await transitionMilestoneStatusAction(m.id, to);
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        if (to === "paid" && m.status !== "paid") {
          toast.success("Marked paid — income record created");
        } else {
          toast.success(`Status → ${to}`);
        }
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
        const res = await deleteMilestoneAction(target.id);
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        toast.success(`Deleted "${target.title}"`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const totals = milestones.reduce(
    (acc, m) => {
      if (m.status === "cancelled") return acc;
      acc.billed += m.amount;
      if (m.status === "paid") acc.paid += m.amount;
      else acc.open += m.amount;
      return acc;
    },
    { billed: 0, paid: 0, open: 0 },
  );

  const nextSortOrder = (milestones.at(-1)?.sortOrder ?? -1) + 1;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 -ml-1"
        onClick={() => router.push(`/clients/${client.id}`)}
      >
        <ArrowLeft className="h-4 w-4" /> Back to {client.name}
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <Badge variant="outline" className={cn("capitalize", PROJECT_STATUS_BADGE[project.status])}>
              {project.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.name}
            {project.startDate ? ` · ${project.startDate}` : ""}
            {project.endDate ? ` → ${project.endDate}` : ""}
          </p>
          {project.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
          ) : null}
        </div>
        <Button onClick={openNew} className="gap-2 sm:self-end">
          <Plus className="h-4 w-4" /> New milestone
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total billed</p>
          <p className="mt-1 font-mono text-lg tabular-nums">
            {formatMoney(money(totals.billed, project.currency as Currency))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Paid</p>
          <p className="mt-1 font-mono text-lg tabular-nums text-emerald-600">
            {formatMoney(money(totals.paid, project.currency as Currency))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Outstanding</p>
          <p className="mt-1 font-mono text-lg tabular-nums">
            {formatMoney(money(totals.open, project.currency as Currency))}
          </p>
        </Card>
      </div>

      {milestones.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No milestones yet"
          description="Add payment milestones to track scope and billing for this project."
          action={{ label: "New milestone", onClick: openNew }}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium">{m.title}</div>
                    {m.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.dueDate ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatMoney(money(m.amount, m.currency as Currency))}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", STATUS_BADGE[m.status])}>
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Milestone actions"
                        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {MILESTONE_STATUSES.filter((s) => s !== m.status).map((s) => (
                          <DropdownMenuItem key={s} onClick={() => changeStatus(m, s)}>
                            Mark {s}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(m);
                            setEditorOpen(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleting(m)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <MilestoneDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        projectId={project.id}
        defaultCurrency={project.currency}
        defaultSortOrder={nextSortOrder}
        milestone={editing}
      />
      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be permanently removed.
              {deleting?.linkedIncomeId
                ? " The linked income record will remain — delete it separately from /income."
                : ""}
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
