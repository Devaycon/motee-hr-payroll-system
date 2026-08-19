"use client";

import { TrendingUp } from "lucide-react";
import { LineChart } from "@/src/components/shared/charts";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useHeadcountTrend } from "../hooks";

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

export function HeadcountTrendCard() {
  const { data, loading } = useHeadcountTrend();

  if (loading || !data) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  const counts = data.map((d) => d.headcount);
  const latest = data[data.length - 1];
  const latestCount = latest?.headcount ?? 0;
  const joiners = data.reduce((sum, d) => sum + d.joiners, 0);
  const leavers = data.reduce((sum, d) => sum + d.leavers, 0);

  return (
    <LineChart
      title="Headcount Trend"
      description="Monthly employee headcount"
      icon={TrendingUp}
      height={260}
      // A flat line at 20 says nothing about churn underneath it, so the card
      // names the joiners and leavers that produced it (client feedback).
      details={[
        { label: "New hires", value: joiners, color: "#4ED251" },
        { label: "Leavers", value: leavers, color: "#ff8b2d" },
        { label: "Net change", value: joiners - leavers, color: "#6366f1" },
      ]}
      footer={
        latest
          ? `${latest.month}: ${movementLabel(latest.joiners, latest.leavers, latest.net)} · ${latestCount} total`
          : `Latest ${latestCount} over ${data.length} months`
      }
      viewMoreHref="/operations/reports/employees"
      categories={data.map((d) => d.month)}
      series={[{ name: "Headcount", data: counts, color: "#4ED251" }]}
    />
  );
}
