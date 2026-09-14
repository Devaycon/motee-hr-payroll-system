"use client";

import type { ReportAnalytics } from "@/src/lib/reports/types";
import { reportGroupTheme } from "@/src/lib/reports/group-theme";
import { AnalyticsBento } from "./analytics-bento";
import { BreakdownNav, type BreakdownNavItem } from "./breakdown-nav";

export function ReportAnalyticsView({
  analytics,
  reportId,
  group,
  breakdowns,
  activeBreakdownId,
}: {
  analytics: ReportAnalytics;
  /** Enables the "Deep-dive breakdowns" nav strip when both are given. */
  reportId?: string;
  /** Dataset group (People/Talent/Operations) — colours the bento to match the hub. */
  group?: string;
  breakdowns?: BreakdownNavItem[];
  activeBreakdownId?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {reportId && breakdowns?.length ? (
        <BreakdownNav
          reportId={reportId}
          items={breakdowns}
          activeId={activeBreakdownId}
        />
      ) : null}
      <AnalyticsBento
        stats={analytics.stats}
        charts={analytics.charts}
        theme={reportGroupTheme(group ?? "")}
      />
    </div>
  );
}
