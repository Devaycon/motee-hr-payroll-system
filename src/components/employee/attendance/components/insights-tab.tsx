"use client";

import { useMemo } from "react";
import { CalendarRange, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { ColumnChart, LineChart } from "@/src/components/shared/charts";
import type { LocaleWorkPattern } from "@/src/lib/types/locale";
import {
  contractedWeeklyHours,
  punctualityRate,
  weeklyTotals,
} from "@/src/lib/types/attendance";
import { minutesFromTime } from "@/src/lib/utils/format-duration";
import { buildWeek, recentWeekStarts, toHHMM, type TimeLogRow } from "../hooks";

interface InsightsTabProps {
  logs: TimeLogRow[];
  workPattern: LocaleWorkPattern | undefined;
  todayIso: string;
}

const WEEKS = 8;

function shortWeekLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function InsightsTab({
  logs,
  workPattern,
  todayIso,
}: InsightsTabProps) {
  const contracted = contractedWeeklyHours(workPattern);

  const weeks = useMemo(() => {
    // Oldest first, so the charts read left-to-right in time order.
    return recentWeekStarts(todayIso, WEEKS)
      .slice()
      .reverse()
      .map((start) => {
        const week = buildWeek(logs, start, workPattern);
        return {
          start,
          label: shortWeekLabel(start),
          totals: weeklyTotals(week.entries, contracted),
          punctuality: punctualityRate(week.entries),
        };
      });
  }, [logs, workPattern, todayIso, contracted]);

  /** Average clock-in time across every logged day, in minutes past midnight. */
  const avgStart = useMemo(() => {
    const times = logs
      .filter((l) => l.clockIn)
      .map((l) => minutesFromTime(toHHMM(l.clockIn as string)))
      .filter((m) => m > 0);
    if (!times.length) return null;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }, [logs]);

  const overallPunctuality = useMemo(() => {
    const entries = weeks.flatMap((w) =>
      buildWeek(logs, w.start, workPattern).entries,
    );
    return punctualityRate(entries);
  }, [weeks, logs, workPattern]);

  const hasData = weeks.some((w) => w.totals.totalHours > 0);

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-[11px] text-muted-foreground py-6 text-center">
            No attendance history yet. Insights appear once you have clocked a
            few days.
          </p>
        </CardContent>
      </Card>
    );
  }

  const summary = [
    {
      label: "Average start",
      value:
        avgStart != null
          ? `${String(Math.floor(avgStart / 60)).padStart(2, "0")}:${String(
              avgStart % 60,
            ).padStart(2, "0")}`
          : "—",
      sub: "Across every logged day",
      icon: Clock,
    },
    {
      label: "Punctuality",
      value: `${overallPunctuality}%`,
      sub: `Last ${WEEKS} weeks`,
      icon: TrendingUp,
    },
    {
      label: "Average week",
      value: `${
        Math.round(
          (weeks.reduce((a, w) => a + w.totals.totalHours, 0) / weeks.length) *
            10,
        ) / 10
      }h`,
      sub: contracted ? `Contracted ${contracted}h` : "No contract set",
      icon: CalendarRange,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summary.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#7F77DD]/10 flex items-center justify-center shrink-0">
                <s.icon className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground leading-none tabular-nums">
                  {s.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {s.label} · {s.sub}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ColumnChart
        title="Hours worked against contract"
        description={`Weekly totals for the last ${WEEKS} weeks`}
        icon={CalendarRange}
        categories={weeks.map((w) => w.label)}
        series={[
          {
            name: "Hours worked",
            data: weeks.map((w) => w.totals.totalHours),
            color: "#7F77DD",
          },
          ...(contracted
            ? [
                {
                  name: "Contracted",
                  data: weeks.map(() => contracted),
                  color: "#94a3b8",
                },
              ]
            : []),
        ]}
        height={260}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChart
          title="Punctuality trend"
          description="Share of days you arrived on time"
          icon={TrendingUp}
          categories={weeks.map((w) => w.label)}
          series={[
            {
              name: "On time",
              data: weeks.map((w) => w.punctuality),
              color: "#1D9E75",
            },
          ]}
          height={240}
        />

        <ColumnChart
          title="Overtime by week"
          description="Hours beyond your contracted week"
          icon={Clock}
          categories={weeks.map((w) => w.label)}
          series={[
            {
              name: "Overtime",
              data: weeks.map((w) => w.totals.overtimeHours),
              color: "#ff8b2d",
            },
          ]}
          height={240}
        />
      </div>
    </div>
  );
}
