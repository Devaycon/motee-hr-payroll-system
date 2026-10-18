"use client";

import { format, isSameDay, isSameMonth } from "date-fns";
import { Plus } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { byTime, metaFor, onDay, type CalItem } from "./model";
import { isoDay, type Shift } from "./use-calendar-data";

const MAX_VISIBLE = 3;

export function MonthView({
  days,
  month,
  items,
  shiftOn,
  onOpenItem,
  onOpenDay,
  onCreateOn,
}: {
  days: Date[];
  month: Date;
  items: CalItem[];
  shiftOn: (d: Date) => Shift | null;
  onOpenItem: (item: CalItem) => void;
  onOpenDay: (d: Date) => void;
  onCreateOn: (d: Date) => void;
}) {
  const today = new Date();
  const weeks = days.length / 7;
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 overflow-y-auto" style={{ gridTemplateRows: `repeat(${weeks}, minmax(110px, 1fr))` }}>
        {days.map((d) => {
          const iso = isoDay(d);
          const dayItems = items.filter((i) => onDay(i, iso)).sort(byTime);
          const shift = shiftOn(d);
          const isToday = isSameDay(d, today);
          const extra = dayItems.length - MAX_VISIBLE;
          return (
            <div
              key={iso}
              className={cn(
                "group relative flex min-w-0 flex-col gap-0.5 border-b border-r border-border/70 p-1.5 [&:nth-child(7n)]:border-r-0",
                !isSameMonth(d, month) && "bg-muted",
                !shift && isSameMonth(d, month) && "bg-muted",
              )}
            >
              <div className="mb-0.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onOpenDay(d)}
                  className={cn(
                    "flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs tabular-nums hover:bg-muted",
                    !isSameMonth(d, month) && "text-muted-foreground/60",
                    isToday && "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                  )}
                  aria-label={`Open ${format(d, "EEEE d MMMM")}`}
                >
                  {format(d, "d")}
                </button>
                <button
                  type="button"
                  onClick={() => onCreateOn(d)}
                  className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                  aria-label={`Create on ${format(d, "d MMMM")}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {dayItems.slice(0, MAX_VISIBLE).map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onOpenItem(it)}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] leading-4 transition-opacity hover:opacity-80",
                    it.allDay ? cn("border", metaFor(it.category).chip) : "hover:bg-muted",
                  )}
                  title={it.title}
                >
                  {!it.allDay && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", metaFor(it.category).swatch)} />}
                  {!it.allDay && it.startTime && <span className="shrink-0 tabular-nums text-muted-foreground">{it.startTime}</span>}
                  <span className="truncate">{it.title}</span>
                </button>
              ))}
              {extra > 0 && (
                <button type="button" onClick={() => onOpenDay(d)} className="w-fit rounded px-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  +{extra} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
