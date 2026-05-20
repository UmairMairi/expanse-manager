import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";

export type DateRange = { start: Date; end: Date };

export type DateRangePreset =
  | "today"
  | "this-week"
  | "this-month"
  | "this-year"
  | "last-7-days"
  | "last-30-days"
  | "last-90-days"
  | "last-month";

export function rangeForPreset(preset: DateRangePreset, now = new Date()): DateRange {
  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "this-week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "this-month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "this-year":
      return { start: startOfYear(now), end: endOfYear(now) };
    case "last-7-days":
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case "last-30-days":
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case "last-90-days":
      return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) };
    case "last-month": {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
  }
}

export function formatShortDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM d, yyyy");
}

export function formatMonth(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMMM yyyy");
}

export function monthKey(d: Date = new Date()): string {
  return format(d, "yyyy-MM");
}
