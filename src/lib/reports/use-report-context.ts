"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { AnyReportDef, ReportContext } from "./types";

/**
 * What the Analytics and Reports hubs pass to every report besides the
 * bundle. Payroll is only loaded for Nigeria tenants and people allowed to
 * see it; everyone else gets `payroll: null` and never sees payroll reports.
 */
export function useReportContext(): { ctx: ReportContext; payrollLoading: boolean } {
  const country = useAppSelector((s) => s.locale.country);
  const canPayroll = useCan(PAYROLL_MODULE, "view");
  const enabled = country === "ng" && canPayroll;
  const { data, loading } = useTenantPayroll({ enabled });
  const ctx = useMemo<ReportContext>(() => ({ country, payroll: enabled ? data : null }), [country, enabled, data]);
  return { ctx, payrollLoading: enabled && (loading || !data) };
}

/** A report exists in this country (some, like payroll, are country-specific). */
export function reportInCountry(r: AnyReportDef, ctx: ReportContext): boolean {
  return !r.countries || r.countries.includes(ctx.country);
}
