"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  Monitor,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import type { Interview, InterviewMode } from "@/src/lib/types/recruitment";
import { cn } from "@/src/lib/utils";
import {
  googleCalUrl,
  icsDataUrl,
  outlookCalUrl,
  interviewTitle,
} from "../components/calendar-links";

const MODE_ICON: Record<InterviewMode, typeof Monitor> = {
  video: Monitor,
  phone: Phone,
  onsite: MapPin,
};

const STATUS_STYLES: Record<Interview["status"], string> = {
  scheduled:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function endOf(iv: Interview): number {
  return new Date(iv.scheduledAt).getTime() + iv.durationMins * 60_000;
}

/**
 * Interviews where a panellist is double-booked.
 *
 * Two interviews can be scheduled into the same slot with the same panel and
 * nothing anywhere says so — the clash only surfaces when somebody fails to
 * turn up. This flags the overlap at the point the schedule is read.
 */
function findConflicts(interviews: Interview[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  const live = interviews.filter((iv) => iv.status === "scheduled");
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      const startA = new Date(a.scheduledAt).getTime();
      const startB = new Date(b.scheduledAt).getTime();
      if (Number.isNaN(startA) || Number.isNaN(startB)) continue;
      const overlaps = startA < endOf(b) && startB < endOf(a);
      if (!overlaps) continue;
      const shared = a.panel.filter((p) => b.panel.includes(p));
      if (shared.length === 0) continue;
      const names = shared.map(
        (id) => a.panelNames[a.panel.indexOf(id)] ?? id,
      );
      conflicts.set(a.id, [...(conflicts.get(a.id) ?? []), ...names]);
      conflicts.set(b.id, [...(conflicts.get(b.id) ?? []), ...names]);
    }
  }
  return conflicts;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unscheduled";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/**
 * §7.21 — the requisition's interviews as an agenda.
 *
 * Interviews existed on the model and were created by the advance dialog, but
 * the only place to see one was inside a single candidate's drawer — so there
 * was no way to look at a week and see what was booked.
 */
export function InterviewSchedule({ interviews }: { interviews: Interview[] }) {
  const conflicts = useMemo(() => findConflicts(interviews), [interviews]);

  const days = useMemo(() => {
    const sorted = [...interviews].sort((a, b) =>
      a.scheduledAt.localeCompare(b.scheduledAt),
    );
    const groups = new Map<string, Interview[]>();
    for (const iv of sorted) {
      const key = iv.scheduledAt.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), iv]);
    }
    return [...groups.entries()];
  }, [interviews]);

  if (interviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <CalendarDays className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          No interviews scheduled
        </p>
        <p className="text-xs text-muted-foreground">
          Advance an applicant from the Applicant tab to book one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {conflicts.size > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {conflicts.size} interview(s) have a panellist booked in two places
            at once.
          </span>
        </div>
      )}

      {days.map(([day, items]) => (
        <div key={day} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            {dayLabel(items[0].scheduledAt)}
          </p>
          {items.map((iv) => {
            const Icon = MODE_ICON[iv.mode];
            const clash = conflicts.get(iv.id);
            return (
              <Card key={iv.id} className="border-border/60">
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
                  <div className="w-20 shrink-0">
                    <p className="text-sm font-medium text-foreground">
                      {timeLabel(iv.scheduledAt)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {iv.durationMins} min
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {iv.candidateName}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{iv.round}</span>
                      <span className="inline-flex items-center gap-1 capitalize">
                        <Icon className="h-3 w-3" /> {iv.mode}
                      </span>
                      {iv.panelNames.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {iv.panelNames.join(", ")}
                        </span>
                      )}
                      {iv.location && <span>· {iv.location}</span>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {clash && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      >
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {[...new Set(clash)].join(", ")} double-booked
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] capitalize", STATUS_STYLES[iv.status])}
                    >
                      {iv.status}
                    </Badge>
                    {iv.status === "scheduled" && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px]" asChild>
                          <a href={googleCalUrl(iv)} target="_blank" rel="noreferrer">
                            Google
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px]" asChild>
                          <a href={outlookCalUrl(iv)} target="_blank" rel="noreferrer">
                            Outlook
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px]" asChild>
                          <a
                            href={icsDataUrl(iv)}
                            download={`${interviewTitle(iv)}.ics`}
                          >
                            <Download className="h-3 w-3" /> .ics
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
