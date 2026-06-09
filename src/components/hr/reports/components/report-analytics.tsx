"use client";

import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type {
  ReportAnalytics,
  ReportChartSpec,
  ReportStat,
} from "@/src/lib/reports/types";
import { ReportChartCard } from "./report-charts";

function toStatCard(stat: ReportStat): HrStatCardItem {
  return {
    label: stat.label,
    value: stat.money ? formatMoneyLocale(Number(stat.value)) : stat.value,
    sub: stat.sub ?? "",
    icon: stat.icon ?? BarChart3,
    trend: stat.trend,
    up: stat.up,
  };
}

/** Small seeded PRNG so the shuffle is stable across re-renders/filters. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Trends & bars span the full row; donut/gauge/radar are half-width (paired). */
const FULL_KINDS = new Set(["line", "area", "bar", "multibar", "funnel"]);

export function ReportAnalyticsView({ analytics }: { analytics: ReportAnalytics }) {
  // A fresh random seed per mount → blocks are shuffled differently each load,
  // but stable while the user filters/searches within the same report.
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const signature = analytics.charts.map((c) => `${c.kind}:${c.title}`).join("|");

  // Lay charts out in "blocks" that each fill exactly one 2-col row, so there
  // are never blank half-cells: every full chart is its own row; half charts
  // are paired; a leftover odd half is promoted to full width.
  const charts = useMemo(() => {
    const fulls = analytics.charts.filter((c) => FULL_KINDS.has(c.kind));
    const halves = analytics.charts.filter((c) => !FULL_KINDS.has(c.kind));

    const blocks: ReportChartSpec[][] = [];
    for (const c of fulls) blocks.push([{ ...c, fullWidth: true }]);
    for (let i = 0; i < halves.length; i += 2) {
      const pair = halves.slice(i, i + 2);
      if (pair.length === 1) {
        blocks.push([{ ...pair[0], fullWidth: true }]); // lone half → full row
      } else {
        blocks.push(pair.map((c) => ({ ...c, fullWidth: false })));
      }
    }

    const rand = mulberry32(seed);
    for (let i = blocks.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    }
    return blocks.flat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, seed]);

  return (
    <div className="flex flex-col gap-5">
      <HrStatCardsGrid stats={analytics.stats.map(toStatCard)} columns={4} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {charts.map((c, i) => (
          <ReportChartCard key={`${c.kind}-${c.title}-${i}`} spec={c} />
        ))}
      </div>
    </div>
  );
}
