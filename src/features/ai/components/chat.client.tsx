"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "model"; text: string };

const SUGGESTIONS = [
  "How much did I spend on Food this month?",
  "Which platform is my biggest income source this year?",
  "What outstanding milestones do I have?",
  "Compare last month's expenses to this month.",
];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isPending]);

  function send(textOverride?: string) {
    const text = (textOverride ?? draft).trim();
    if (!text) return;
    const next: Message[] = [...messages, { role: "user", text }];
    setMessages(next);
    setDraft("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          toast.error(err.error ?? "AI request failed");
          return;
        }
        const data = (await res.json()) as { text: string };
        setMessages((prev) => [...prev, { role: "model", text: data.text }]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Network error");
      }
    });
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg border border-border bg-card/30 p-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Ask anything about your finances</h2>
              <p className="text-sm text-muted-foreground">
                I can query your expenses, income, savings, budgets, clients, and milestones.
              </p>
            </div>
            <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-left text-sm transition hover:bg-muted/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-4">
            {messages.map((m, i) => (
              <li
                key={i}
                className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
              >
                {m.role === "model" ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                ) : null}
                <Card
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap px-3.5 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card",
                  )}
                >
                  {m.text}
                </Card>
                {m.role === "user" ? (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </li>
            ))}
            {isPending ? (
              <li className="flex justify-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                </div>
                <Card className="bg-card px-3.5 py-2 text-sm text-muted-foreground">
                  Thinking…
                </Card>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Ask about your finances… (Shift+Enter for newline)"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="resize-none"
          disabled={isPending}
        />
        <Button
          onClick={() => send()}
          disabled={isPending || !draft.trim()}
          className="gap-2 self-end"
        >
          <Send className="h-4 w-4" /> Send
        </Button>
      </div>
    </div>
  );
}
