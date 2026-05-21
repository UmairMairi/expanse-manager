"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Briefcase, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { EmptyState } from "@/components/empty-state";
import { formatMoney, money, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { NewProjectDialog } from "./new-project-dialog.client";
import { ProjectDialog } from "./project-dialog.client";
import { deleteProjectAction, updateProjectAction } from "../actions";
import type { ProjectDoc, ClientDoc } from "@/services/clients.service";
import { PROJECT_STATUSES, type ProjectStatus } from "../schemas";

type Props = {
  projects: ProjectDoc[];
  clients: ClientDoc[];
};

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "on-hold": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  completed: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function ProjectsView({ projects, clients }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDoc | null>(null);
  const [deleting, setDeleting] = useState<ProjectDoc | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  const clientById = new Map(clients.map((c) => [c.id, c]));

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    const client = clientById.get(p.clientId);
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description ?? "").toLowerCase().includes(term) ||
      (client?.name ?? "").toLowerCase().includes(term)
    );
  });

  function quickStatus(p: ProjectDoc, to: ProjectStatus) {
    startTransition(async () => {
      try {
        const res = await updateProjectAction(p.id, {
          clientId: p.clientId,
          name: p.name,
          description: p.description,
          status: to,
          startDate: p.startDate,
          endDate: p.endDate,
          hourlyRate: p.hourlyRate ?? 0,
          currency: p.currency,
          totalQuoted: p.totalQuoted ?? 0,
          notes: p.notes,
        });
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        toast.success(`Status → ${to}`);
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
        const res = await deleteProjectAction(target.id);
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

  if (projects.length === 0) {
    return (
      <>
        <EmptyState
          icon={Briefcase}
          title="No projects yet"
          description="Track scope, dates, milestones, and billing for client work."
          action={{ label: "New project", onClick: () => setCreateOpen(true) }}
        />
        <NewProjectDialog open={createOpen} onOpenChange={setCreateOpen} clients={clients} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search by project, client, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="hidden flex-wrap gap-1 sm:flex">
            {(["all", ...PROJECT_STATUSES] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
                className="h-7 capitalize text-xs"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Quoted</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No matches.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const client = clientById.get(p.clientId);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${p.clientId}/projects/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {p.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {client ? (
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-sm hover:underline"
                        >
                          {client.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[p.status])}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {p.startDate ?? "—"}
                      {p.endDate ? ` → ${p.endDate}` : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {p.totalQuoted
                        ? formatMoney(money(p.totalQuoted, p.currency as Currency), { compact: true })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Project actions"
                          className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {PROJECT_STATUSES.filter((s) => s !== p.status).map((s) => (
                            <DropdownMenuItem key={s} onClick={() => quickStatus(p, s)}>
                              Mark {s}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditing(p)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleting(p)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <NewProjectDialog open={createOpen} onOpenChange={setCreateOpen} clients={clients} />
      {editing ? (
        <ProjectDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          clientId={editing.clientId}
          project={editing}
        />
      ) : null}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll need to delete its milestones first if any exist.
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
