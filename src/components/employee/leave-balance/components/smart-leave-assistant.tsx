"use client";

import { useMemo } from "react";
import { Sparkles, Check, AlertTriangle, Users, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { LEAVE_REQUESTS, LEAVE_POLICIES } from "@/src/data/leave-demo";
import { PUBLIC_HOLIDAYS_2026 } from "@/src/data/leave-calendar-demo";
import { MY_BALANCES, daysRemaining } from "./data";

// The Smart Leave Assistant (§16) combines four ideas into one panel:
//   1. Suggested leave windows (staffing-aware)
//   2. Overlapping-leave / coverage awareness
//   3. Leave expiry alerts (carry-forward)
// The HR-side "Employees At Risk" (§16.4) lives on the HR dashboard.

const REF_TODAY = new Date(2026, 6, 22); // 22 Jul 2026 (demo "today")
const TEAM_SIZE = 10;
const MIN_STAFFING = 7;

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function nextMonday(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + ((8 - r.getDay()) % 7 || 7));
  return r;
}
function fmtRange(a: Date, b: Date): string {
  const day = (d: Date) => d.getDate();
  const mon = (d: Date) => d.toLocaleDateString("en-GB", { month: "long" });
  return a.getMonth() === b.getMonth()
    ? `${day(a)}–${day(b)} ${mon(a)}`
    : `${day(a)} ${mon(a)} – ${day(b)} ${mon(b)}`;
}

export function SmartLeaveAssistant() {
  const team = useMemo(
    () =>
      LEAVE_REQUESTS.filter(
        (r) => r.status === "approved" || r.status === "pending",
      ),
    [],
  );

  // 1. Suggested windows — score upcoming Mon–Fri weeks by team overlap, with a
  // bonus for weeks adjacent to a public holiday.
  const suggestions = useMemo(() => {
    const start = nextMonday(REF_TODAY);
    const weeks = Array.from({ length: 14 }, (_, w) => {
      const wkStart = addDays(start, w * 7);
      const wkEnd = addDays(wkStart, 4);
      const s = iso(wkStart);
      const e = iso(wkEnd);
      const overlap = team.filter((r) => r.startDate <= e && r.endDate >= s).length;
      const nearHoliday = PUBLIC_HOLIDAYS_2026.some(
        (h) => h.date >= iso(addDays(wkStart, -3)) && h.date <= iso(addDays(wkEnd, 3)),
      );
      return { wkStart, wkEnd, overlap, nearHoliday, score: overlap - (nearHoliday ? 1 : 0) };
    });
    return weeks.sort((a, b) => a.score - b.score).slice(0, 3);
  }, [team]);

  // 2. Coverage right now.
  const onLeaveNow = team.filter(
    (r) => r.startDate <= iso(REF_TODAY) && r.endDate >= iso(REF_TODAY),
  ).length;
  const availableNow = Math.max(0, TEAM_SIZE - onLeaveNow);

  // 3. Expiry — annual remaining vs carry-forward cap.
  const annual = MY_BALANCES.find((b) => b.type === "annual");
  const annualRemaining = annual ? daysRemaining(annual) : 0;
  const carryCap =
    LEAVE_POLICIES.find((p) => p.leaveType === "annual")?.maxCarryOverDays ?? 0;
  const willExpire = Math.max(0, annualRemaining - carryCap);

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
                  key={iso(s.wkStart)}
                  className="flex items-center gap-1.5 text-[11px] text-foreground"
                >
                  <Check className="size-3 shrink-0 text-emerald-600" />
                  <span className="font-medium">{fmtRange(s.wkStart, s.wkEnd)}</span>
                  <span className="text-muted-foreground">
                    {s.nearHoliday
                      ? "· near a bank holiday"
                      : s.overlap === 0
                        ? "· team fully available"
                        : "· low team absence"}
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
              {onLeaveNow} away today. Minimum staffing is {MIN_STAFFING}.
            </p>
            {availableNow <= MIN_STAFFING && (
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
            {willExpire > 0 ? (
              <p className="text-[11px] text-foreground">
                You have <span className="font-semibold">{annualRemaining} days</span> remaining.
                Only <span className="font-semibold">{carryCap}</span> can be carried forward —
                book <span className="font-semibold text-amber-600">{willExpire} days</span> before
                31 December or you&apos;ll lose them.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                You have {annualRemaining} days remaining, all within the {carryCap}-day
                carry-forward cap. Nothing at risk.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
