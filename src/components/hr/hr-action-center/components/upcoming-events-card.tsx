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
// Shared with the dashboard: GET /calendar/upcoming signed in, the demo bundle signed out.
import { useUpcomingEvents } from "@/src/components/hr/dashboard/components/upcoming-events-card";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";

const TYPE_STYLES: Record<string, string> = {
  birthday: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
  anniversary: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  holiday: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  deadline: "border-orange-500/30 bg-orange-500/10 text-orange-600",
  reminder: "border-sky-500/30 bg-sky-500/10 text-sky-600",
  training: "border-teal-500/30 bg-teal-500/10 text-teal-600",
  meeting: "border-[#7F77DD]/30 bg-[#7F77DD]/10 text-[#7F77DD]",
  starter: "border-lime-500/30 bg-lime-500/10 text-lime-700 dark:text-lime-400",
  leaver: "border-stone-500/30 bg-stone-500/10 text-stone-600 dark:text-stone-400",
};

function relativeLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
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
