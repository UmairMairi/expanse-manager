export type RangePreset = "week" | "month" | "quarter" | "year" | "ytd" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

export function rangeForPreset(preset: RangePreset, now: Date = new Date()): DateRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (preset) {
    case "week": {
      const start = new Date(y, m, d - 6);
      return { from: start, to: now, label: "Last 7 days" };
    }
    case "month": {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      return { from: start, to: end, label: now.toLocaleString("en-US", { month: "long", year: "numeric" }) };
    }
    case "quarter": {
      const q = Math.floor(m / 3);
      const start = new Date(y, q * 3, 1);
      const end = new Date(y, q * 3 + 3, 0, 23, 59, 59, 999);
      return { from: start, to: end, label: `Q${q + 1} ${y}` };
    }
    case "year": {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59, 999);
      return { from: start, to: end, label: `${y}` };
    }
    case "ytd": {
      const start = new Date(y, 0, 1);
      return { from: start, to: now, label: "Year to date" };
    }
    case "custom":
    default:
      throw new Error("Custom range requires explicit dates");
  }
}

export function customRange(fromIso: string, toIso: string): DateRange {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  to.setHours(23, 59, 59, 999);
  return { from, to, label: `${fromIso} – ${toIso}` };
}
