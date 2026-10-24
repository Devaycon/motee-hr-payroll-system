"use client";

import { useEffect, useRef } from "react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/src/lib/utils";
import { byTime, metaFor, onDay, toMinutes, type CalItem } from "./model";
import { isoDay, type Shift } from "./use-calendar-data";

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_PX = 52;

interface Placed {
  item: CalItem;
  top: number;
  height: number;
  lane: number;
  lanes: number;
}

/** Side-by-side lanes for overlapping timed events. */
function place(items: CalItem[]): Placed[] {
  const timed = items
    .map((item) => {
      const s = toMinutes(item.startTime) ?? START_HOUR * 60;
      const e = Math.max(s + 30, toMinutes(item.endTime) ?? s + 60);
      return { item, s, e };
    })
    .sort((a, b) => a.s - b.s || b.e - a.e);
  const out: Placed[] = [];
  let cluster: typeof timed = [];
  let clusterEnd = -1;
  const flush = () => {
    const laneEnds: number[] = [];
    const assigned = cluster.map((t) => {
      let lane = laneEnds.findIndex((end) => end <= t.s);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(t.e);
      } else laneEnds[lane] = t.e;
      return { t, lane };
    });
    for (const { t, lane } of assigned) {
      const clampS = Math.max(t.s, START_HOUR * 60);
      const clampE = Math.min(t.e, END_HOUR * 60);
      out.push({
        item: t.item,
        top: ((clampS - START_HOUR * 60) / 60) * HOUR_PX,
        height: Math.max(20, ((clampE - clampS) / 60) * HOUR_PX - 2),
        lane,
        lanes: laneEnds.length,
      });
    }
    cluster = [];
  };
  for (const t of timed) {
    if (cluster.length && t.s >= clusterEnd) flush();
    cluster.push(t);
    clusterEnd = Math.max(clusterEnd, t.e);
  }
  if (cluster.length) flush();
  return out;
}

export function TimeGrid({
  days,
  items,
  shiftOn,
  onOpenItem,
  onOpenDay,
  onCreateAt,
}: {
  days: Date[];
  items: CalItem[];
  shiftOn: (d: Date) => Shift | null;
  onOpenItem: (item: CalItem) => void;
  onOpenDay: (d: Date) => void;
  onCreateAt: (d: Date, time: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const today = new Date();
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const cols = `56px repeat(${days.length}, minmax(0, 1fr))`;

  // Open on the working morning rather than at 6am.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = (8 - START_HOUR) * HOUR_PX - 8;
  }, []);

  const nowMin = today.getHours() * 60 + today.getMinutes();
  const allDayByDay = days.map((d) => items.filter((i) => i.allDay && onDay(i, isoDay(d))).sort(byTime));
  const maxAllDay = Math.max(0, ...allDayByDay.map((x) => x.length));

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Day headers */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: cols }}>
        <div />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <button key={d.toISOString()} type="button" onClick={() => onOpenDay(d)} className="flex flex-col items-center gap-0.5 py-2 hover:bg-muted">
              <span className={cn("text-[11px] font-semibold uppercase tracking-wide", isToday ? "text-primary" : "text-muted-foreground")}>{format(d, "EEE")}</span>
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-full text-lg tabular-nums", isToday && "bg-primary font-semibold text-primary-foreground")}>{format(d, "d")}</span>
            </button>
          );
        })}
      </div>

      {/* All-day lane */}
      {maxAllDay > 0 && (
        <div className="grid max-h-28 shrink-0 overflow-y-auto border-b border-border bg-muted" style={{ gridTemplateColumns: cols }}>
          <div className="flex items-start justify-end pr-2 pt-1.5 text-[10px] text-muted-foreground">All day</div>
          {allDayByDay.map((list, i) => (
            <div key={i} className="space-y-0.5 border-l border-border/70 p-1">
              {list.map((it) => (
                <button key={it.id} type="button" onClick={() => onOpenItem(it)} className={cn("block w-full truncate rounded border px-1.5 py-0.5 text-left text-[11px]", metaFor(it.category).chip)} title={it.title}>
                  {it.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Hours */}
      <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: cols, height: hours.length * HOUR_PX }}>
          <div className="relative">
            {hours.map((h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground" style={{ top: (h - START_HOUR) * HOUR_PX }}>
                {h === START_HOUR ? "" : `${String(h).padStart(2, "0")}:00`}
              </span>
            ))}
          </div>
          {days.map((d) => {
            const iso = isoDay(d);
            const shift = shiftOn(d);
            const s = toMinutes(shift?.start);
            const e = toMinutes(shift?.end);
            const placed = place(items.filter((i) => !i.allDay && onDay(i, iso)));
            return (
              <div key={iso} className="relative border-l border-border/70">
                {/* Off-hours shading — working hours stay white */}
                <div className="absolute inset-0 bg-muted" />
                {s != null && e != null && (
                  <div
                    className="absolute inset-x-0 bg-card"
                    style={{ top: ((s - START_HOUR * 60) / 60) * HOUR_PX, height: ((e - s) / 60) * HOUR_PX }}
                    title={`Working hours ${shift!.start}–${shift!.end}`}
                  />
                )}
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    aria-label={`Create at ${h}:00 on ${format(d, "d MMMM")}`}
                    onClick={() => onCreateAt(d, `${String(h).padStart(2, "0")}:00`)}
                    className="absolute inset-x-0 border-t border-border/50 hover:bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))]"
                    style={{ top: (h - START_HOUR) * HOUR_PX, height: HOUR_PX }}
                  />
                ))}
                {placed.map((p) => {
                  const meta = metaFor(p.item.category);
                  return (
                    <button
                      key={p.item.id}
                      type="button"
                      onClick={() => onOpenItem(p.item)}
                      className={cn("absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md", meta.chip)}
                      style={{
                        top: p.top + 1,
                        height: p.height,
                        left: `calc(${(p.lane / p.lanes) * 100}% + 2px)`,
                        width: `calc(${100 / p.lanes}% - 4px)`,
                      }}
                      title={p.item.title}
                    >
                      <span className="block truncate font-semibold">{p.item.title}</span>
                      {p.height > 30 && <span className="block truncate opacity-80">{p.item.startTime}{p.item.endTime ? ` – ${p.item.endTime}` : ""}</span>}
                    </button>
                  );
                })}
                {isSameDay(d, today) && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60 && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: ((nowMin - START_HOUR * 60) / 60) * HOUR_PX }}>
                    <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="h-0.5 flex-1 bg-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
