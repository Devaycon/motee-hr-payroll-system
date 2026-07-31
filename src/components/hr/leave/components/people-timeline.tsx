"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Users, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { cn } from "@/src/lib/utils";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { isOpenLeaveStatus } from "@/src/lib/types/leave";
import type { LeaveRequest, LeaveTypeName } from "@/src/lib/types/leave";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_OPTIONS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
} from "@/src/data/leave-demo";
import { LEAVE_TYPE_COLORS } from "@/src/components/employee/leave-request/components/leave-colors";
import {
  PUBLIC_HOLIDAYS_2026,
  COMPANY_SHUTDOWNS,
} from "@/src/data/leave-calendar-demo";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** Requests that put someone out of the office — granted or still in flight. */
const countsAsAway = (r: LeaveRequest) =>
  r.status === "approved" || isOpenLeaveStatus(r.status);

interface Person {
  key: string;
  name: string;
  jobTitle: string;
  department: string;
  gender?: string | null;
}

interface Bar {
  request: LeaveRequest;
  /** 1-based day-of-month the bar starts on, and how many days it covers. */
  startDay: number;
  span: number;
  /** The absence runs past this month's edge on that side. */
  clippedStart: boolean;
  clippedEnd: boolean;
}

interface PeopleTimelineProps {
  /** The leave to plot — the caller decides how wide the scope is. */
  requests: LeaveRequest[];
  /** Offers a department filter in the toolbar when supplied. */
  departments?: readonly string[];
  initialDepartment?: string;
  initialType?: LeaveTypeName | "all";
  /** Hands off to the review flow — where a decision is actually made. */
  onReview?: (request: LeaveRequest) => void;
}

/**
 * "People's time off" — the whole team down the side, every day of the month
 * across the top, and each absence drawn as a bar over the days it covers.
 *
 * The month grid answers "what is happening on this date"; this answers "who is
 * away, and can we cover it" — which needs a row per person and a running
 * availability count, neither of which fits inside a day cell. Decisions still
 * belong to the review modal, so a selected absence hands off to it.
 */
