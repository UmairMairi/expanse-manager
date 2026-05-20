"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { SavingsGoalCard } from "./savings-goal-card";
import { SavingsGoalDialog } from "./savings-goal-dialog.client";
import { ContributeDialog } from "./contribute-dialog.client";
import { deleteSavingsGoalAction } from "../actions";
import type { SavingsGoalDoc } from "@/services/savings.service";

type Props = { goals: SavingsGoalDoc[] };

export function SavingsView({ goals }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoalDoc | undefined>();
  const [contributing, setContributing] = useState<SavingsGoalDoc | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoalDoc | null>(null);

  function openNew() {
    setEditing(undefined);
    setEditorOpen(true);
  }

  function openEdit(g: SavingsGoalDoc) {
    setEditing(g);
    setEditorOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    startTransition(async () => {
      try {
        await deleteSavingsGoalAction(target.id);
        toast.success(`Deleted "${target.goalName}"`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  }

  if (goals.length === 0) {
    return (
      <>
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Set up your first goal — emergency fund, vacation, down payment — and track progress over time."
          action={{ label: "New goal", onClick: openNew }}
        />
        <SavingsGoalDialog open={editorOpen} onOpenChange={setEditorOpen} goal={editing} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New goal
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => (
          <SavingsGoalCard
            key={g.id}
            goal={g}
            onContribute={() => setContributing(g)}
            onEdit={() => openEdit(g)}
            onDelete={() => setDeleting(g)}
          />
        ))}
      </div>

      <SavingsGoalDialog open={editorOpen} onOpenChange={setEditorOpen} goal={editing} />
      <ContributeDialog
        goal={contributing}
        open={Boolean(contributing)}
        onOpenChange={(o) => !o && setContributing(null)}
      />
      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.goalName}&rdquo; will be permanently removed. This can&apos;t be
              undone.
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
