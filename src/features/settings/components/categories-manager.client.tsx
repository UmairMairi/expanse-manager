"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tags } from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "../actions";
import { CategorySchema, type CategoryInput } from "../schemas";
import type { CategoryDoc } from "@/services/categories.service";

type Props = { initial: CategoryDoc[] };

export function CategoriesManager({ initial }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDoc | undefined>();
  const [deleting, setDeleting] = useState<CategoryDoc | null>(null);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues: { name: "", color: "", notes: "" },
  });

  function openNew() {
    setEditing(undefined);
    form.reset({ name: "", color: "", notes: "" });
    setEditorOpen(true);
  }

  function openEdit(c: CategoryDoc) {
    setEditing(c);
    form.reset({
      name: c.name,
      color: c.color ?? "",
      notes: c.notes ?? "",
    });
    setEditorOpen(true);
  }

  function handleSubmit(values: CategoryInput) {
    startTransition(async () => {
      try {
        if (editing) {
          await updateCategoryAction(editing.id, values);
          toast.success("Category updated");
        } else {
          await createCategoryAction(values);
          toast.success("Category added");
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
        await deleteCategoryAction(target.id);
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
          Your custom categories supplement the 12 built-in ones in the expense form.
        </p>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      {initial.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No custom categories yet"
          description="Add categories like Coffee, Subscriptions, or anything else you want to track."
          action={{ label: "Add category", onClick: openNew }}
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {initial.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: c.color || "#a1a1aa" }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {c.notes ? (
                    <p className="text-xs text-muted-foreground truncate">{c.notes}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(c)}
                  aria-label={`Edit ${c.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => setDeleting(c)}
                  aria-label={`Delete ${c.name}`}
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
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              Used to tag expenses and define budgets.
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
                      <Input placeholder="Coffee" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (optional)</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="color"
                          className="h-9 w-12 cursor-pointer p-1"
                          value={field.value || "#6366f1"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <Input
                        placeholder="#6366f1"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex-1 font-mono text-xs"
                      />
                    </div>
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
                <Button type="submit">{editing ? "Save" : "Add category"}</Button>
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
              Existing expenses with this category keep their label. Future expense forms
              won&apos;t show this category in the dropdown anymore.
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

