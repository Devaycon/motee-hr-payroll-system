"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import {
  Tile,
  TileLabel,
  TileSub,
  TileNum,
  TileDelta,
  TileLink,
  MiniPie,
} from "./tiles";
import {
  useStatCards,
  useLeaveBreakdown,
  type StatCardKey,
  type LeaveKind,
} from "../hooks";

/**
 * The KPI tiles used to sit in one pinned row above every widget. They are now
 * spread across the dashboard tabs, each tab taking the ones that answer its
 * own question.
 *
 * Rendered with the dashboard's own `Tile` rather than the app-wide
 * `HrStatCard`: no icon chip and no badge — the label, the number, a delta
 * line and an explicit link to the module that owns the figure.
 */

/**
 * Shorter headings than the app-wide KPI labels; the sub-line carries the
 * scope. `link` names the destination so the drill-down says where it goes
 * rather than a bare "View".
 */
const HEADINGS: Record<StatCardKey, { label: string; sub: string; link: string }> = {
  total: { label: "Total employees", sub: "Active", link: "View employees" },
  "new-hires": { label: "New hires", sub: "This month", link: "View onboarding" },
  leavers: { label: "Leavers", sub: "This month", link: "View offboarding" },
  remote: { label: "Remote today", sub: "Working remote", link: "View employees" },
  birthdays: { label: "Birthdays", sub: "Next 7 days", link: "View calendar" },
  "annual-leave": { label: "Annual leave", sub: "Requests in the last 12 months", link: "View leave" },
  "sick-leave": { label: "Sick leave", sub: "Requests in the last 12 months", link: "View leave" },
  "other-leave": { label: "Other leave", sub: "Requests in the last 12 months", link: "View leave" },
  turnover: { label: "Turnover rate", sub: "Current quarter", link: "View workforce" },
};

export function StatTile({
  statKey,
  chart,
}: {
  statKey: StatCardKey;
  /** Optional sparkline, drawn between the delta line and the link. */
  chart?: ReactNode;
}) {
  const { data, loading } = useStatCards();
  const heading = HEADINGS[statKey];

  if (loading || !data) {
    return <Skeleton className="h-36 w-full rounded-xl" />;
  }

  const stat = data.find((s) => s.key === statKey);
  if (!stat) return null;

  const trendPeriod = stat.trendPeriod ?? "vs last month";

  // Exactly four lines, always — label, scope, number, delta — then the link.
  // An extra zero-state line on some tiles and not others made a row of
  // otherwise identical tiles ragged, and the sub-line already says what is
  // being counted, so "0 / This month" reads fine on its own.
  return (
    <Tile>
      {/* The chart sits beside the figure, not under it: stacking it pushed
          the link down and made the tile twice as tall as the People KPIs. */}
      <div className="flex flex-1 gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <TileLabel>{heading.label}</TileLabel>
          <TileSub>{heading.sub}</TileSub>
          <TileNum>{stat.value}</TileNum>
          {/* One line either way, so a row of tiles stays level: a percentage
              change where one is meaningful, otherwise a plain fact about the
              same figure. */}
          {stat.trend ? (
            <TileDelta up={Boolean(stat.up)}>
              {stat.up ? "+" : "−"}
              {stat.trend} {trendPeriod}
            </TileDelta>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">{stat.note}</p>
          )}
          <TileLink href={stat.link}>{heading.link}</TileLink>
        </div>
        {chart && <div className="shrink-0 self-center">{chart}</div>}
      </div>
    </Tile>
  );
}

/**
 * KPI tiles ship as a row, not as individual widgets.
 *
 * They are all the same shape and a good deal shorter than a gauge or a chart
 * tile. Placed individually on the 12-column grid they end up sharing a row
 * with a tall tile, and the grid then either stretches them (a dead band inside
 * the card) or leaves a hole beneath them. Kept together in their own
 * full-width row, every tile in the row is the same height and neither happens.
 */
function StatTileRow({
  keys,
  columns,
}: {
  keys: readonly StatCardKey[];
  columns: "3" | "5";
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === "5"
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          : "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {keys.map((k) => (
        <StatTile key={k} statKey={k} />
      ))}
    </div>
  );
}

/** People tab — headcount movement, five across. */
export function PeopleKpiRow() {
  return (
    <StatTileRow
      keys={["total", "new-hires", "leavers", "remote", "birthdays"]}
      columns="5"
    />
  );
}

/**
 * Attendance tab — open leave requests by type, three across.
 *
 * The pie is a share of **days**, not of request counts. The two disagree —
 * "Other" is 37% of requests but 42% of the days — and days is the measure
 * that matches the line above it and reflects what leave actually costs.
 */
const LEAVE_TILES: { key: StatCardKey; label: string; kind: LeaveKind }[] = [
  { key: "annual-leave", label: "Annual", kind: "annual" },
  { key: "sick-leave", label: "Sick", kind: "sick" },
  { key: "other-leave", label: "Other", kind: "other" },
];

const PIE_SIZE = 76;

function LeaveShare({
  label,
  days,
  totalDays,
}: {
  label: string;
  days: number;
  totalDays: number;
}) {
  const share = Math.round((days / totalDays) * 100);

  return (
    <div className="text-center">
      <MiniPie
        size={PIE_SIZE}
        slices={[
          { label, value: days, color: "var(--primary)" },
          {
            label: "Other leave types",
            value: Math.max(totalDays - days, 0),
            color: "var(--muted)",
          },
        ]}
      />
      {/* Names the unit: a bare "34% of all leave" left the reader guessing
          whether that was days or requests, and the two differ. */}
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {share}% of all leave days
      </p>
    </div>
  );
}

export function LeaveKpiRow() {
  const { data } = useLeaveBreakdown();

  const days = data?.days;
  const totalDays = days ? days.annual + days.sick + days.other : 0;

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {LEAVE_TILES.map(({ key, label, kind }) => (
        <StatTile
          key={key}
          statKey={key}
          chart={
            days && totalDays > 0 ? (
              <LeaveShare
                label={label}
                days={days[kind]}
                totalDays={totalDays}
              />
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
