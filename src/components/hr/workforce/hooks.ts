"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface WorkforceOverview {
  totalHeadcount: number;
  avgTenureYears: number;
}

function tenureYears(startDate: string): number {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;
  const today = new Date();
  return (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function compute(bundle: LocaleBundle): WorkforceOverview {
  const total = bundle.employees.length;
  const years = bundle.employees.map((e) => tenureYears(e.startDate));
  const avg = years.length ? years.reduce((a, b) => a + b, 0) / years.length : 0;
  return {
    totalHeadcount: total,
    avgTenureYears: Math.round(avg * 10) / 10,
  };
}

export function useWorkforceOverview() {
  return useLocaleSection<WorkforceOverview>(compute);
}
