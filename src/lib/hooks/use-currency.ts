"use client";

import { useLocaleSection } from "./use-locale-data";
import { store } from "@/src/lib/stores/store";
import type { LocaleBundle } from "@/src/lib/types/locale";

export interface MoneyFormatOptions {
  /** Keep minor units (pence/kobo) instead of rounding to whole units. */
  decimals?: boolean;
  /** Abbreviate large values — £767,900 renders as £767.9k. */
  compact?: boolean;
}

/** Values at or above this are abbreviated when `compact` is set. */
const COMPACT_THRESHOLD = 10_000;

/**
 * Format an amount with a currency symbol and grouped thousands.
 *
 * The default rounds to whole units, which is what salary bands and budgets
 * across the app expect. Expense claims are entered to two decimal places, so
 * they opt into `decimals` (client feedback §8.1); their KPI totals opt into
 * `compact` to keep six-figure sums readable in a small card.
 */
export function formatMoney(
  amount: number,
  symbol: string,
  opts: MoneyFormatOptions = {},
): string {
  if (opts.compact && Math.abs(amount) >= COMPACT_THRESHOLD) {
    // Intl yields an uppercase suffix ("767.9K"); the client's spec is "767.9k".
    const compact = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    })
      .format(amount)
      .replace(/[KMBT]$/, (s) => s.toLowerCase());
    return `${symbol}${compact}`;
  }
  if (opts.decimals) {
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

/**
 * The active locale's currency symbol, read synchronously from the store.
 * For use in module-level formatters that can't call hooks; components that
 * display locale-derived data re-render on country switch and pick up the
 * new symbol automatically. Defaults to ₦ before the locale has loaded.
 */
export function currentCurrencySymbol(): string {
  return store.getState().locale.data?.tenant.currencySymbol ?? "₦";
}

/** Like {@link formatMoney} but pulls the symbol from the active locale. */
export function formatMoneyLocale(
  amount: number,
  opts?: MoneyFormatOptions,
): string {
  return formatMoney(amount, currentCurrencySymbol(), opts);
}

/** The active locale's ISO currency code (e.g. "NGN", "GBP"). */
export function currentCurrencyCode(): string {
  return store.getState().locale.data?.tenant.currency ?? "NGN";
}

/**
 * Locale-aware currency helper. Reads the active tenant's symbol/code so money
 * renders ₦ for Nigeria and £ for UK and switches with the country selector.
 */
export function useCurrency() {
  const { data } = useLocaleSection<{ symbol: string; code: string }>(
    (b: LocaleBundle) => ({
      symbol: b.tenant.currencySymbol,
      code: b.tenant.currency,
    }),
  );
  const symbol = data?.symbol ?? "₦";
  const code = data?.code ?? "NGN";
  return {
    symbol,
    code,
    format: (amount: number, opts?: MoneyFormatOptions) =>
      formatMoney(amount, symbol, opts),
  };
}
