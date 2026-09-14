"use client";

import { ResponsiveLine, type SliceTooltipProps } from "@nivo/line";
import { TrendingUp } from "lucide-react";
import { ChartCard, NIVO_THEME } from "@/src/components/shared/charts";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useHeadcountTrend, type HeadcountPoint } from "../hooks";

/** "+2 hires, −1 leaver · Net +1" — the movement behind a flat headcount line. */
function movementLabel(joiners: number, leavers: number, net: number) {
  const parts: string[] = [];
  if (joiners > 0) parts.push(`+${joiners} ${joiners === 1 ? "hire" : "hires"}`);
  if (leavers > 0)
    parts.push(`−${leavers} ${leavers === 1 ? "leaver" : "leavers"}`);
  if (parts.length === 0) return "no joiners or leavers";
  const sign = net > 0 ? "+" : net < 0 ? "−" : "";
  return `${parts.join(", ")} · Net ${sign}${Math.abs(net)}`;
}

type HeadcountSeries = { id: string; data: readonly { x: string; y: number }[] };

/** Slice tooltip naming the month's movement, not just the headcount value the line shows. */
function HeadcountSliceTooltip(byMonth: Map<string, HeadcountPoint>) {
  return function Tooltip({ slice }: SliceTooltipProps<HeadcountSeries>) {
    const point = slice.points[0];
    const month = String(point?.data.x ?? "");
    const record = byMonth.get(month);
    if (!record) return null;
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-foreground">{record.month}</p>
        <p className="mt-1 text-muted-foreground">
          Headcount: <span className="font-semibold text-foreground">{record.headcount}</span>
        </p>
        <p className="text-muted-foreground">
          {movementLabel(record.joiners, record.leavers, record.net)}
        </p>
      </div>
    );
  };
}

export function HeadcountTrendCard() {
  const { data, loading } = useHeadcountTrend();

  if (loading || !data) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const latest = data[data.length - 1];
  const latestCount = latest?.headcount ?? 0;
  const byMonth = new Map(data.map((d) => [d.month, d]));

  const lineData = [
    {
      id: "Headcount",
      data: data.map((d) => ({ x: d.month, y: d.headcount })),
    },
  ];

  return (
    <ChartCard
      title="Headcount Trend"
      description="Monthly headcount, new hires and leavers"
      icon={TrendingUp}
      compact
      // A flat headcount line says nothing about the churn underneath it —
      // joiners/leavers live on such a different scale that plotting them as
      // their own series just flatlines near zero, so they surface in the
      // point tooltip and in the footer's plain-language movement instead.
      footer={
        latest
          ? `${latest.month}: ${movementLabel(latest.joiners, latest.leavers, latest.net)} · ${latestCount} total`
          : `Latest ${latestCount} over ${data.length} months`
      }
      viewMoreHref="/operations/analytics/employees"
      className="h-full"
    >
      <div style={{ height: 200 }}>
        <ResponsiveLine
          data={lineData}
          margin={{ top: 16, right: 20, bottom: 32, left: 44 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto", nice: true }}
          curve="monotoneX"
          axisBottom={{ tickSize: 0, tickPadding: 8 }}
          axisLeft={{ tickSize: 0, tickPadding: 8 }}
          enableGridX={false}
          colors={["#50D34C"]}
          lineWidth={2.5}
          enableArea
          areaOpacity={0.12}
          pointSize={7}
          pointColor="#50D34C"
          pointBorderWidth={2}
          pointBorderColor="var(--card)"
          enableSlices="x"
          sliceTooltip={HeadcountSliceTooltip(byMonth)}
          useMesh
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
    </ChartCard>
  );
}
