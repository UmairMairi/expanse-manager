import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
};

export function Progress({ value, max = 100, className, indicatorClassName }: Props) {
  const clamped = Math.max(0, Math.min(max, value));
  const pct = (clamped / max) * 100;
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-all",
          pct >= 100 && "bg-emerald-600",
          indicatorClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
