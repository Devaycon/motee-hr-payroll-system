import type { AnyReportBreakdownDef, AnyReportDef } from "../types";
import { PEOPLE_REPORTS } from "./people";
import { TALENT_REPORTS } from "./talent";
import { OPERATIONS_REPORTS } from "./operations";

export const ALL_REPORTS: AnyReportDef[] = [
  ...PEOPLE_REPORTS,
  ...TALENT_REPORTS,
  ...OPERATIONS_REPORTS,
];

export const REPORT_GROUPS = ["People", "Talent", "Operations"] as const;

export function getReport(id: string): AnyReportDef | undefined {
  return ALL_REPORTS.find((r) => r.id === id);
}

export function getBreakdown(
  reportId: string,
  breakdownId: string,
): AnyReportBreakdownDef | undefined {
  return getReport(reportId)?.breakdowns?.find((b) => b.id === breakdownId);
}
