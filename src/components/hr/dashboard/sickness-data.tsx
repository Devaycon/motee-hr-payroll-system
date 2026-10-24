"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { endOfMonth, format, parseISO, startOfMonth, subMonths } from "date-fns";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { calculateBradford } from "@/src/lib/sickness/bradford";
import { counts, sicknessStats, workingDaysBetween } from "@/src/lib/sickness/stats";
import { DEFAULT_SICKNESS_SETTINGS } from "@/src/lib/sickness/seeds";
import { getInitials } from "@/src/lib/types/dashboard";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { BradfordAction } from "@/src/lib/types/sickness";
import { dailyCost, useSicknessSeed } from "@/src/components/hr/sickness/hooks";

/**
 * The HR dashboard's Sickness tab, read from the Sickness & Absence module
 * (not leave) so the dashboard and the module always agree — with the
 * department / location / period filters the client asked for.
 */

export interface SicknessFilters {
  department: string;
  branch: string;
  months: number;
}

const DEFAULT_FILTERS: SicknessFilters = { department: "all", branch: "all", months: 12 };

const FilterContext = createContext<{
  filters: SicknessFilters;
  setFilters: (f: SicknessFilters) => void;
}>({ filters: DEFAULT_FILTERS, setFilters: () => {} });

export function SicknessFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  return <FilterContext.Provider value={{ filters, setFilters }}>{children}</FilterContext.Provider>;
}

export function useSicknessFilters() {
  return useContext(FilterContext);
}

export interface SicknessAbsentee {
  employeeId: string;
  name: string;
  initials: string;
  department: string;
  days: number;
  spells: number;
}

export interface MonthlyCount {
  month: string;
  value: number;
}

export interface SicknessData {
  daysInWindow: number;
  peopleInWindow: number;
  absenceRate: number;
  averageSpell: number;
  trend: MonthlyCount[];
  byReason: { label: string; value: number }[];
  topAbsentees: SicknessAbsentee[];
  /** Episodes per employee in the window — absence frequency. */
  frequency: number;
  episodes: number;
  longTerm: { count: number; days: number };
  shortTerm: { count: number; days: number };
  /** Highest Bradford scores. */
  bradford: Array<{ employeeId: string; name: string; score: number; action: BradfordAction }>;
  reviewsPending: number;
  windowLabel: string;
}

export function useSickness() {
  useSicknessSeed();
  const { filters } = useSicknessFilters();
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const records = useAppSelector((s) => s.sickness.records);
  const reviewCases = useAppSelector((s) => s.sickness.reviewCases);
  const allSettings = useAppSelector((s) => s.sickness.settings);

  const data = useMemo<SicknessData | null>(() => {
    if (!bundle) return null;
    const tenantId = bundle.tenant.id;
    const settings = allSettings[tenantId] ?? DEFAULT_SICKNESS_SETTINGS;
    const today = new Date().toISOString().slice(0, 10);
    const from = format(subMonths(parseISO(today), filters.months), "yyyy-MM-dd");
    const employees = bundle.employees.filter(
      (e) =>
        (filters.department === "all" || e.departmentName === filters.department) &&
        (filters.branch === "all" || e.branchId === filters.branch),
    );
    const byId = new Map(employees.map((e) => [e.id, e]));
    const holidays = (bundle.events ?? []).filter((e) => e.type === "holiday").map((e) => e.start.slice(0, 10));
    const live = records.filter((r) => r.tenantId === tenantId && byId.has(r.employeeId) && counts(r));
    const people = new Map(employees.map((e) => [e.id, { schedule: e.workPattern?.schedule, dailyCost: dailyCost(e) }]));
    const headcount = employees.filter((e) => e.status !== "terminated").length;
    // The same figures Absence Records and Alerts & Reporting show.
    const stats = sicknessStats({ records: live, people, headcount, holidays, asOf: today, from, longTermDays: settings.longTermDays });
    const inWindow = stats.rows;
    const holidaySet = new Set(holidays);

    // Days lost inside each month, so a spell crossing month-end splits correctly.
    const monthCount = Math.min(filters.months, 12);
    const trend = Array.from({ length: monthCount }, (_, i) => startOfMonth(subMonths(parseISO(today), monthCount - 1 - i))).map((m) => {
      const mStart = format(m, "yyyy-MM-dd");
      const mEnd = format(endOfMonth(m), "yyyy-MM-dd");
      const to = mEnd < today ? mEnd : today;
      return {
        month: format(m, "MMM"),
        value: live.reduce((a, r) => a + workingDaysBetween(r, today, mStart, to, people.get(r.employeeId)?.schedule, holidaySet), 0),
      };
    });

    const reasons = new Map<string, number>();
    for (const x of inWindow) reasons.set(x.r.reasonCategory, (reasons.get(x.r.reasonCategory) ?? 0) + x.days);

    const per = new Map<string, { days: number; spells: number }>();
    for (const x of inWindow) {
      const e = per.get(x.r.employeeId) ?? { days: 0, spells: 0 };
      e.days += x.days;
      e.spells += 1;
      per.set(x.r.employeeId, e);
    }
    const topAbsentees = [...per.entries()]
      .map(([employeeId, e]) => {
        const emp = byId.get(employeeId);
        return {
          employeeId,
          name: emp?.fullName ?? employeeId,
          initials: emp?.initials || getInitials(emp?.fullName ?? employeeId),
          department: emp?.departmentName ?? "—",
          days: e.days,
          spells: e.spells,
        };
      })
      .sort((a, b) => b.days - a.days);

    const bradford = [...per.keys()]
      .map((id) => {
        const b = calculateBradford({
          employeeId: id,
          records: live,
          asOf: today,
          settings: settings.bradford,
          schedule: byId.get(id)?.workPattern?.schedule,
          holidays,
        });
        return { employeeId: id, name: byId.get(id)?.fullName ?? id, score: b.score, action: b.action };
      })
      .sort((a, b) => b.score - a.score);

    return {
      daysInWindow: stats.daysLost,
      peopleInWindow: stats.people,
      absenceRate: stats.absenceRate,
      averageSpell: stats.averageSpell,
      trend,
      byReason: [...reasons.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      topAbsentees,
      frequency: stats.frequency,
      episodes: stats.episodes,
      longTerm: stats.longTerm,
      shortTerm: stats.shortTerm,
      bradford,
      reviewsPending: reviewCases.filter((c) => c.tenantId === tenantId && byId.has(c.employeeId) && c.status !== "closed").length,
      windowLabel: `Last ${filters.months} months`,
    };
  }, [bundle, records, reviewCases, allSettings, filters]);

  return { data, loading: loading && !data, error };
}
