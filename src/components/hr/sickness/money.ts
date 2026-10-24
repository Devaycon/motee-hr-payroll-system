"use client";

import { useCurrency } from "@/src/lib/hooks/use-currency";

/** Tenant-currency formatter for sick pay and absence cost figures. */
export function useFormatMoney(): (n: number) => string {
  const { format } = useCurrency();
  return (n: number) => format(Math.round(n * 100) / 100);
}
