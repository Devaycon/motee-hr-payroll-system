"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";

interface UpcomingEvent {
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

function useUpcomingEvents() {
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#7F77DD]" />
          <CardTitle className="text-base">Upcoming Events (Next 7 Days)</CardTitle>
        </div>
        <Link
          href="/hr-action-center/events"
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline shrink-0"
        >
          View calendar
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <p className="text-sm font-semibold text-foreground">
              No Upcoming Events
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You don&apos;t have any scheduled HR activities, meetings, or
              deadlines in the next 7 days.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80 pr-2">
            <div className="flex flex-col gap-2">
              {data.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center size-10 shrink-0 rounded-md bg-muted">
                    <span className="text-sm font-bold text-foreground leading-none">
                      {new Date(`${e.date}T00:00:00`).getDate()}
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {new Date(`${e.date}T00:00:00`).toLocaleDateString("en-GB", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {e.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(e.date)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] capitalize",
                        TYPE_STYLES[e.type] ??
                          "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {e.type}
                    </Badge>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {relativeLabel(e.daysUntil)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
