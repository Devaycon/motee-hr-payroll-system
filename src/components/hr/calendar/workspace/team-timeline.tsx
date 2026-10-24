"use client";

import { useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { ArrowDownAZ, Search } from "lucide-react";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { cn } from "@/src/lib/utils";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { metaFor, onDay, type CalItem } from "./model";
import { HATCH_STYLE, isoDay, shiftFor } from "./use-calendar-data";

interface Bar {
  item: CalItem;
  from: number;
  to: number;
  row: number;
}

/** Contiguous bars per person, stacked into rows where they overlap. */
function barsFor(items: CalItem[], days: string[]): { bars: Bar[]; rows: number } {
  const bars: Bar[] = [];
  const rowEnds: number[] = [];
  const spans = items
    .map((item) => {
      const idx = days.map((d, i) => (onDay(item, d) ? i : -1)).filter((i) => i >= 0);
      return idx.length ? { item, from: idx[0], to: idx[idx.length - 1] } : null;
    })
    .filter((x): x is { item: CalItem; from: number; to: number } => !!x)
    .sort((a, b) => a.from - b.from);
  for (const s of spans) {
    let row = rowEnds.findIndex((end) => end < s.from);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(s.to);
    } else rowEnds[row] = s.to;
    bars.push({ ...s, row });
  }
  return { bars, rows: Math.max(1, rowEnds.length) };
}

/**
 * Team view — people down the side, days across, absences as bars. Opens on
 * who is out today, the question managers come here to answer.
 */
export function TeamTimeline({
  title,
  members,
  days,
  itemsFor,
  onOpenItem,
  onOpenPerson,
}: {
  title: string;
  members: LocaleEmployee[];
  days: Date[];
  itemsFor: (personId: string) => CalItem[];
  onOpenItem: (i: CalItem) => void;
  onOpenPerson: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [asc, setAsc] = useState(true);
  const isoDays = useMemo(() => days.map(isoDay), [days]);
  const todayIso = isoDay(new Date());
  const dense = days.length > 14;
  const colW = dense ? 34 : days.length > 7 ? 64 : 120;

  const rows = useMemo(
    () =>
      members
        .filter((m) => !q.trim() || `${m.fullName} ${m.jobTitle}`.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => (asc ? 1 : -1) * a.fullName.localeCompare(b.fullName))
        .map((m) => ({ m, items: itemsFor(m.id), ...barsFor(itemsFor(m.id), isoDays) })),
    [members, q, asc, itemsFor, isoDays],
  );

  const outToday = rows.filter((r) => r.items.some((i) => onDay(i, todayIso) && i.layer === "schedule" && i.category !== "personal" && i.category !== "cover"));

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{members.length} people</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Out today</span>
          <span className="text-lg font-semibold tabular-nums">{outToday.length}</span>
          <div className="flex -space-x-2">
            {outToday.slice(0, 6).map(({ m }) => (
              <PersonAvatar key={m.id} name={m.fullName} initials={m.initials} gender={m.gender} className="size-7 ring-2 ring-card" fallbackClassName="text-[9px]" />
            ))}
          </div>
        </div>
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter people" className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-2 text-xs outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
        <div style={{ minWidth: 220 + days.length * colW }}>
          {/* Header */}
          <div className="sticky top-0 z-20 flex border-b border-border bg-muted">
            <button type="button" onClick={() => setAsc((a) => !a)} className="sticky left-0 z-10 flex w-[220px] shrink-0 items-center gap-1.5 border-r border-border bg-muted px-3 text-xs font-medium text-muted-foreground">
              <ArrowDownAZ className="h-3.5 w-3.5" /> Name
            </button>
            {days.map((d) => {
              const isToday = isSameDay(d, new Date());
              const weekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={d.toISOString()} className={cn("shrink-0 border-r border-border/60 py-1.5 text-center", weekend && "text-muted-foreground", isToday && "bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))] text-primary")} style={{ width: colW }}>
                  <div className="text-[10px] font-medium uppercase">{dense ? format(d, "EEEEE") : format(d, "EEE")}</div>
                  <div className="text-sm font-semibold tabular-nums">{format(d, "d")}</div>
                </div>
              );
            })}
          </div>

          {rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">No one to show.</p>}

          {rows.map(({ m, bars, rows: lanes }) => {
            const laneH = 26;
            const h = Math.max(48, lanes * laneH + 14);
            return (
              <div key={m.id} className="flex border-b border-border/60 last:border-0">
                <button type="button" onClick={() => onOpenPerson(m.id)} className="sticky left-0 z-10 flex w-[220px] shrink-0 items-center gap-2 border-r border-border bg-card px-3 text-left hover:bg-muted" style={{ height: h }} title={`Open ${m.fullName}'s schedule`}>
                  <PersonAvatar name={m.fullName} initials={m.initials} gender={m.gender} className="size-7" fallbackClassName="text-[10px]" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{m.fullName}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">{m.jobTitle}</span>
                  </span>
                </button>
                <div className="relative flex" style={{ height: h }}>
                  {days.map((d) => {
                    const working = !!shiftFor(m.workPattern, d);
                    return (
                      <div
                        key={d.toISOString()}
                        className={cn("shrink-0 border-r border-border/40", !working && "bg-muted text-muted-foreground", isSameDay(d, new Date()) && "bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))]")}
                        style={{ width: colW, ...(working ? {} : HATCH_STYLE) }}
                      />
                    );
                  })}
                  {bars.map((b) => (
                    <button
                      key={b.item.id}
                      type="button"
                      onClick={() => onOpenItem(b.item)}
                      className={cn("absolute flex items-center truncate rounded-md border px-2 text-left text-[11px] font-medium shadow-sm hover:brightness-95", metaFor(b.item.category).chip)}
                      style={{ left: b.from * colW + 3, width: (b.to - b.from + 1) * colW - 6, top: 7 + b.row * laneH, height: laneH - 4 }}
                      title={`${b.item.title} · ${b.item.date}${b.item.endDate && b.item.endDate !== b.item.date ? ` → ${b.item.endDate}` : ""}`}
                    >
                      {!dense || b.to - b.from >= 2 ? b.item.title : ""}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
