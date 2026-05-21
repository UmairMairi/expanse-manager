"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft } from "lucide-react";
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
import { Briefcase } from "lucide-react";
import { formatMoney, money, type Currency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ProjectDialog } from "./project-dialog.client";
import { deleteProjectAction } from "../actions";
import type { ClientDoc, ProjectDoc } from "@/services/clients.service";
import { CLIENT_SOURCE_LABELS, type ProjectStatus } from "../schemas";

type Props = {
  client: ClientDoc;
  projects: ProjectDoc[];
};

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  "on-hold": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  completed: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function ClientProjectsView({ client, projects }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDoc | undefined>();
  const [deleting, setDeleting] = useState<ProjectDoc | null>(null);

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
        toast.success(`Deleted project "${target.name}"`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/clients")}
        >
          <ArrowLeft className="h-4 w-4" /> All clients
        </Button>
        <Button onClick={() => { setEditing(undefined); setEditorOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
          <Badge variant="outline" className="capitalize">
            {CLIENT_SOURCE_LABELS[client.source]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {client.email ? <span>{client.email}</span> : null}
          {client.phone ? <span>{client.phone}</span> : null}
          {client.taxId ? <span>Tax: {client.taxId}</span> : null}
        </div>
        {client.notes ? (
          <p className="mt-2 text-sm text-muted-foreground">{client.notes}</p>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects yet"
          description="Add a project to start tracking payment milestones."
          action={{ label: "New project", onClick: () => setEditorOpen(true) }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/clients/${client.id}/projects/${p.id}`}
                  className="text-base font-semibold leading-tight hover:underline"
                >
                  {p.name}
                </Link>
                <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[p.status])}>
                  {p.status}
                </Badge>
              </div>
              {p.description ? (
                <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
              ) : null}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {p.totalQuoted
                    ? formatMoney(money(p.totalQuoted, p.currency as Currency), {
                        compact: true,
                      })
                    : "—"}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/clients/${client.id}/projects/${p.id}`)
                    }
                  >
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);
                      setEditorOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setDeleting(p)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProjectDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        clientId={client.id}
        project={editing}
      />
      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll need to delete all milestones first.
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
