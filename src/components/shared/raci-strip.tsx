"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { cn } from "@/src/lib/utils";

/** The named parts anyone asks about when they ask "who owns this?". */
export type RaciSlot =
  | "Requester"
  | "Approver"
  | "Recruiter"
  | "Hiring Manager"
  | "HR Partner"
  | "Owner";

export interface RaciPerson {
  slot: RaciSlot;
  name: string;
  employeeId?: string;
  /** What they are doing right now, if it is worth saying. */
  note?: string;
}

interface RaciStripProps {
  people: RaciPerson[];
  /** Who the record is sitting with, and for how long. */
  waitingOn?: { name: string; days: number } | null;
  className?: string;
}

/** Past this, a record is not "in progress", it is stuck. */
const STALE_DAYS = 5;

/**
 * Who is on a record, shown on the record.
 *
 * Ownership was scattered: the approval chain lived on the Submissions screen,
 * the hiring team on the Requisition, and the current holder nowhere at all -
 * so answering "who has this?" meant leaving the thing you were looking at.
 */
export function RaciStrip({ people, waitingOn, className }: RaciStripProps) {
  const named = people.filter((p) => p.name && p.name !== "-");
  if (named.length === 0 && !waitingOn) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border bg-muted/30 px-4 py-3",
        className,
      )}
    >
      {named.map((person) => (
        <div key={`${person.slot}-${person.name}`} className="flex items-center gap-2">
          <PersonAvatar name={person.name} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {person.slot}
            </p>
            <p className="text-sm font-medium truncate">{person.name}</p>
            {person.note && (
              <p className="text-[11px] text-muted-foreground truncate">
                {person.note}
              </p>
            )}
          </div>
        </div>
      ))}

      {waitingOn && (
        <Badge
          variant="outline"
          className={cn(
            "ml-auto gap-1.5 text-[11px] font-medium",
            waitingOn.days >= STALE_DAYS
              ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
          )}
        >
          <Clock className="h-3 w-3" />
          Waiting on {waitingOn.name} for {waitingOn.days}{" "}
          {waitingOn.days === 1 ? "day" : "days"}
        </Badge>
      )}
    </div>
  );
}
