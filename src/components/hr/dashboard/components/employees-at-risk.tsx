"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LEAVE_BALANCES } from "@/src/data/leave-demo";
import { Tile, TileLabel } from "./tiles";

// Employees carrying more than this many days risk losing leave at year-end.
const RISK_THRESHOLD = 10;

/** Rows shown before the list defers to the full leave screen. */
const VISIBLE_ROWS = 4;

/**
 * HR-side half of the Smart Leave Assistant (§16.4). Surfaces employees with a
 * large untaken balance so HR can proactively remind them before year-end.
 *
 * Was titled "Employees At Risk", which the client read as *performance* risk.
 * The card is about leave that is about to expire, so the title now says so.
 */
export function UntakenLeaveCard() {
  const atRisk = LEAVE_BALANCES.filter((b) => b.leaveType === "annual")
    .map((b) => ({ ...b, remaining: b.totalEntitlement - b.daysUsed }))
    .filter((b) => b.remaining > RISK_THRESHOLD)
    .sort((a, b) => b.remaining - a.remaining);

  return (
    <Tile>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TileLabel className="text-base">
          Untaken Leave — Action Needed
        </TileLabel>
        <p className="text-xs text-muted-foreground">
          {atRisk.length} {atRisk.length === 1 ? "employee" : "employees"} at
          risk of losing leave
        </p>
      </div>

      {atRisk.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No employees are at risk of losing leave.
        </p>
      ) : (
        <>
          <ul className="mt-1">
            {atRisk.slice(0, VISIBLE_ROWS).map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 border-t border-border py-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-primary">
                  {b.employeeInitials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {b.employeeName}
                  </p>
                  <p className="text-xs text-muted-foreground">{b.department}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-amber-600 tabular-nums dark:text-amber-500">
                  {b.remaining} days
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/time-payroll/leave"
            className="mt-2 inline-flex w-fit items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          >
            View employees
            <ChevronRight className="size-3.5" />
          </Link>
        </>
      )}
    </Tile>
  );
}
