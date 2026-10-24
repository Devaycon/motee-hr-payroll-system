"use client";

import { format, isSameDay } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { byTime, metaFor, onDay, timeLabel, type CalItem } from "./model";
import { isoDay } from "./use-calendar-data";

/** A scrollable list of what's coming up, grouped by day. */
export function AgendaView({ days, items, onOpenItem }: { days: Date[]; items: CalItem[]; onOpenItem: (i: CalItem) => void }) {
  const today = new Date();
  const groups = days
    .map((d) => ({ d, list: items.filter((i) => onDay(i, isoDay(d))).sort(byTime) }))
    .filter((g) => g.list.length > 0);

  if (groups.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
        <CalendarX2 className="h-8 w-8" />
        Nothing scheduled in this period.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto rounded-xl border border-border bg-card">
      {groups.map(({ d, list }) => (
        <div key={d.toISOString()} className="grid grid-cols-[96px_1fr] border-b border-border/70 last:border-0 sm:grid-cols-[140px_1fr]">
          <div className="border-r border-border/70 px-4 py-3">
            <div className={cn("text-2xl font-semibold tabular-nums", isSameDay(d, today) && "text-primary")}>{format(d, "d")}</div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{format(d, "EEE, MMM")}</div>
          </div>
          <ul className="divide-y divide-border/50">
            {list.map((it) => (
              <li key={it.id}>
                <button type="button" onClick={() => onOpenItem(it)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", metaFor(it.category).swatch)} />
                  <span className="w-28 shrink-0 text-xs tabular-nums text-muted-foreground">{timeLabel(it)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{it.title}</span>
                    {(it.personName || it.description) && (
                      <span className="block truncate text-xs text-muted-foreground">{it.personName ?? it.description}</span>
                    )}
                  </span>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{metaFor(it.category).label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
