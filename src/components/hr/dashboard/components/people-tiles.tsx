"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { GenderPictogram } from "@/src/components/shared/gender-figures";
import {
  Tile,
  TileLabel,
  TileSub,
  MiniBars,
  MiniPie,
  PieLegend,
  type PieSlice,
} from "./tiles";
import {
  useGenderSplit,
  useHeadcountTrend,
  useDepartmentHeadcount,
  useEmploymentTypeBreakdown,
} from "../hooks";

/** Trailing months shown by the small trend tiles. */
const TREND_MONTHS = 3;

function ViewMore({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline"
    >
      {children}
      <ChevronRight className="size-3.5" />
    </Link>
  );
}

/**
 * Gender split as two headline percentages rather than a donut: with two
 * dominant categories and a small remainder, the numbers are the point and a
 * pie only makes them harder to read off.
 */
export function GenderSplitTile() {
  const { data, loading } = useGenderSplit();

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const total = data.series.reduce((sum, s) => sum + s.value, 0) || 1;
  const pct = (value: number) => Math.round((value / total) * 100);
  const female = data.series.find((s) => s.key === "female");
  const male = data.series.find((s) => s.key === "male");
  const other = data.series.find((s) => s.key === "other");

  const rows = [
    { entry: female, variant: "female" as const },
    { entry: male, variant: "male" as const },
  ];

  return (
    // Heading, the remainder and the link stack down the left; each figure on
    // the right carries its own label and numbers directly underneath, so the
    // drawing and the figure it stands for read as one unit.
    <Tile>
      <div className="flex flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <TileLabel>Gender split</TileLabel>
          <TileSub>Current headcount</TileSub>

          {/* All the numbers live here; the figures opposite carry only their
              label. Each block still names its gender — a bare "30%" beside a
              "60%" would rely on the reader matching it to the right drawing. */}
          <div className="mt-3 flex flex-col gap-2.5">
            {rows.map(({ entry, variant }) => (
              <div key={variant}>
                <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                  {entry?.label ?? "—"}
                </span>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-2xl font-semibold text-foreground tabular-nums">
                    {pct(entry?.value ?? 0)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry?.value ?? 0}{" "}
                    {entry?.value === 1 ? "person" : "people"}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {/* Says what the percentages are a share of, and accounts for the
              gap — the two figures deliberately don't add up to 100%. */}
          <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
            Share of {total} active {total === 1 ? "employee" : "employees"} by
            recorded gender.
            {other && other.value > 0 && (
              <>
                {" "}
                A further {other.value}{" "}
                {other.value === 1 ? "person is" : "people are"} recorded as
                other or undisclosed ({pct(other.value)}%), so the two figures
                don&apos;t total 100%.
              </>
            )}
          </p>

          <ViewMore href="/operations/reports/employees">View report</ViewMore>
        </div>

        {/* Drawings stand on a shared ground line with nothing under them but
            their own label — every number sits in the detail column. */}
        <div className="flex shrink-0 gap-5 self-center">
          {rows.map(({ entry, variant }) => (
            <div key={variant} className="text-center">
              <GenderPictogram variant={variant} size={190} />
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {entry?.label ?? "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Tile>
  );
}

/** Headcount over the last few months — the shape, not the exact curve. */
export function HeadcountTrendTile() {
  const { data, loading } = useHeadcountTrend();

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const months = data.slice(-TREND_MONTHS);
  const latest = months[months.length - 1];
  const first = months[0];
  const net =
    latest && first ? latest.headcount - first.headcount : 0;

  return (
    <Tile>
      <TileLabel>Headcount trend</TileLabel>
      <TileSub>Last {months.length} months</TileSub>

      <MiniBars
        ariaLabel="Headcount by month"
        items={months.map((m) => ({ label: m.month, value: m.headcount }))}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        {net === 0
          ? "Flat across the period"
          : `${net > 0 ? "+" : "−"}${Math.abs(net)} over the period`}
      </p>

      <ViewMore href="/operations/workforce">View workforce</ViewMore>
    </Tile>
  );
}

/** Departments as a ranked list — names are the information here, not lengths. */
export function DeptHeadcountTile() {
  const { data, loading } = useDepartmentHeadcount();

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const rows = [...data.data].sort((a, b) => b.value - a.value);

  return (
    <Tile>
      <TileLabel>Dept. headcount</TileLabel>
      <TileSub>
        {rows.length} {rows.length === 1 ? "department" : "departments"}
      </TileSub>

      {/* `justify-between` with the gap as a floor: the rows spread into
          whatever height the row's tallest card sets, instead of stacking at a
          fixed rhythm and leaving a gap at the bottom. */}
      <ul className="mt-3 flex flex-1 flex-col justify-between gap-1.5 text-xs">
        {rows.map((row) => (
          <li key={row.category} className="flex items-baseline gap-2">
            <span className="truncate text-muted-foreground">
              {row.category}
            </span>
            <span
              aria-hidden
              className="min-w-2 flex-1 border-b border-dashed border-border"
            />
            <span className="shrink-0 font-medium text-foreground tabular-nums">
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      <ViewMore href="/operations/reports/employees">View report</ViewMore>
    </Tile>
  );
}

/** Employment type as a dial plus its own labelled list. */
export function EmploymentTypeTile() {
  const { data, loading } = useEmploymentTypeBreakdown();

  if (loading || !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const total = data.data.reduce((sum, d) => sum + d.value, 0) || 1;
  const slices: PieSlice[] = data.data.map((d) => ({
    label: d.label,
    value: d.value,
    color: d.fill,
  }));

  return (
    // Heading, key and link stack down the left; the dial sits on the right
    // where the width is spare, so it can be read at a glance without the
    // card growing.
    <Tile>
      <div className="flex flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <TileLabel>Employment type</TileLabel>
          <TileSub>Current headcount</TileSub>

          <div className="mt-3 flex flex-1 items-start">
            <PieLegend
              slices={slices}
              format={(s) => `${Math.round((s.value / total) * 100)}%`}
            />
          </div>

          <ViewMore href="/operations/reports/employees">View report</ViewMore>
        </div>

        <MiniPie slices={slices} size={132} className="self-center" />
      </div>
    </Tile>
  );
}
