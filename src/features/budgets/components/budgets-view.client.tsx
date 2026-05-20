"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet } from "lucide-react";
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
import { BudgetRow } from "./budget-row";
import { BudgetDialog } from "./budget-dialog.client";
import { deleteBudgetAction } from "../actions";
import type { BudgetDoc, BudgetStatus } from "@/services/budgets.service";

type Props = {
  statuses: BudgetStatus[];
  knownCategories: string[];
};

export function BudgetsView({ statuses, knownCategories }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetDoc | undefined>();
  const [deleting, setDeleting] = useState<BudgetDoc | null>(null);

  function openNew() {
    setEditing(undefined);
    setEditorOpen(true);
  }

  function openEdit(b: BudgetDoc) {
    setEditing(b);
    setEditorOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    startTransition(async () => {
      try {
        await deleteBudgetAction(target.id);
        toast.success(`Deleted ${target.category} budget`);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  }

  if (statuses.length === 0) {
    return (
      <>
        <EmptyState
          icon={Wallet}
          title="No budgets set"
          description="Track category-level monthly limits. We'll warn you when you cross your threshold."
          action={{ label: "New budget", onClick: openNew }}
        />
        <BudgetDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          knownCategories={knownCategories}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New budget
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statuses.map((s) => (
          <BudgetRow
            key={s.budget.id}
            status={s}
            onEdit={() => openEdit(s.budget)}
            onDelete={() => setDeleting(s.budget)}
          />
        ))}
      </div>

      <BudgetDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        budget={editing}
        knownCategories={knownCategories}
      />
      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this budget?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing the {deleting?.category} budget won&apos;t affect your expense records.
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
