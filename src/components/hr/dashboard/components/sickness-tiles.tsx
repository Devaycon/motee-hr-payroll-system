"use client";

import Link from "next/link";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ChevronRight, CalendarClock } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { OH_REFERRALS } from "@/src/data/occupational-health-demo";
import { OH_FITNESS_LABELS } from "@/src/lib/types/occupational-health";
import { Tile, TileLabel, TileSub, TileNum, HBars } from "./tiles";
import { ChartCard, HeroRingCard, chartColor, NIVO_THEME } from "@/src/components/shared/charts";
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
  if (loading || !data) return <Skeleton className="h-56 w-full rounded-xl" />;

  if (data.trend.length === 0) {
    return (
      <ChartCard
        title="Sickness trend"
        description="Days lost"
        compact
        viewMoreHref={LEAVE_HREF}
        className="h-full"
      >
        <p className="text-xs text-muted-foreground">No sickness recorded yet.</p>
      </ChartCard>
    );
  }

  const total = data.trend.reduce((sum, m) => sum + m.value, 0);

  return (
    <ChartCard
      title="Sickness trend"
      description={`Last ${data.trend.length} months`}
      icon={CalendarClock}
      compact
      footer={`${total} days lost over the period`}
      viewMoreHref={LEAVE_HREF}
      className="h-full"
    >
      <div style={{ height: 140 }}>
        <ResponsiveBar
          data={data.trend.map((d) => ({ month: d.month, value: d.value }))}
          keys={["value"]}
          indexBy="month"
          margin={{ top: 8, right: 8, bottom: 24, left: 32 }}
          padding={0.4}
          colors={["#f43f5e"]}
          borderRadius={3}
          axisTop={null}
          axisRight={null}
          axisBottom={{ tickSize: 0, tickPadding: 6 }}
          axisLeft={{ tickSize: 0, tickPadding: 6, tickValues: 3 }}
          enableGridY
          enableLabel={false}
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
    </ChartCard>
  );
}

/** The Sickness tab's hero card: absence by clinical reason, with the same rings/summary/ranked-breakdown pattern used across the dashboard. */
export function SicknessHeroRing() {
  const { data, loading } = useSickness();
  if (loading || !data) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (data.byReason.length === 0) return null;

  const segments = data.byReason.map((r, i) => ({
    key: r.label,
    label: r.label,
    value: r.value,
    color: chartColor(i),
  }));

  return (
    <HeroRingCard
      title="Sickness Absence by Reason"
      description="Days lost by clinical category, last 12 months"
      segments={segments}
      totalNoun="sick days"
      variant="gauge"
    />
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

  if (items.length === 0) {
    // OH reports fitness and adjustments only — never a diagnosis.
    return (
      <ChartCard
        title="Fitness for work"
        description="Open OH cases"
        compact
        viewMoreHref={OH_HREF}
        className="h-full"
      >
        <p className="text-xs text-muted-foreground">
          No open occupational health cases.
        </p>
      </ChartCard>
    );
  }

  const pieData = items.map((item, i) => ({
    id: item.label,
    label: item.label,
    value: item.value,
    color: chartColor(i),
  }));

  return (
    <ChartCard
      title="Fitness for work"
      description="Open OH cases"
      compact
      viewMoreHref={OH_HREF}
      className="h-full"
    >
      <div style={{ height: 144 }}>
        <ResponsivePie
          data={pieData}
          margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
          innerRadius={0.55}
          padAngle={1.5}
          cornerRadius={3}
          colors={{ datum: "data.color" }}
          borderWidth={0}
          enableArcLinkLabels={false}
          arcLabelsTextColor="var(--card)"
          arcLabelsSkipAngle={18}
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
      {/* Wraps rather than a fixed-width nivo legend, so it never overflows the
          narrower widths this tile shares a row with. */}
      <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {pieData.map((slice) => (
          <span key={slice.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full" style={{ background: slice.color }} />
            {slice.label} ({slice.value})
          </span>
        ))}
      </div>
    </ChartCard>
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
