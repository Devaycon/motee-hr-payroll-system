"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";

export function useTenant() {
  return useAppSelector((s) => s.locale.data?.tenant ?? null);
}

export function useCurrencySymbol(): string {
  return useAppSelector((s) => s.locale.data?.tenant.currencySymbol ?? "");
}

export function useCurrencyCode(): string {
  return useAppSelector((s) => s.locale.data?.tenant.currency ?? "USD");
}

export function useLocaleCode(): string {
  return useAppSelector((s) => s.locale.data?.tenant.locale ?? "en-US");
}
