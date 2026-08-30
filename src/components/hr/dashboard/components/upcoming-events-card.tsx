"use client";

import Link from "next/link";
import {
  AlarmClock,
  Bell,
  Cake,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  PartyPopper,
  Plane,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Tile, TileLabel } from "./tiles";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  daysUntil: number;
}

interface RawEvent {
  id?: string;
  title?: string;
  type?: string;
  start?: string;
  date?: string;
  location?: string;
}

const TYPE_STYLES: Record<string, string> = {
  birthday: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
  anniversary: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  holiday: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  deadline: "border-orange-500/30 bg-orange-500/10 text-orange-600",
  reminder: "border-sky-500/30 bg-sky-500/10 text-sky-600",
  training: "border-teal-500/30 bg-teal-500/10 text-teal-600",
  meeting: "border-[#7F77DD]/30 bg-[#7F77DD]/10 text-[#7F77DD]",
};

/**
 * An icon per event type so the list can be scanned rather than read (client
 * feedback). Lucide rather than emoji — the rest of the app has no emoji, and
 * they render inconsistently across platforms.
 */
const TYPE_ICONS: Record<string, LucideIcon> = {
  birthday: Cake,
  anniversary: PartyPopper,
  holiday: Plane,
  leave: Plane,
  deadline: AlarmClock,
  reminder: Bell,
  training: GraduationCap,
  meeting: CalendarDays,
};

/** Icon-only colour (no border/background) pulled from the badge tone. */
const TYPE_ICON_COLORS: Record<string, string> = {
  birthday: "text-pink-600 dark:text-pink-400",
  anniversary: "text-amber-600 dark:text-amber-400",
  holiday: "text-rose-600",
  leave: "text-rose-600",
  deadline: "text-orange-600",
  reminder: "text-sky-600",
  training: "text-teal-600",
  meeting: "text-[#7F77DD]",
};

/**
 * The badge tones above as hex, for the summary donut on the Events tab —
 * ApexCharts can't resolve Tailwind classes, and a type must be the same colour
 * in the donut as on the row beneath it.
 *
 * The order is the assignment order and is fixed: it was validated for
 * colour-vision separation as an adjacent sequence, so slices stay
 * distinguishable however many types are present.
 */
export const EVENT_TYPE_ORDER = [
  "meeting",
  "birthday",
  "anniversary",
  "reminder",
  "deadline",
  "training",
  "holiday",
  "leave",
] as const;

export const EVENT_TYPE_HEX: Record<string, string> = {
  meeting: "#7F77DD",
  birthday: "#ec4899",
  anniversary: "#f59e0b",
  reminder: "#3b82f6",
  deadline: "#ff8b2d",
  training: "#14b8a6",
  holiday: "#f43f5e",
  leave: "#f43f5e",
};

function relativeLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/** Days until the next occurrence of a month-day (MM-DD) relative to ref. */
function daysUntilAnnual(monthDay: string, ref: Date): number | null {
  const [, mm, dd] = monthDay.split("-").map((n) => Number(n));
  if (!mm || !dd) return null;
  let next = new Date(ref.getFullYear(), mm - 1, dd);
  if (next.getTime() < ref.getTime()) {
    next = new Date(ref.getFullYear() + 1, mm - 1, dd);
  }
  return Math.round((next.getTime() - ref.getTime()) / 86_400_000);
}

export function useUpcomingEvents() {
  return useLocaleSection<UpcomingEvent[]>((bundle) => {
    const refIso =
      bundle._meta.referenceDate ?? new Date().toISOString().slice(0, 10);
    const ref = new Date(`${refIso}T00:00:00`);

    const calendarEvents = ((bundle.events ?? []) as RawEvent[])
      .map((raw, i) => {
        const date = (raw.start ?? raw.date ?? "").slice(0, 10);
        return {
          id: raw.id ?? `ev-${i + 1}`,
          title: raw.title ?? "Event",
          date,
          type: raw.type ?? "meeting",
        };
      })
      .filter((e) => e.date)
      .map((e) => {
        const d = new Date(`${e.date}T00:00:00`);
        const daysUntil = Math.round(
          (d.getTime() - ref.getTime()) / 86_400_000,
        );
        return { ...e, daysUntil };
      });

    // Birthdays & work anniversaries are recurring annual events — derive the
    // next occurrence within the window from the employee roster.
    const peopleEvents: UpcomingEvent[] = [];
    for (const emp of bundle.employees) {
      if (emp.dateOfBirth) {
        const days = daysUntilAnnual(emp.dateOfBirth.slice(5), ref);
        if (days !== null) {
          peopleEvents.push({
            id: `bday-${emp.id}`,
            title: `${emp.fullName}'s birthday`,
            date: new Date(ref.getTime() + days * 86_400_000)
              .toISOString()
              .slice(0, 10),
            type: "birthday",
            daysUntil: days,
          });
        }
      }
      if (emp.startDate) {
        const days = daysUntilAnnual(emp.startDate.slice(5), ref);
        if (days !== null) {
          peopleEvents.push({
            id: `anniv-${emp.id}`,
            title: `${emp.fullName}'s work anniversary`,
            date: new Date(ref.getTime() + days * 86_400_000)
              .toISOString()
              .slice(0, 10),
            type: "anniversary",
            daysUntil: days,
          });
        }
      }
    }

    return [...calendarEvents, ...peopleEvents]
      .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  });
}

export function UpcomingEventsCard() {
  const { data, loading } = useUpcomingEvents();

  if (loading || !data) {
    return <Skeleton className="h-80 w-full rounded-xl" />;
  }

  return (
    <Tile>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TileLabel className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-[#7F77DD]" aria-hidden />
          Upcoming Events (Next 7 Days)
        </TileLabel>
        <Link
          href="/hr-action-center/events"
          className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          View calendar
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            No Upcoming Events
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have any scheduled HR activities, meetings, or
            deadlines in the next 7 days.
          </p>
        </div>
      ) : (
        <ScrollArea className="mt-1 max-h-80 pr-2">
          <ul>
            {data.map((e) => {
              const Icon = TYPE_ICONS[e.type] ?? CalendarDays;
              const iconColor =
                TYPE_ICON_COLORS[e.type] ?? "text-muted-foreground";
              const day = new Date(`${e.date}T00:00:00`);
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 border-t border-border py-2.5"
                >
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-md bg-muted">
                    <span className="text-sm font-bold leading-none text-foreground">
                      {day.getDate()}
                    </span>
                    <span className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                      {day.toLocaleDateString("en-GB", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {e.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1 text-[10px] capitalize",
                        TYPE_STYLES[e.type] ??
                          "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className={cn("size-3", iconColor)} aria-hidden />
                      {e.type}
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {relativeLabel(e.daysUntil)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </Tile>
  );
}
