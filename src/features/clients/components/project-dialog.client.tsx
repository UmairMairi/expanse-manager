"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseMoney, type Currency } from "@/lib/money";
import { createProjectAction, updateProjectAction } from "../actions";
import {
  ProjectSchema,
  PROJECT_STATUSES,
  PROJECT_CURRENCIES,
  type ProjectInput,
} from "../schemas";
import type { ProjectDoc } from "@/services/clients.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  project?: ProjectDoc;
};

export function ProjectDialog({ open, onOpenChange, clientId, project }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rateText, setRateText] = useState("");
  const [quotedText, setQuotedText] = useState("");

  const form = useForm<ProjectInput>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: project
      ? {
          clientId: project.clientId,
          name: project.name,
          description: project.description ?? "",
          status: project.status,
          startDate: project.startDate ?? "",
          endDate: project.endDate ?? "",
          hourlyRate: project.hourlyRate ?? 0,
          currency: project.currency as ProjectInput["currency"],
          totalQuoted: project.totalQuoted ?? 0,
          notes: project.notes ?? "",
        }
      : {
          clientId,
          name: "",
          description: "",
          status: "active",
          startDate: "",
          endDate: "",
          hourlyRate: 0,
          currency: "PKR",
          totalQuoted: 0,
          notes: "",
        },
  });

  function handleSubmit(values: ProjectInput) {
    startTransition(async () => {
      const rateMoney = rateText ? parseMoney(rateText, values.currency as Currency) : null;
      const quotedMoney = quotedText
        ? parseMoney(quotedText, values.currency as Currency)
        : null;
      const payload: ProjectInput = {
        ...values,
        hourlyRate: rateMoney?.amount ?? values.hourlyRate,
        totalQuoted: quotedMoney?.amount ?? values.totalQuoted,
      };
      try {
        const res = project
          ? await updateProjectAction(project.id, payload)
          : await createProjectAction(payload);
        if (!res.ok) {
          toast.error(res.error.message);
          return;
        }
        toast.success(project ? "Project updated" : "Project created");
        onOpenChange(false);
        form.reset();
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
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>Track scope, status, and totals.</DialogDescription>
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
                    <Input placeholder="Website redesign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormItem>
                <FormLabel>Hourly rate (optional)</FormLabel>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={rateText || (project?.hourlyRate ? (project.hourlyRate / 100).toFixed(2) : "")}
                    onChange={(e) => setRateText(e.target.value)}
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Total quoted (optional)</FormLabel>
                <FormControl>
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={quotedText || (project?.totalQuoted ? (project.totalQuoted / 100).toFixed(2) : "")}
                    onChange={(e) => setQuotedText(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : project ? "Save" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
