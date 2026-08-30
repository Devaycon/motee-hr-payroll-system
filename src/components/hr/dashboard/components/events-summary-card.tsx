"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Tile,
  TileLabel,
  TileSub,
  TileNum,
  MiniPie,
  PieLegend,
  TileLink,
  type PieSlice,
} from "./tiles";
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

export function EventsThisWeekTile() {
  const { data, loading } = useUpcomingEvents();

  if (loading || !data) {
    return <Skeleton className="h-36 w-full rounded-xl" />;
  }

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
      <TileLink href="/hr-action-center/events">View calendar</TileLink>
    </Tile>
  );
}

export function EventsByTypeTile() {
  const { data, loading } = useUpcomingEvents();

  if (loading || !data) {
    return <Skeleton className="h-36 w-full rounded-xl" />;
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
  const slices: PieSlice[] = [...known, ...unknown].map((t) => ({
    label: titleCase(t),
    value: counts.get(t) ?? 0,
    color: EVENT_TYPE_HEX[t] ?? "#64748b",
  }));

  return (
    <Tile>
      <TileLabel>By type</TileLabel>
      <TileSub>Next 7 days</TileSub>
      {slices.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No events to break down this week.
        </p>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <MiniPie slices={slices} size={52} />
          <PieLegend slices={slices} />
        </div>
      )}
      <TileLink href="/hr-action-center/events">View calendar</TileLink>
    </Tile>
  );
}
