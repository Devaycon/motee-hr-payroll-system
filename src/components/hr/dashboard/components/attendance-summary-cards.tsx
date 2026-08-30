"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tile, TileLabel, TileSub, MiniBars } from "./tiles";
import { useWeeklyAttendance, type WeeklyAttendancePoint } from "../hooks";

/**
 * The Attendance tab's three summary tiles: present, late and absent as an
 * average per day across the last few weeks, each direct-labelled with the
 * current week picked out.
 */
type Measure = "present" | "late" | "absent";

const MEASURES: Record<Measure, { title: string }> = {
  present: { title: "Present" },
  late: { title: "Late arrivals" },
  absent: { title: "Absent" },
};

function WeeklyTile({ measure }: { measure: Measure }) {
  const { data, loading } = useWeeklyAttendance();
  const spec = MEASURES[measure];

  if (loading || !data) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const values = data.map((d: WeeklyAttendancePoint) => d[measure]);
  const latest = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2];

  return (
    <Tile>
      <TileLabel>{spec.title}</TileLabel>
      <TileSub>Avg per day</TileSub>

      <MiniBars
        ariaLabel={`${spec.title}, average per day by week`}
        items={data.map((d) => ({ label: d.week, value: d[measure] }))}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        {previous === undefined
          ? `${latest} per day this week`
          : `${latest} per day · ${describeChange(latest - previous)}`}
      </p>

      <Link
        href="/operations/reports/attendance"
        className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline"
      >
        View report
        <ChevronRight className="size-3.5" />
      </Link>
    </Tile>
  );
}

function describeChange(diff: number) {
  if (diff === 0) return "level with last week";
  return `${diff > 0 ? "+" : "−"}${Math.abs(diff)} vs last week`;
}

export function PresentWeeklyCard() {
  return <WeeklyTile measure="present" />;
}

export function LateWeeklyCard() {
  return <WeeklyTile measure="late" />;
}

export function AbsentWeeklyCard() {
  return <WeeklyTile measure="absent" />;
}
