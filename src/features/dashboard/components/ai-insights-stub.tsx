import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AiInsightsStub() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Phase 3
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Once Gemini is wired up in Phase 3, this panel will surface 3–5 daily insights about your spending,
            income trends, and budget risks — generated from the previous day&apos;s data.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex items-start gap-2 text-muted-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden="true" />
              <span className="italic">&quot;Your food spending is up 25% this month.&quot;</span>
            </li>
            <li className="flex items-start gap-2 text-muted-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden="true" />
              <span className="italic">&quot;Upwork income dropped — adjust forecast?&quot;</span>
            </li>
            <li className="flex items-start gap-2 text-muted-foreground">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" aria-hidden="true" />
              <span className="italic">&quot;You could save PKR 20,000 monthly.&quot;</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
