"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { DASHBOARD_TABS } from "./widgets";

/** The dashboard tabs this user sees: Payroll only for Nigeria tenants and people with payroll access. */
export function useDashboardTabs() {
  const country = useAppSelector((s) => s.locale.country);
  const canPayroll = useCan(PAYROLL_MODULE, "view");
  return useMemo(() => DASHBOARD_TABS.filter((t) => t.key !== "payroll" || (country === "ng" && canPayroll)), [country, canPayroll]);
}
