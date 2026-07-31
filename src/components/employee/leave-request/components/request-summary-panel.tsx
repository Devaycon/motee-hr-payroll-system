"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  FileText,
  Info,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  leaveExpiryAlert,
  staffingImpact,
  suggestLeaveWindows,
} from "@/src/lib/leave/planning";
import { LEAVE_TYPE_LABELS } from "@/src/data/leave-demo";
import type { LeavePolicy, LeaveTypeName } from "@/src/lib/types/leave";
import { useLeavePlanningContext } from "../hooks";
import type { LeavePrefill } from "./types";

/** A face for each leave type, so the summary reads at a glance. */
const LEAVE_TYPE_EMOJI: Record<LeaveTypeName, string> = {
  annual: "🌴",
  sick: "🤒",
  maternity: "🍼",
  paternity: "🍼",
  compassionate: "🕊️",
  study: "📚",
  unpaid: "📄",
};

interface RequestSummaryPanelProps {
  leaveType: LeaveTypeName | "";
  startDate: string;
  /** Ignored when `isHalfDay` — a half day is always a single date. */
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod: "morning" | "afternoon";
  /** Working days the request costs, as the form counts them. */
  days: number;
  /** Days left on this leave type before the request. */
  balanceRemaining: number | null;
  policy: LeavePolicy | null;
  /** Applies a suggested window to the form. */
  onPickWindow: (window: LeavePrefill) => void;
}

interface DayRow {
  iso: string;
  label: string;
  note: string;
  counted: boolean;
}

