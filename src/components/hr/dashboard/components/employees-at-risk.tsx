"use client";

import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { LEAVE_BALANCES } from "@/src/data/leave-demo";

// Employees carrying more than this many days risk losing leave at year-end.
const RISK_THRESHOLD = 10;

/**
 * HR-side half of the Smart Leave Assistant (§16.4). Surfaces employees with a
 * large untaken balance so HR can proactively remind them before year-end.
 */
export function EmployeesAtRiskCard() {
  const atRisk = LEAVE_BALANCES.filter((b) => b.leaveType === "annual")
    .map((b) => ({ ...b, remaining: b.totalEntitlement - b.daysUsed }))
    .filter((b) => b.remaining > RISK_THRESHOLD)
    .sort((a, b) => b.remaining - a.remaining);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-amber-600" />
          <CardTitle className="text-base">Employees At Risk</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground">
          {atRisk.length} employees · over {RISK_THRESHOLD} days remaining
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {atRisk.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No employees are at risk of losing leave.
          </p>
        ) : (
          <>
            {atRisk.slice(0, 4).map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                  {b.employeeInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {b.employeeName}
                  </p>
                  <p className="text-xs text-muted-foreground">{b.department}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-amber-600 tabular-nums">
                  {b.remaining} days
                </span>
              </div>
            ))}
            <Link
              href="/time-payroll/leave"
              className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              View employees
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
