"use client";

import { useMemo } from "react";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { Briefcase } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ChartCard, HeroRingCard, chartColor, NIVO_THEME } from "@/src/components/shared/charts";
import { resourcingSummaryProps } from "@/src/components/shared/charts/resourcing-summary";
import { useRecruitment } from "@/src/components/hr/recruitment/hooks";
import type { RequisitionStatus } from "@/src/lib/types/recruitment";

/** Requisition statuses that still represent a role actively being filled. */
const OPEN_STATUSES: RequisitionStatus[] = [
  "approved",
  "open",
  "interviewing",
  "offer_stage",
];

/** Open requisitions grouped by department. */
export function OpenRolesChart() {
  const { loading, bucket } = useRecruitment();

  const rows = useMemo(() => {
    const open = bucket.requisitions.filter((r) =>
      OPEN_STATUSES.includes(r.status),
    );
    const byDept = new Map<string, number>();
    for (const r of open) {
      byDept.set(r.department, (byDept.get(r.department) ?? 0) + 1);
    }
    return [...byDept.entries()]
      .map(([department, value]) => ({ department, value }))
      .sort((a, b) => b.value - a.value);
  }, [bucket.requisitions]);

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const maxValue = Math.max(...rows.map((r) => r.value), 1);

  // A dot plot rather than a bar: with only one number per department, a
  // ranked row of sized dots reads the same magnitude without redrawing the
  // horizontal bar the Alerts card already uses on this dashboard.
  const scatterData = [
    {
      id: "Open roles",
      data: rows.map((r) => ({ x: r.value, y: r.department })),
    },
  ];

  return (
    <ChartCard
      title="Open Roles"
      description="By department"
      icon={Briefcase}
      compact
      footer={`${total} open across ${rows.length} ${rows.length === 1 ? "department" : "departments"}`}
      viewMoreHref="/talent/recruitment"
      className="h-full"
    >
      <div style={{ height: Math.max(140, rows.length * 32) }}>
        <ResponsiveScatterPlot
          data={scatterData}
          margin={{ top: 8, right: 24, bottom: 32, left: 110 }}
          xScale={{ type: "linear", min: 0, max: Math.ceil(maxValue * 1.15) }}
          yScale={{ type: "point" }}
          axisBottom={{ tickSize: 0, tickPadding: 8, legend: "Open roles", legendPosition: "middle", legendOffset: 28 }}
          axisLeft={{ tickSize: 0, tickPadding: 8 }}
          colors={["#FE8F44"]}
          nodeSize={(d) => 8 + (Number(d.data.x) / maxValue) * 10}
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
    </ChartCard>
  );
}

/** The Resourcing tab's hero card: open demand by department, with the same rings/summary/ranked-breakdown pattern used across the dashboard. */
export function ResourcingHeroRing() {
  const { loading, bucket } = useRecruitment();

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const open = bucket.requisitions.filter((r) =>
    OPEN_STATUSES.includes(r.status),
  );
  const byDept = new Map<string, number>();
  for (const r of open) {
    byDept.set(r.department, (byDept.get(r.department) ?? 0) + 1);
  }
  const segments = [...byDept.entries()]
    .map(([label, value], i) => ({ key: label, label, value, color: chartColor(i) }))
    .sort((a, b) => b.value - a.value);

  if (segments.length === 0) return null;

  return (
    <HeroRingCard
      title="Open Roles by Department"
      description="Where active hiring demand sits right now"
      segments={segments}
      totalNoun="open roles"
      variant="gauge"
      {...resourcingSummaryProps(segments)}
    />
  );
}
