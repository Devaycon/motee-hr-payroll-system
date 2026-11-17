"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  PUBLIC_HOLIDAYS_BY_COUNTRY,
  type PublicHoliday,
} from "@/src/data/leave-calendar-demo";

/** The active country's public holidays (UK bank holidays vs Nigerian federal holidays). */
export function usePublicHolidays(): PublicHoliday[] {
  const country = useAppSelector((s) => s.locale.country);
  return PUBLIC_HOLIDAYS_BY_COUNTRY[country] ?? PUBLIC_HOLIDAYS_BY_COUNTRY.uk;
}
