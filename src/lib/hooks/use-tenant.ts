"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import { useGetTenantLocaleQuery } from "@/src/store/services/locale";
import type { TenantLocale } from "@/src/types/locale";

/** The signed-in company and its regional settings, from `GET /locale`. */
export function useTenant(): TenantLocale | null {
  const hasTenant = useAppSelector(
    (s) => s.session.is_loggedIn && Boolean(s.session.tenant_id),
  );
  const { data } = useGetTenantLocaleQuery(undefined, { skip: !hasTenant });
  return data ?? null;
}

export function useCurrencySymbol(): string {
  return useTenant()?.currencySymbol ?? "";
}

export function useCurrencyCode(): string {
  return useTenant()?.currency ?? "USD";
}

export function useLocaleCode(): string {
  return useTenant()?.locale ?? "en-US";
}