/** Every calendar day in the range, labelled the way the request will be read. */
function buildDayRows(
  startIso: string,
  endIso: string,
  isHalfDay: boolean,
  halfDayPeriod: "morning" | "afternoon",
  holidayNames: Map<string, string>,
): DayRow[] {
  if (!startIso) return [];
  const start = new Date(startIso);
  const end = new Date(isHalfDay ? startIso : endIso || startIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [];

  const rows: DayRow[] = [];
  const cur = new Date(start);
  while (cur <= end && rows.length < 60) {
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    const weekend = cur.getDay() === 0 || cur.getDay() === 6;
    const holiday = holidayNames.get(iso);
    rows.push({
      iso,
      label: cur.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      note: weekend
        ? "Weekend"
        : isHalfDay
          ? halfDayPeriod === "morning"
            ? "Morning"
            : "Afternoon"
          : (holiday ?? "All day"),
      counted: !weekend,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return rows;
}

function PanelSection({
  icon: Icon,
  title,
  children,
  tone,
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "primary";
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            tone === "primary" ? "text-primary" : "text-muted-foreground",
          )}
        />
        <p className="text-xs font-semibold text-foreground">{title}</p>
      </div>
      {children}
    </section>
  );
}

function Fact({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-[11px] font-medium text-right",
          warn ? "text-amber-600" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The right-hand rail of the leave request dialog: what the employee is asking
 * for, what the policy behind it actually says, and the Smart Leave Assistant's
 * read on the dates — all live as the form is filled in.
 *
 * It reuses `lib/leave/planning`, the same rules the assistant panel on the
 * Leave page runs on, so the two can never disagree.
 */
export function RequestSummaryPanel({
  leaveType,
  startDate,
  endDate,
  isHalfDay,
  halfDayPeriod,
  days,
  balanceRemaining,
  policy,
  onPickWindow,
}: RequestSummaryPanelProps) {
  const ctx = useLeavePlanningContext();
  const rangeEnd = isHalfDay ? startDate : endDate;
  // Sickness and bereavement aren't planned around, so staffing suggestions
  // would be noise rather than help.
  const plannable = leaveType !== "sick" && leaveType !== "compassionate";

  const holidayNames = useMemo(
    () => new Map(ctx.holidays.map((h) => [h.date, h.name])),
    [ctx.holidays],
  );

  const dayRows = useMemo(
    () =>
      buildDayRows(startDate, endDate, isHalfDay, halfDayPeriod, holidayNames),
    [startDate, endDate, isHalfDay, halfDayPeriod, holidayNames],
  );

  const impact = useMemo(
    () =>
      plannable && startDate && rangeEnd && ctx.teamSize > 0
        ? staffingImpact({
            startDate,
            endDate: rangeEnd,
            department: ctx.department,
            allRequests: ctx.allRequests,
            teamSize: ctx.teamSize,
            excludeEmployeeName: ctx.employeeName,
          })
        : null,
    [plannable, startDate, rangeEnd, ctx],
  );

  const suggestions = useMemo(
    () =>
      plannable && ctx.teamSize > 0
        ? suggestLeaveWindows({
            today: ctx.today,
            department: ctx.department,
            allRequests: ctx.allRequests,
            teamSize: ctx.teamSize,
            excludeEmployeeName: ctx.employeeName,
            length: Math.max(1, Math.round(days || 5)),
            holidays: ctx.holidays,
            shutdowns: ctx.shutdowns,
            limit: 3,
          })
        : [],
    [plannable, ctx, days],
  );

  const expiry =
    leaveType === "annual" && balanceRemaining !== null
      ? leaveExpiryAlert({
          today: ctx.today,
          remaining: balanceRemaining,
          carryCap: ctx.annualCarryCap,
        })
      : null;

  const forecast =
    balanceRemaining !== null ? balanceRemaining - days : null;
  const noticeDays = startDate
    ? Math.ceil(
        (new Date(startDate).getTime() - new Date(ctx.today).getTime()) /
          86400000,
      )
    : null;
  const noticeShort =
    policy && noticeDays !== null && noticeDays < policy.minNoticeDays;
  const tooLong = policy ? days > policy.maxConsecutiveDays : false;
  const label = leaveType ? LEAVE_TYPE_LABELS[leaveType] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* 1. What is actually being requested. */}
      <div>
        <p className="text-sm font-semibold text-foreground">
          Your request details
        </p>
        {dayRows.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pick a leave type and dates — this panel will show the days you&apos;re
            taking, what the policy allows, and how the timing looks for your
            team.
          </p>
        ) : (
          <>
            <div className="mt-2 flex flex-col">
              {dayRows.slice(0, 12).map((d) => (
                <div
                  key={d.iso}
                  className={cn(
                    "flex items-center justify-between gap-3 border-b border-border/50 py-1.5 last:border-0",
                    !d.counted && "opacity-60",
                  )}
                >
                  <span className="text-[11px] font-medium text-foreground">
                    {d.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {d.note}
                  </span>
                </div>
              ))}
              {dayRows.length > 12 && (
                <p className="pt-1.5 text-[11px] text-muted-foreground">
                  + {dayRows.length - 12} more day
                  {dayRows.length - 12 === 1 ? "" : "s"}
                </p>
              )}
            </div>

            {label && days > 0 && (
              <div className="mt-3 rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-semibold text-foreground">
                  You are requesting {days} day{days === 1 ? "" : "s"} of {label}{" "}
                  {leaveType && LEAVE_TYPE_EMOJI[leaveType]}
                </p>
                {forecast !== null && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    The forecasted remaining balance will be{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        forecast < 0 ? "text-red-500" : "text-[#1D9E75]",
                      )}
                    >
                      {forecast} day{forecast === 1 ? "" : "s"}
                    </span>
                    .
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 2. The policy behind the type they picked. */}
      {policy && (
        <PanelSection icon={FileText} title={`About ${policy.name}`}>
          {policy.description && (
            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
              {policy.description}
            </p>
          )}
          <Fact
            label="Entitlement"
            value={`${policy.maxDaysPerYear} days per year`}
          />
          <Fact
            label="Notice required"
            value={
              policy.minNoticeDays === 0
                ? "None"
                : `${policy.minNoticeDays} days${
                    noticeDays !== null ? ` · you're giving ${noticeDays}` : ""
                  }`
            }
            warn={!!noticeShort}
          />
          <Fact
            label="Longest single spell"
            value={`${policy.maxConsecutiveDays} days`}
            warn={tooLong}
          />
          <Fact
            label="Carry over"
            value={
              policy.carryOverAllowed
                ? `Up to ${policy.maxCarryOverDays} days`
                : "Not allowed"
            }
          />
          <Fact
            label="Medical certificate"
            value={policy.requiresMedicalCertificate ? "Required" : "Not required"}
          />
          {policy.eligibility && (
            <Fact label="Eligibility" value={policy.eligibility} />
          )}
          {policy.publicHolidayRule && (
            <Fact label="Public holidays" value={policy.publicHolidayRule} />
          )}
          {policy.attachmentRequirement && (
            <Fact label="Attachments" value={policy.attachmentRequirement} />
          )}
          {tooLong && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-600">
              <AlertTriangle className="mt-0.5 size-3 shrink-0" />
              This run is longer than the {policy.maxConsecutiveDays}-day
              maximum, so it will need extra approval.
            </p>
          )}
          {policy.documentUrl && (
            <a
              href={policy.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[11px] font-medium text-primary hover:underline"
            >
              Read the full policy
            </a>
          )}
        </PanelSection>
      )}

      {/* 3. The assistant's read on the timing. */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles className="size-3.5 shrink-0 text-primary" />
          <p className="text-xs font-semibold text-foreground">
            Smart Leave Assistant
          </p>
        </div>

        {!plannable ? (
          <p className="text-[11px] text-muted-foreground">
            {label} is taken as needed, so there are no timing suggestions —
            submit it and your manager will pick it up.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {impact ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <Users className="size-3 shrink-0 text-primary" />
                  <p className="text-[11px] font-medium text-foreground">
                    {impact.availableIfApproved} of {impact.teamSize} in{" "}
                    {ctx.department} would be at work
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {impact.awayCount === 0
                    ? "Nobody else is off across these dates — good timing."
                    : `${impact.awayNames.slice(0, 3).join(", ")}${
                        impact.awayNames.length > 3
                          ? ` and ${impact.awayNames.length - 3} more`
                          : ""
                      } ${impact.awayCount === 1 ? "is" : "are"} already off.`}
                </p>
                {impact.belowMinimum && (
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] font-medium text-amber-600">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                    That is below the minimum of {impact.minStaffing} — approval
                    may be declined.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                {ctx.teamSize > 0
                  ? "Pick your dates to see how they land for your team."
                  : "Team coverage appears once your department headcount is known."}
              </p>
            )}

            {suggestions.length > 0 && (
              <div className="border-t border-primary/15 pt-2">
                <div className="mb-1 flex items-center gap-1.5">
                  <CalendarClock className="size-3 shrink-0 text-primary" />
                  <p className="text-[11px] font-medium text-foreground">
                    {impact?.belowMinimum
                      ? "Dates that would clear"
                      : "Recommended dates"}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  {suggestions.map((s) => (
                    <button
                      key={s.startDate}
                      type="button"
                      onClick={() =>
                        onPickWindow({
                          startDate: s.startDate,
                          endDate: s.endDate,
                        })
                      }
                      className="flex items-start gap-1.5 rounded px-1 py-0.5 text-left text-[11px] transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      title={`Use ${s.label}`}
                    >
                      <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">
                          {s.label}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          · {s.reason.toLowerCase()}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {expiry && expiry.severity !== "none" && (
              <p className="border-t border-primary/15 pt-2 text-[11px] text-muted-foreground">
                {expiry.message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
