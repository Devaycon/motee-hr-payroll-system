"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { OH_REFERRALS } from "@/src/data/occupational-health-demo";
import { OH_FITNESS_LABELS } from "@/src/lib/types/occupational-health";
import {
  Tile,
  TileLabel,
  TileSub,
  TileNum,
  MiniBars,
  HBars,
} from "./tiles";
import { useSickness } from "../hooks";

/**
 * The Sickness tab. Absence is read off the same `leaveRequests` the Sickness &
 * Absence module writes to, and the Occupational Health tiles read the OH
 * referral log — so every tile drills into the module that owns its data
 * rather than into a generic report.
 */
const LEAVE_HREF = "/time-payroll/leave";
const OH_HREF = "/time-payroll/occupational-health";

function TileLink({ href, children }: { href: string; children: string }) {
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

function KpiTile({
  label,
  sub,
  value,
  note,
  href,
  link,
}: {
  label: string;
  sub: string;
  value: string | number;
  note?: string;
  href: string;
  link: string;
}) {
  return (
    <Tile>
      <TileLabel>{label}</TileLabel>
      <TileSub>{sub}</TileSub>
      <TileNum>{value}</TileNum>
      {/* One note line on every tile, so a row of KPIs stays level. */}
      <p className="mt-2 text-xs text-muted-foreground">{note ?? " "}</p>
      <TileLink href={href}>{link}</TileLink>
    </Tile>
  );
}

export function SickDaysTile() {
  const { data, loading } = useSickness();
  if (loading || !data) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <KpiTile
      label="Sick days"
      sub="Last 12 months"
      value={data.daysInWindow}
      note={
        data.daysInWindow === 0
          ? "No sickness recorded in the last 12 months"
          : `Across ${data.peopleInWindow} ${data.peopleInWindow === 1 ? "employee" : "employees"}`
      }
      href={LEAVE_HREF}
      link="View leave"
    />
  );
}

export function AbsenceRateTile() {
  const { data, loading } = useSickness();
  if (loading || !data) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <KpiTile
      label="Absence rate"
      sub="Rolling 12 months"
      value={`${data.absenceRate}%`}
      note="Share of available working days"
      href={LEAVE_HREF}
      link="View leave"
    />
  );
}

export function AverageSpellTile() {
  const { data, loading } = useSickness();
  if (loading || !data) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <KpiTile
      label="Average spell"
      sub="Per absence, last 12 months"
      value={`${data.averageSpell} days`}
      note="Length of a typical sickness absence"
      href={LEAVE_HREF}
      link="View leave"
    />
  );
}

/**
 * Open Occupational Health cases. Counted from the referral log rather than
 * from absence, because a case stays open after the employee is back — through
 * adjustments and the return-to-work interview.
 */
export function OhCasesTile() {
  const open = OH_REFERRALS.filter((r) => r.status !== "closed");
  const referred = open.filter((r) => r.referralDate).length;

  return (
    <KpiTile
      label="OH cases"
      sub="Open referrals"
      value={open.length}
      note={
        open.length === 0
          ? "No open occupational health cases"
          : `${referred} referred to a clinician`
      }
      href={OH_HREF}
      link="View OH"
    />
  );
}

export function SicknessTrendTile() {
  const { data, loading } = useSickness();
  if (loading || !data) return <Skeleton className="h-52 w-full rounded-xl" />;

  const total = data.trend.reduce((sum, m) => sum + m.value, 0);

  return (
    <Tile>
      <TileLabel>Sickness trend</TileLabel>
      <TileSub>
        {data.trend.length > 0
          ? `Days lost · last ${data.trend.length} months`
          : "Days lost"}
      </TileSub>

      {data.trend.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No sickness recorded yet.
        </p>
      ) : (
        <>
          <MiniBars
            ariaLabel="Sick days lost by month"
            items={data.trend.map((m) => ({ label: m.month, value: m.value }))}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            {total} days lost over the period
          </p>
        </>
      )}

      <TileLink href={LEAVE_HREF}>View leave</TileLink>
    </Tile>
  );
}

/** How many categories the reason tile lists before folding the rest into "Other". */
const REASON_LIMIT = 6;

export function SicknessByReasonTile() {
  const { data, loading } = useSickness();
  if (loading || !data) return <Skeleton className="h-52 w-full rounded-xl" />;

  const top = data.byReason.slice(0, REASON_LIMIT);
  const rest = data.byReason.slice(REASON_LIMIT);
  const items =
    rest.length > 0
      ? [
          ...top,
          {
            label: "Other reasons",
            value: rest.reduce((sum, r) => sum + r.value, 0),
          },
        ]
      : top;

  return (
    <Tile>
      <TileLabel>By reason</TileLabel>
      {/* The clinical grouping, not the free-text note — and HR-only detail,
          which is why it lives here rather than on a manager-facing screen. */}
      <TileSub>Days lost by clinical category · last 12 months</TileSub>

      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No sickness recorded yet.
        </p>
      ) : (
        <HBars items={items} fill />
      )}

      <TileLink href={LEAVE_HREF}>View leave</TileLink>
    </Tile>
  );
}

/** Rows shown before the tile defers to the module. */
const VISIBLE_ROWS = 5;

export function OhFitnessTile() {
  const open = OH_REFERRALS.filter((r) => r.status !== "closed");

  const counts = new Map<string, number>();
  for (const r of open) {
    counts.set(r.fitnessStatus, (counts.get(r.fitnessStatus) ?? 0) + 1);
  }
  const items = Array.from(counts.entries())
    .map(([status, value]) => ({
      label: OH_FITNESS_LABELS[status as keyof typeof OH_FITNESS_LABELS] ?? status,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Tile>
      <TileLabel>Fitness for work</TileLabel>
      {/* OH reports fitness and adjustments only — never a diagnosis. */}
      <TileSub>Open OH cases</TileSub>

      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No open occupational health cases.
        </p>
      ) : (
        <HBars items={items} fill />
      )}

      <TileLink href={OH_HREF}>View OH</TileLink>
    </Tile>
  );
}

/** Who is carrying the most absence — the return-to-work conversation list. */
export function TopAbsenteesTile() {
  const { data, loading } = useSickness();
  if (loading || !data) return <Skeleton className="h-64 w-full rounded-xl" />;

  const rows = data.topAbsentees.slice(0, VISIBLE_ROWS);

  return (
    <Tile>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TileLabel className="text-base">Highest sickness absence</TileLabel>
        <p className="text-xs text-muted-foreground">
          {data.topAbsentees.length}{" "}
          {data.topAbsentees.length === 1 ? "employee" : "employees"} with
          sickness in the last 12 months
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No sickness absence on record.
        </p>
      ) : (
        <>
          <ul className="mt-1">
            {rows.map((row) => (
              <li
                key={row.employeeId}
                className="flex items-center gap-3 border-t border-border py-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-primary">
                  {row.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.department} · {row.spells}{" "}
                    {row.spells === 1 ? "spell" : "spells"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-amber-600 tabular-nums dark:text-amber-500">
                  {row.days} days
                </span>
              </li>
            ))}
          </ul>
          <TileLink href={OH_HREF}>View occupational health</TileLink>
        </>
      )}
    </Tile>
  );
}
