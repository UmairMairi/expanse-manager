/**
 * Money is always stored as an integer in the currency's minor unit
 * (paisa for PKR, cents for USD). This eliminates floating-point drift
 * on sums and percentages — critical for financial data.
 *
 * Display layer (and only the display layer) converts to a decimal.
 */
export type Currency =
  | "PKR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "INR"
  | "CAD"
  | "AUD";

export type Money = {
  amount: number; // integer, minor units
  currency: Currency;
};

const MINOR_UNITS_PER_MAJOR: Record<Currency, number> = {
  PKR: 100,
  USD: 100,
  EUR: 100,
  GBP: 100,
  AED: 100,
  INR: 100,
  CAD: 100,
  AUD: 100,
};

const LOCALE_FOR_CURRENCY: Record<Currency, string> = {
  PKR: "en-PK",
  USD: "en-US",
  EUR: "en-DE",
  GBP: "en-GB",
  AED: "en-AE",
  INR: "en-IN",
  CAD: "en-CA",
  AUD: "en-AU",
};

export function money(amount: number, currency: Currency = "PKR"): Money {
  if (!Number.isInteger(amount)) {
    throw new Error(
      `Money amount must be an integer in minor units; received ${amount}`,
    );
  }
  return { amount, currency };
}

/**
 * Convert a major-unit decimal (12.50) to minor units (1250). Use only at
 * the user-input boundary.
 */
export function fromMajor(major: number, currency: Currency = "PKR"): Money {
  const factor = MINOR_UNITS_PER_MAJOR[currency];
  return money(Math.round(major * factor), currency);
}

/** Convert minor units back to a major-unit decimal for display. */
export function toMajor(m: Money): number {
  return m.amount / MINOR_UNITS_PER_MAJOR[m.currency];
}

export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot add ${a.currency} and ${b.currency}; convert at the display layer`,
    );
  }
  return money(a.amount + b.amount, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot subtract ${b.currency} from ${a.currency}`,
    );
  }
  return money(a.amount - b.amount, a.currency);
}

export function sumByCurrency(items: Money[]): Map<Currency, number> {
  const out = new Map<Currency, number>();
  for (const m of items) {
    out.set(m.currency, (out.get(m.currency) ?? 0) + m.amount);
  }
  return out;
}

/**
 * Format a Money value for display: `Intl.NumberFormat` in the currency's
 * native locale (PKR: en-PK, USD: en-US, etc).
 */
export function formatMoney(
  m: Money,
  opts: { compact?: boolean; sign?: boolean } = {},
): string {
  const locale = LOCALE_FOR_CURRENCY[m.currency];
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: m.currency,
    notation: opts.compact ? "compact" : "standard",
    maximumFractionDigits: m.currency === "PKR" ? 0 : 2,
    signDisplay: opts.sign ? "exceptZero" : "auto",
  });
  return formatter.format(toMajor(m));
}

/**
 * Parse a user-entered string like "12,345.50" or "PKR 12,345" into minor
 * units. Returns null on unparseable input rather than NaN.
 */
export function parseMoney(input: string, currency: Currency = "PKR"): Money | null {
  if (!input) return null;
  // Strip currency symbols, codes, and thousands separators.
  const cleaned = input
    .replace(/[A-Za-z\s$£€₨﷼]/g, "")
    .replace(/,/g, "")
    .trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return fromMajor(parsed, currency);
}
