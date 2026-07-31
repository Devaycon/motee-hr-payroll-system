"use client";

import { useMemo } from "react";
import { Sparkles, Check, AlertTriangle, Users, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { LEAVE_REQUESTS, LEAVE_POLICIES } from "@/src/data/leave-demo";
import { PUBLIC_HOLIDAYS_2026 } from "@/src/data/leave-calendar-demo";
import {
  suggestLeaveWindows,
  staffingImpact,
  leaveExpiryAlert,
  yearEndRecommendation,
} from "@/src/lib/leave/planning";
import { MY_BALANCES, daysRemaining } from "./data";

// The Smart Leave Assistant (§16) combines four ideas into one panel:
//   1. Suggested leave windows (staffing-aware)
//   2. Overlapping-leave / coverage awareness
//   3. Leave expiry alerts (carry-forward)
//   4. Year-end pacing for unbooked annual leave
// The rules themselves live in `lib/leave/planning` so the request form warns
// on exactly the same basis. The HR-side "Employees At Risk" (§16.4) lives on
// the HR dashboard.

const REF_TODAY = "2026-07-22"; // demo "today", keeps the fixtures meaningful
const DEMO_DEPARTMENT = "Engineering";
const TEAM_SIZE = 10;

export function SmartLeaveAssistant() {
  // 1. Suggested windows — staffing-aware, with a bonus for weeks next to a
  // public holiday.
  const suggestions = useMemo(
    () =>
      suggestLeaveWindows({
        today: REF_TODAY,
        department: DEMO_DEPARTMENT,
        allRequests: LEAVE_REQUESTS,
        teamSize: TEAM_SIZE,
        holidays: PUBLIC_HOLIDAYS_2026,
      }),
    [],
  );

  // 2. Coverage right now.
  const coverage = useMemo(
    () =>
      staffingImpact({
        startDate: REF_TODAY,
        endDate: REF_TODAY,
        department: DEMO_DEPARTMENT,
        allRequests: LEAVE_REQUESTS,
        teamSize: TEAM_SIZE,
      }),
    [],
  );
  const availableNow = Math.max(0, TEAM_SIZE - coverage.awayCount);
  const minStaffing = coverage.minStaffing;

  // 3 + 4. Expiry against the carry-forward cap, and how to pace what's left.
  const annual = MY_BALANCES.find((b) => b.type === "annual");
  const annualRemaining = annual ? daysRemaining(annual) : 0;
  const carryCap =
    LEAVE_POLICIES.find((p) => p.leaveType === "annual")?.maxCarryOverDays ?? 0;
  const expiry = leaveExpiryAlert({
    today: REF_TODAY,
    remaining: annualRemaining,
    carryCap,
  });
  const pacing = yearEndRecommendation({
    today: REF_TODAY,
    remaining: annualRemaining,
  });
  const willExpire = expiry.daysAtRisk;

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="size-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Smart Leave Assistant</p>
            <p className="text-[11px] text-muted-foreground">
              AI-guided suggestions to help you book leave that&apos;s less likely to clash.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {/* Suggested windows */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-primary" />
              <p className="text-xs font-semibold text-foreground">Recommended dates</p>
            </div>
            <ul className="flex flex-col gap-1.5">
              {suggestions.map((s) => (
                <li
                  key={s.startDate}
                  className="flex items-start gap-1.5 text-[11px] text-foreground"
                >
                  <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                  <span className="min-w-0">
                    <span className="font-medium">{s.label}</span>{" "}
                    <span className="text-muted-foreground">
                      · {s.reason.toLowerCase()}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coverage awareness */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Users className="size-3.5 text-primary" />
              <p className="text-xs font-semibold text-foreground">Team coverage</p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {availableNow}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {TEAM_SIZE} available
              </span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {coverage.awayCount} away today. Minimum staffing is {minStaffing}.
            </p>
            {availableNow <= minStaffing && (
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                <AlertTriangle className="size-3" /> Coverage is tight — approvals may be limited.
              </p>
            )}
          </div>

          {/* Expiry alert */}
          <div
            className={
              "rounded-lg border p-3 " +
              (willExpire > 0
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-border bg-card")
            }
          >
            <div className="mb-2 flex items-center gap-1.5">
              <AlertTriangle
                className={"size-3.5 " + (willExpire > 0 ? "text-amber-600" : "text-primary")}
              />
              <p className="text-xs font-semibold text-foreground">Leave expiry</p>
            </div>
            <p
              className={
                "text-[11px] " +
                (willExpire > 0 ? "text-foreground" : "text-muted-foreground")
              }
            >
              {expiry.message}
            </p>
            {annualRemaining > 0 && (
              <p className="mt-1.5 border-t border-border/50 pt-1.5 text-[11px] text-muted-foreground">
                {pacing.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
