/**
 * Currency helpers — re-exports the Money primitive from lib/ and adds
 * domain conveniences used across feature slices.
 */
export {
  type Currency,
  type Money,
  money,
  fromMajor,
  toMajor,
  add,
  subtract,
  sumByCurrency,
  formatMoney,
  parseMoney,
} from "@/lib/money";

import type { Currency } from "@/lib/money";

export const SUPPORTED_CURRENCIES: ReadonlyArray<Currency> = [
  "PKR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "INR",
  "CAD",
  "AUD",
];

export const DEFAULT_CURRENCY: Currency = "PKR";
