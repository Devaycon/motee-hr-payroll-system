"use client";

import Link from "next/link";
import { ChevronRight, UserCheck } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tile, TileLabel, TileSub, MiniBars } from "./tiles";
import { ChartCard, HeroRingCard } from "@/src/components/shared/charts";
import { attendanceSummaryProps } from "@/src/components/shared/charts/attendance-summary";
import { useWeeklyAttendance, type WeeklyAttendancePoint } from "../hooks";

/**
 * The Attendance tab's three summary tiles: present, late and absent as an
 * average per day across the last few weeks, each direct-labelled with the
 * current week picked out.
 */
function describeChange(diff: number) {
  if (diff === 0) return "level with last week";
  return `${diff > 0 ? "+" : "−"}${Math.abs(diff)} vs last week`;
}

function footerFor(latest: number, previous: number | undefined) {
  return previous === undefined
    ? `${latest} per day this week`
    : `${latest} per day · ${describeChange(latest - previous)}`;
}

export function PresentWeeklyCard() {
  const { data, loading } = useWeeklyAttendance();

  if (loading || !data) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  const values = data.map((d: WeeklyAttendancePoint) => d.present);
  const latest = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2];

  return (
    <ChartCard
      title="Present"
      description="Avg per day, by week"
      icon={UserCheck}
      compact
      footer={footerFor(latest, previous)}
      viewMoreHref="/operations/analytics/attendance"
      className="h-full"
    >
      <MiniBars
        ariaLabel="Present, average per day by week"
        items={data.map((d) => ({ label: d.week, value: d.present }))}
      />
    </ChartCard>
  );
}

export function LateWeeklyCard() {
  const { data, loading } = useWeeklyAttendance();

  if (loading || !data) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  const values = data.map((d: WeeklyAttendancePoint) => d.late);
  const latest = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2];

  return (
    <ChartCard
      title="Late arrivals"
      description="Avg per day, by week"
      compact
      footer={footerFor(latest, previous)}
      viewMoreHref="/operations/analytics/attendance"
      className="h-full"
    >
      <MiniBars
        ariaLabel="Late arrivals, average per day by week"
        items={data.map((d) => ({ label: d.week, value: d.late }))}
      />
    </ChartCard>
  );
}

export function AbsentWeeklyCard() {
  const { data, loading } = useWeeklyAttendance();

  if (loading || !data) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const values = data.map((d: WeeklyAttendancePoint) => d.absent);
  const latest = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2];

  return (
    <Tile>
      <TileLabel>Absent</TileLabel>
      <TileSub>Avg per day</TileSub>

      <MiniBars
        ariaLabel="Absent, average per day by week"
        items={data.map((d) => ({ label: d.week, value: d.absent }))}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        {footerFor(latest, previous)}
      </p>

      <Link
        href="/operations/analytics/attendance"
        className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline"
      >
        View report
        <ChevronRight className="size-3.5" />
      </Link>
    </Tile>
  );
}

/** The Attendance tab's hero card: this week's present/late/absent mix, with the same rings/summary/ranked-breakdown pattern used across the dashboard. */
export function AttendanceHeroRing() {
  const { data, loading } = useWeeklyAttendance();

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }
  if (data.length === 0) return null;

  const latest = data[data.length - 1];
  const segments = [
    { key: "present", label: "Present", value: latest.present, color: "#50D34C" },
    { key: "late", label: "Late", value: latest.late, color: "#f59e0b" },
    { key: "absent", label: "Absent", value: latest.absent, color: "#f43f5e" },
  ].filter((s) => s.value > 0);

  if (segments.length === 0) return null;

  return (
    <HeroRingCard
      title="Weekly Attendance Snapshot"
      description="Average employees per day, current week"
      segments={segments}
      totalNoun="employees per day"
      {...attendanceSummaryProps(segments)}
    />
  );
}
