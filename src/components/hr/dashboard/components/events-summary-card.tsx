"use client";

import { ResponsiveBar } from "@nivo/bar";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tile, TileLabel, TileSub, TileNum, TileLink, MiniBars } from "./tiles";
import { ChartCard, HeroRingCard, NIVO_THEME } from "@/src/components/shared/charts";
import {
  useUpcomingEvents,
  EVENT_TYPE_HEX,
  EVENT_TYPE_ORDER,
} from "./upcoming-events-card";

/**
 * The Events tab's headline: how much is coming up, and what kind of thing it
 * is. The count is one number, so it stays a stat tile; the mix is a
 * part-to-whole across a handful of types, so it gets a small dial with its own
 * labelled list beside it.
 *
 * Slice colours come from the same map the event rows use, so a type reads the
 * same in both places.
 */
function titleCase(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/** Inclusive of day 7 — matches `useUpcomingEvents`' own `daysUntil <= 7` window. */
const DAY_WINDOW = 7;

function dayLabel(daysUntil: number) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tmrw";
  return `+${daysUntil}d`;
}

export function EventsThisWeekTile() {
  const { data, loading } = useUpcomingEvents();

  if (loading || !data) {
    return <Skeleton className="h-36 w-full rounded-xl" />;
  }

  const byDay = new Map<number, number>();
  for (const e of data) {
    byDay.set(e.daysUntil, (byDay.get(e.daysUntil) ?? 0) + 1);
  }
  const dayItems = Array.from({ length: DAY_WINDOW + 1 }, (_, day) => ({
    label: dayLabel(day),
    value: byDay.get(day) ?? 0,
  }));

  return (
    <Tile>
      <TileLabel>This week</TileLabel>
      <TileSub>Upcoming events</TileSub>
      <TileNum>{data.length}</TileNum>
      <p className="mt-1 text-xs text-muted-foreground">
        {data.length === 0
          ? "Nothing scheduled in the next 7 days"
          : "Across the next 7 days"}
      </p>
      {/* Fills the space a bare count otherwise left empty in this tile,
          without growing the tile past its "Events by Type" row-mate. */}
      {data.length > 0 && (
        <div className="mt-3">
          <TileSub className="mb-1">By day</TileSub>
          <MiniBars
            ariaLabel="Upcoming events by day, next 7 days"
            items={dayItems}
            height={104}
            highlight="nonzero"
          />
        </div>
      )}
      <TileLink href="/hr-action-center/events">View calendar</TileLink>
    </Tile>
  );
}

export function EventsByTypeTile() {
  const { data, loading } = useUpcomingEvents();

  if (loading || !data) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  const counts = new Map<string, number>();
  for (const e of data) {
    counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  }

  // Emit in the fixed order so a type keeps its hue as the week's mix changes.
  const known = EVENT_TYPE_ORDER.filter((t) => counts.has(t));
  const unknown = [...counts.keys()].filter(
    (t) => !EVENT_TYPE_ORDER.includes(t as (typeof EVENT_TYPE_ORDER)[number]),
  );
  const slices = [...known, ...unknown].map((t) => ({
    label: titleCase(t),
    value: counts.get(t) ?? 0,
    color: EVENT_TYPE_HEX[t] ?? "#64748b",
  }));

  if (slices.length === 0) {
    return (
      <Tile>
        <TileLabel>By type</TileLabel>
        <TileSub>Next 7 days</TileSub>
        <p className="mt-3 text-xs text-muted-foreground">
          No events to break down this week.
        </p>
        <TileLink href="/hr-action-center/events">View calendar</TileLink>
      </Tile>
    );
  }

  return (
    <ChartCard
      title="Events by Type"
      description="Next 7 days"
      compact
      viewMoreHref="/hr-action-center/events"
      className="h-full"
    >
      <div style={{ height: Math.max(140, slices.length * 32) }}>
        <ResponsiveBar
          data={slices}
          keys={["value"]}
          indexBy="label"
          layout="horizontal"
          margin={{ top: 4, right: 20, bottom: 24, left: 90 }}
          padding={0.35}
          colors={(d) => d.data.color}
          borderRadius={3}
          axisTop={null}
          axisRight={null}
          axisBottom={{ tickSize: 0, tickPadding: 6 }}
          axisLeft={{ tickSize: 0, tickPadding: 8 }}
          enableGridY={false}
          enableLabel
          labelSkipWidth={20}
          labelTextColor="var(--card)"
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
    </ChartCard>
  );
}

/** The Events tab's hero card: the week's event mix, with the same rings/summary/ranked-breakdown pattern used across the dashboard. */
export function EventsHeroRing() {
  const { data, loading } = useUpcomingEvents();
  if (loading || !data) return <Skeleton className="h-64 w-full rounded-xl" />;

  const counts = new Map<string, number>();
  for (const e of data) {
    counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  }

  const known = EVENT_TYPE_ORDER.filter((t) => counts.has(t));
  const unknown = [...counts.keys()].filter(
    (t) => !EVENT_TYPE_ORDER.includes(t as (typeof EVENT_TYPE_ORDER)[number]),
  );
  const segments = [...known, ...unknown].map((t) => ({
    key: t,
    label: titleCase(t),
    value: counts.get(t) ?? 0,
    color: EVENT_TYPE_HEX[t] ?? "#64748b",
  }));

  if (segments.length === 0) return null;

  return (
    <HeroRingCard
      title="Upcoming Events by Type"
      description="What's on the calendar over the next 7 days"
      segments={segments}
      totalNoun="events"
    />
  );
}