export function PeopleTimeline({
  requests,
  departments,
  initialDepartment = "all",
  initialType = "all",
  onReview,
}: PeopleTimelineProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<LeaveTypeName | "all">(
    initialType,
  );
  const [department, setDepartment] = useState(initialDepartment);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allRequests = useMemo(
    () =>
      department === "all"
        ? requests
        : requests.filter((r) => r.department === department),
    [requests, department],
  );
  const { data: employees } = useLocaleSection((b) =>
    b.employees.map((e) => ({
      key: e.fullName,
      name: e.fullName,
      jobTitle: e.jobTitle,
      department: e.departmentName,
      gender: (e as { gender?: string }).gender ?? null,
    })),
  );

  const monthStart = cursor;
  const daysInMonth = new Date(
    cursor.getFullYear(),
    cursor.getMonth() + 1,
    0,
  ).getDate();
  const days = useMemo(
    () =>
      Array.from(
        { length: daysInMonth },
        (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1),
      ),
    [cursor, daysInMonth],
  );
  const monthFirstIso = iso(days[0]);
  const monthLastIso = iso(days[days.length - 1]);
  const todayIso = iso(new Date());

  const holidayByDate = useMemo(
    () => new Map(PUBLIC_HOLIDAYS_2026.map((h) => [h.date, h.name])),
    [],
  );
  const shutdownFor = (day: string) =>
    COMPANY_SHUTDOWNS.find((s) => day >= s.startDate && day <= s.endDate);

  /** Everyone with a record or an absence, so no leave goes unrepresented. */
  const people = useMemo<Person[]>(() => {
    const map = new Map<string, Person>();
    for (const e of employees ?? []) map.set(e.key, e);
    for (const r of allRequests) {
      if (map.has(r.employeeName)) continue;
      map.set(r.employeeName, {
        key: r.employeeName,
        name: r.employeeName,
        jobTitle: r.jobTitle,
        department: r.department,
      });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, allRequests]);

  /** Absences that touch the month on screen, keyed by person. */
  const barsByPerson = useMemo(() => {
    const map = new Map<string, Bar[]>();
    for (const r of allRequests) {
      if (r.status === "cancelled" || r.status === "rejected") continue;
      if (typeFilter !== "all" && r.leaveType !== typeFilter) continue;
      if (r.endDate < monthFirstIso || r.startDate > monthLastIso) continue;
      const startDay =
        r.startDate < monthFirstIso ? 1 : Number(r.startDate.slice(8, 10));
      const endDay =
        r.endDate > monthLastIso ? daysInMonth : Number(r.endDate.slice(8, 10));
      const list = map.get(r.employeeName) ?? [];
      list.push({
        request: r,
        startDay,
        span: Math.max(1, endDay - startDay + 1),
        clippedStart: r.startDate < monthFirstIso,
        clippedEnd: r.endDate > monthLastIso,
      });
      map.set(r.employeeName, list);
    }
    return map;
  }, [allRequests, typeFilter, monthFirstIso, monthLastIso, daysInMonth]);

  const visiblePeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.jobTitle.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q),
    );
  }, [people, query]);

  /** How many of the team are at work on each day of the month. */
  const availability = useMemo(
    () =>
      days.map((d) => {
        const day = iso(d);
        const away = new Set(
          allRequests
            .filter(
              (r) =>
                countsAsAway(r) && r.startDate <= day && r.endDate >= day,
            )
            .map((r) => r.employeeName),
        );
        return Math.max(0, people.length - away.size);
      }),
    [days, allRequests, people.length],
  );

  const pending = useMemo(
    () =>
      allRequests
        .filter((r) => isOpenLeaveStatus(r.status))
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [allRequests],
  );
  const selected = allRequests.find((r) => r.id === selectedId) ?? null;

  const shiftMonth = (delta: number) =>
    setCursor(
      (c) => new Date(c.getFullYear(), c.getMonth() + delta, 1),
    );

  // 220px name column, then one equal column per day.
  const gridTemplate = `220px repeat(${daysInMonth}, minmax(38px, 1fr))`;

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Month controls + filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
          >
            Today
          </Button>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="min-w-40 text-sm font-semibold text-foreground">
            {MONTHS[monthStart.getMonth()]} {monthStart.getFullYear()}
          </p>

          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people…"
              className="h-8 w-52 pl-8 text-xs"
            />
          </div>
          {departments && departments.length > 0 && (
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All departments
                </SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as LeaveTypeName | "all")}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All absence types
              </SelectItem>
              {LEAVE_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {LEAVE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* The grid itself — one scroll container for both axes. */}
        <div className="min-h-0 flex-1 overflow-auto">
          <div style={{ minWidth: `${220 + daysInMonth * 38}px` }}>
            {/* Day header and availability strip stay pinned together, so the
                counts never drift away from the dates they belong to. */}
            <div className="sticky top-0 z-20 bg-card">
              <div
                className="grid border-b border-border bg-card"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="sticky left-0 z-10 flex items-center gap-1.5 border-r border-border bg-card px-3 py-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">
                    Employees ({visiblePeople.length})
                  </span>
                </div>
                {days.map((d) => {
                  const day = iso(d);
                  const today = day === todayIso;
                  return (
                    <div
                      key={day}
                      className={cn(
                        "border-r border-border/60 px-1 py-1 text-center last:border-r-0",
                        isWeekend(d) && "bg-muted/60",
                        today && "bg-primary/10",
                      )}
                      title={holidayByDate.get(day) ?? shutdownFor(day)?.name}
                    >
                      <p
                        className={cn(
                          "text-[11px] font-semibold tabular-nums",
                          today ? "text-primary" : "text-foreground",
                        )}
                      >
                        {String(d.getDate()).padStart(2, "0")}
                      </p>
                      <p className="text-[9px] uppercase text-muted-foreground">
                        {WEEKDAY_INITIALS[d.getDay()]}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div
                className="grid border-b border-border bg-muted/30"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="sticky left-0 z-10 border-r border-border bg-muted/30 px-3 py-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    People&apos;s availability
                  </span>
                </div>
                {days.map((d, i) => (
                  <div
                    key={iso(d)}
                    className={cn(
                      "border-r border-border/60 py-1.5 text-center text-[11px] tabular-nums last:border-r-0",
                      isWeekend(d)
                        ? "bg-muted/60 text-muted-foreground/60"
                        : "text-foreground",
                    )}
                    title={`${availability[i]} of ${people.length} at work`}
                  >
                    {availability[i]}
                  </div>
                ))}
              </div>
            </div>

            {/* One row per person */}
            {visiblePeople.map((p) => {
              const bars = barsByPerson.get(p.key) ?? [];
              return (
                <div
                  key={p.key}
                  className="grid border-b border-border/50"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  <div className="sticky left-0 z-10 flex items-center gap-2 border-r border-border bg-card px-3 py-2">
                    <PersonAvatar
                      name={p.name}
                      gender={p.gender}
                      size="sm"
                      className="h-7 w-7 shrink-0"
                      fallbackClassName="text-[10px]"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {p.name}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {p.jobTitle}
                      </p>
                    </div>
                  </div>

                  {/* Day cells and absence bars share the row's single grid
                      line, so a bar sits directly over the days it covers. */}
                  {days.map((d) => (
                    <div
                      key={iso(d)}
                      style={{ gridRow: 1 }}
                      className={cn(
                        "min-h-11 border-r border-border/40 last:border-r-0",
                        isWeekend(d) && "bg-muted/50",
                        holidayByDate.has(iso(d)) && "bg-amber-500/10",
                        iso(d) === todayIso && "bg-primary/5",
                      )}
                    />
                  ))}
                  {bars.map((bar) => {
                    const colour = LEAVE_TYPE_COLORS[bar.request.leaveType];
                    const open = isOpenLeaveStatus(bar.request.status);
                    return (
                      <button
                        key={bar.request.id}
                        type="button"
                        onClick={() => setSelectedId(bar.request.id)}
                        style={{
                          gridRow: 1,
                          gridColumn: `${bar.startDay + 1} / span ${bar.span}`,
                          backgroundColor: open ? colour.bg : colour.bar,
                          borderColor: colour.bar,
                          borderStyle: open ? "dashed" : "solid",
                          color: open ? colour.bar : "#fff",
                        }}
                        className={cn(
                          "z-[1] my-1.5 mx-0.5 flex items-center overflow-hidden rounded-md border px-1.5 text-[10px] font-medium transition-opacity hover:opacity-85",
                          bar.clippedStart && "rounded-l-none",
                          bar.clippedEnd && "rounded-r-none",
                          selectedId === bar.request.id &&
                            "ring-2 ring-blue-500 ring-offset-1 ring-offset-background",
                        )}
                        title={`${LEAVE_TYPE_LABELS[bar.request.leaveType]} · ${bar.request.startDate} → ${bar.request.endDate} · ${LEAVE_STATUS_LABELS[bar.request.status]}`}
                      >
                        <span className="truncate">
                          {LEAVE_TYPE_LABELS[bar.request.leaveType]}
                          {bar.request.isHalfDay ? " (½)" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {visiblePeople.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nobody matches “{query}”.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detail rail: the selected absence, or the queue waiting on a decision */}
      <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-t border-border bg-muted/20 px-4 py-4 md:w-80 md:border-l md:border-t-0">
        {selected ? (
          <RequestDetail
            request={selected}
            allRequests={allRequests}
            onClear={() => setSelectedId(null)}
            onReview={onReview}
          />
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">
              Pending requests ({pending.length})
            </p>
            {pending.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nothing is waiting on a decision. Select any bar in the grid to
                see the absence behind it.
              </p>
            ) : (
              pending.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className="rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-blue-500"
                >
                  <div className="flex items-center gap-2">
                    <PersonAvatar
                      name={r.employeeName}
                      initials={r.employeeInitials}
                      size="sm"
                      className="h-7 w-7"
                      fallbackClassName="text-[10px]"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {r.employeeName}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {r.jobTitle}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-foreground">
                    {LEAVE_TYPE_LABELS[r.leaveType]} · {r.totalDays} day
                    {r.totalDays === 1 ? "" : "s"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.startDate} → {r.endDate}
                  </p>
                </button>
              ))
            )}
          </>
        )}
      </aside>
    </div>
  );
}

/** Everything known about one absence, plus who else is off across its dates. */
function RequestDetail({
  request: r,
  allRequests,
  onClear,
  onReview,
}: {
  request: LeaveRequest;
  allRequests: readonly LeaveRequest[];
  onClear: () => void;
  onReview?: (request: LeaveRequest) => void;
}) {
  const overlapping = allRequests.filter(
    (o) =>
      o.id !== r.id &&
      countsAsAway(o) &&
      o.startDate <= r.endDate &&
      o.endDate >= r.startDate,
  );
  const byType = new Map<string, string[]>();
  for (const o of overlapping) {
    const list = byType.get(o.leaveType) ?? [];
    if (!list.includes(o.employeeName)) list.push(o.employeeName);
    byType.set(o.leaveType, list);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PersonAvatar
            name={r.employeeName}
            initials={r.employeeInitials}
            size="sm"
            className="h-8 w-8"
            fallbackClassName="text-[10px]"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {r.employeeName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {r.jobTitle}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClear}
          aria-label="Back to pending requests"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">
            {LEAVE_TYPE_LABELS[r.leaveType]} · {r.totalDays} day
            {r.totalDays === 1 ? "" : "s"}
          </p>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              LEAVE_STATUS_STYLES[r.status],
            )}
          >
            {LEAVE_STATUS_LABELS[r.status]}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {r.startDate} → {r.endDate}
          {r.isHalfDay ? ` · half day (${r.halfDayPeriod ?? "morning"})` : ""}
        </p>
        {onReview && (
          <Button
            size="sm"
            variant={isOpenLeaveStatus(r.status) ? "default" : "outline"}
            className="mt-2 h-7 w-full text-[11px]"
            onClick={() => onReview(r)}
          >
            {isOpenLeaveStatus(r.status) ? "Review request" : "Open request"}
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        <Field label="Requested on" value={r.submittedAt} />
        <Field label="Department" value={r.department} />
        <Field label="Approver" value={r.approvedBy ?? r.managerName ?? "—"} />
        <Field label="Cover" value={r.reliefEmployeeName ?? "None nominated"} />
      </dl>

      {(r.reason || r.notes) && (
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">
            Description
          </p>
          <p className="mt-0.5 text-[11px] text-foreground">
            {r.reason ?? r.notes}
          </p>
        </div>
      )}

      <div className="border-t border-border pt-2">
        <p className="text-[11px] font-medium text-foreground">
          People&apos;s availability for these dates
        </p>
        {byType.size === 0 ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Nobody else is off across these dates.
          </p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {[...byType.entries()].map(([type, names]) => (
              <li
                key={type}
                className="flex items-center justify-between gap-2 text-[11px]"
                title={names.join(", ")}
              >
                <span className="text-muted-foreground">
                  {LEAVE_TYPE_LABELS[type]}
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  {names.length}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="text-[11px] font-medium text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}
