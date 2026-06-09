"use client";

import { useLocaleSection } from "./use-locale-data";
import { store } from "@/src/lib/stores/store";
import type { LocaleBundle } from "@/src/lib/types/locale";

/** Format an amount with a currency symbol and grouped thousands. */
export function formatMoney(amount: number, symbol: string): string {
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
export function formatMoneyLocale(amount: number): string {
  return formatMoney(amount, currentCurrencySymbol());
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
    format: (amount: number) => formatMoney(amount, symbol),
  };
}
