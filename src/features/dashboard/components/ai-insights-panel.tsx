import { Sparkles, AlertTriangle, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InsightsDoc } from "@/ai/insights";

type Props = {
  insights: InsightsDoc | null;
  configured: boolean;
};

const TONE_STYLES = {
  warning: "border-l-amber-500",
  positive: "border-l-emerald-500",
  neutral: "border-l-zinc-300 dark:border-l-zinc-700",
} as const;

const TONE_ICONS = {
  warning: AlertTriangle,
  positive: TrendingUp,
  neutral: Sparkles,
} as const;

export function AiInsightsPanel({ insights, configured }: Props) {
  if (!configured) {
    return (
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Insights</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set <code>GEMINI_API_KEY</code> to enable daily AI insights.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!insights || insights.insights.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Insights</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No insights yet. They are generated daily at 03:00 UTC, or as soon as
              there&apos;s enough activity to compare.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold">AI Insights</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Generated {new Date(insights.generatedAt).toLocaleDateString()}
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {insights.insights.map((insight, i) => {
          const Icon = TONE_ICONS[insight.tone];
          return (
            <li
              key={i}
              className={cn("border-l-2 pl-3", TONE_STYLES[insight.tone])}
            >
              <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium leading-snug">{insight.headline}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
