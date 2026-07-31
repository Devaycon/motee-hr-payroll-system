"use client";

import { useMemo } from "react";
import {
  Sparkles,
  Check,
  AlertTriangle,
  Users,
  CalendarClock,
  CalendarPlus,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  suggestLeaveWindows,
  staffingImpact,
  leaveExpiryAlert,
  yearEndRecommendation,
  type SuggestedWindow,
} from "@/src/lib/leave/planning";
import { useLeavePlanningContext } from "../hooks";

/**
 * The Leave module's intelligence: when to book, who else is away, and what
 * lapses if nobody acts. Rules live in `lib/leave/planning` so the request form
 * warns on exactly the same basis.
 *
 * Used from both sides of the profile's Leave module — the employee planning
 * their own leave (`audience="self"`), and HR reviewing someone else's
 * (`audience="hr"`), which only changes who the copy addresses.
 */
export function LeaveInsights({
  annualRemaining,
  subject,
  audience = "self",
  onPickWindow,
}: {
  /** Days of annual leave still bookable. */
  annualRemaining: number;
  /** Whose leave this is. Omit for the logged-in user. */
  subject?: { name?: string; department?: string };
  audience?: "self" | "hr";
  /** Books a suggested window — opens the request form pre-filled. */
  onPickWindow?: (window: SuggestedWindow) => void;
}) {
  const ctx = useLeavePlanningContext(subject);
  const isSelf = audience === "self";
  const who = isSelf ? "you" : (ctx.employeeName ?? "this employee");

  const suggestions = useMemo(
    () =>
      ctx.teamSize > 0
        ? suggestLeaveWindows({
            today: ctx.today,
            department: ctx.department,
            allRequests: ctx.allRequests,
            teamSize: ctx.teamSize,
            excludeEmployeeName: ctx.employeeName,
            holidays: ctx.holidays,
            shutdowns: ctx.shutdowns,
          })
        : [],
    [ctx],
  );

  const coverage = useMemo(
    () =>
      staffingImpact({
        startDate: ctx.today,
        endDate: ctx.today,
        department: ctx.department,
        allRequests: ctx.allRequests,
        teamSize: ctx.teamSize,
        excludeEmployeeName: ctx.employeeName,
      }),
    [ctx],
  );

  const expiry = leaveExpiryAlert({
    today: ctx.today,
    remaining: annualRemaining,
    carryCap: ctx.annualCarryCap,
    subject: isSelf ? undefined : ctx.employeeName,
  });
  const pacing = yearEndRecommendation({
    today: ctx.today,
    remaining: annualRemaining,
  });

  const atRisk = expiry.daysAtRisk > 0;

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="size-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Smart Leave Assistant
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isSelf
                ? "Suggestions to help you book leave that's less likely to be rejected."
                : `Staffing-aware suggestions for ${who}'s next booking.`}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {/* 1. Suggested windows, staffing-aware. */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-primary" />
              <p className="text-xs font-semibold text-foreground">
                Recommended dates
              </p>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">
                {ctx.teamSize > 0
                  ? "No clear windows in the next few months — every week has cover pressure."
                  : `Staffing-aware suggestions appear once ${
                      isSelf ? "your" : "the"
                    } department headcount is known.`}
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {suggestions.map((s) => (
                  <li key={s.startDate}>
                    <button
                      type="button"
                      disabled={!onPickWindow}
                      onClick={() => onPickWindow?.(s)}
                      className={cn(
                        "flex w-full items-start gap-1.5 rounded-md px-1 py-0.5 text-left text-[11px] text-foreground",
                        onPickWindow &&
                          "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                      title={onPickWindow ? `Request ${s.label}` : undefined}
                    >
                      <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                      <span className="min-w-0">
                        <span className="font-medium">{s.label}</span>{" "}
                        <span className="text-muted-foreground">
                          · {s.reason.toLowerCase()}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 2. Overlapping leave within the department, right now. */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Users className="size-3.5 text-primary" />
              <p className="text-xs font-semibold text-foreground">
                Team coverage
              </p>
            </div>
            {ctx.teamSize > 0 ? (
              <>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {Math.max(0, ctx.teamSize - coverage.awayCount)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {ctx.teamSize} available
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {coverage.awayCount} away today in {ctx.department}. Minimum
                  staffing is {coverage.minStaffing}.
                </p>
                {ctx.teamSize - coverage.awayCount <= coverage.minStaffing && (
                  <p className="mt-1 inline-flex items-start gap-1 text-[11px] font-medium text-amber-600">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                    Cover is tight — approvals may be limited.
                  </p>
                )}
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Team coverage appears once the department headcount is known.
              </p>
            )}
          </div>

          {/* 3 + 4. Expiry alert and the year-end pacing nudge. */}
          <div
            className={cn(
              "rounded-lg border p-3",
              atRisk
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-border bg-card",
            )}
          >
            <div className="mb-2 flex items-center gap-1.5">
              <AlertTriangle
                className={cn(
                  "size-3.5",
                  atRisk ? "text-amber-600" : "text-primary",
                )}
              />
              <p className="text-xs font-semibold text-foreground">
                Leave expiry
              </p>
            </div>
            <p
              className={cn(
                "text-[11px]",
                atRisk ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {expiry.message}
            </p>
            {annualRemaining > 0 && (
              <p className="mt-1.5 border-t border-border/50 pt-1.5 text-[11px] text-muted-foreground">
                {pacing.message}
              </p>
            )}
            {atRisk && onPickWindow && suggestions.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 gap-1.5 text-[11px]"
                onClick={() => onPickWindow(suggestions[0])}
              >
                <CalendarPlus className="size-3" />
                Book {suggestions[0].label}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
