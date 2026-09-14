"use client";

import { useMemo } from "react";
// Unscoped — part of the employee detail page. See its hooks.ts.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import type {
  RawAsset,
  RawCertification,
  RawDocument,
  RawEnrollment,
  RawFeedback,
  RawKudos,
  RawOneOnOne,
  RawReview,
} from "./hooks";

/** How many months one page of the timeline covers. */
export const TIMELINE_WINDOW_MONTHS = 5;

export type TimelineCategory =
  | "milestone"
  | "kudos"
  | "profile"
  | "leave"
  | "growth"
  | "assets"
  | "pay";

export interface TimelineEvent {
  id: string;
  /** YYYY-MM-DD — the date the entry is filed under. */
  date: string;
  category: TimelineCategory;
  title: string;
  /** One-line supporting fact, e.g. "Senior Analyst → Lead Analyst". */
  detail?: string;
  /** Free text shown as a quote — kudos messages, review summaries, notes. */
  quote?: string;
  /** Person the entry came from; renders as an avatar + name. */
  person?: string;
  personRole?: string;
  /** Rendered through `StatusBadge` when present. */
  status?: string;
  /** Short label shown next to the title, e.g. a kudos value. */
  tag?: string;
  /** Module key the full record lives in, for the "Open" link. */
  module: string;
}

// ── month helpers (timeline pages are month windows) ────────────────────────
export const monthKeyOf = (iso: string) => iso.slice(0, 7);

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Whole months from `from` to `to` (negative when `to` is earlier). */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

export function formatMonth(key: string, long = false): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: long ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ── local raw shapes (the loose collections aren't exported as types) ───────
interface RawLeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days?: number;
  status: string;
  reason?: string;
}
interface RawEmploymentEvent {
  id: string;
  employeeId: string;
  date: string;
  type: string;
  from: string | null;
  to: string | null;
  reason: string;
}
interface RawPayChange {
  id: string;
  employeeId: string;
  effectiveDate: string;
  previousAmount: number;
  newAmount: number;
  changeType: string;
  reason: string;
}

export interface EmployeeTimelineData {
  /** Newest first. */
  events: TimelineEvent[];
  /** The day the employee joined — the far end of the timeline. */
  joinedDate: string | null;
  /** Oldest month the timeline can page back to. */
  earliestMonth: string;
  /** Newest month the timeline can page forward to. */
  latestMonth: string;
}

const day = (iso?: string | null) => (iso ?? "").slice(0, 10);
const nowMonth = () => monthKeyOf(new Date().toISOString());

const HISTORY_TITLES: Record<string, string> = {
  hired: "Joined the company",
  promotion: "Promoted",
  role_change: "Role changed",
  department_change: "Moved department",
  salary_change: "Salary reviewed",
  probation_passed: "Passed probation",
};

const PAY_TITLES: Record<string, string> = {
  increment: "Pay increase",
  promotion: "Promotion pay change",
  adjustment: "Pay adjustment",
  bonus: "Bonus awarded",
};

/**
 * Everything that happened to one employee, from every module, on a single
 * spine — the "journey" view the profile Timeline tab pages through.
 *
 * Reads the locale bundle once (rather than composing the per-module hooks) so
 * the tab has one loading state instead of a dozen staggered ones, and layers
 * the same session edits the individual modules do, so an entry added in e.g.
 * Kudos shows up here immediately.
 */
export function useEmployeeTimeline(
  employeeId: string,
  employee: LocaleEmployee,
) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const changeRequests = useAppSelector((s) =>
    s.profileEdits.requests.filter((r) => r.employeeId === employeeId),
  );
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);

  const data = useMemo<EmployeeTimelineData | null>(() => {
    if (!bundle) return null;
    const b = bundle;
    const nameOf = (id?: string | null) =>
      b.employees.find((e) => e.id === id)?.fullName;
    const roleOf = (id?: string | null) =>
      b.employees.find((e) => e.id === id)?.jobTitle;
    const events: TimelineEvent[] = [];
    const push = (e: TimelineEvent) => {
      if (e.date) events.push(e);
    };

    // Employment milestones ---------------------------------------------------
    const history = applyCollection(
      (b.employmentHistory as unknown as RawEmploymentEvent[]) ?? [],
      "employmentHistory",
      edits,
    ).filter((h) => h.employeeId === employeeId);
    for (const h of history) {
      push({
        id: `hist-${h.id}`,
        date: day(h.date),
        category: "milestone",
        title: HISTORY_TITLES[h.type] ?? "Employment change",
        detail:
          h.from || h.to ? `${h.from ?? "—"} → ${h.to ?? "—"}` : undefined,
        quote: h.reason || undefined,
        module: "history",
      });
    }
    // The start date is the anchor of the whole timeline, so make sure it is
    // on it even when the fixtures carry no "hired" event.
    const joinedDate = day(employee.startDate) || null;
    if (joinedDate && !history.some((h) => h.type === "hired")) {
      push({
        id: "joined",
        date: joinedDate,
        category: "milestone",
        title: "Joined the company",
        detail: employee.jobTitle,
        module: "job",
      });
    }

    // Kudos -------------------------------------------------------------------
    const kudos = applyCollection(
      (b.kudos as unknown as RawKudos[]) ?? [],
      "kudos",
      edits,
    );
    for (const k of kudos) {
      if (k.toEmployeeId === employeeId) {
        push({
          id: `kudos-in-${k.id}`,
          date: day(k.createdAt),
          category: "kudos",
          title: "Kudos received",
          quote: k.message,
          person: k.fromName ?? nameOf(k.fromEmployeeId),
          personRole: roleOf(k.fromEmployeeId),
          tag: k.value,
          module: "kudos",
        });
      } else if (k.fromEmployeeId === employeeId) {
        push({
          id: `kudos-out-${k.id}`,
          date: day(k.createdAt),
          category: "kudos",
          title: `Gave kudos to ${k.toName ?? nameOf(k.toEmployeeId) ?? "a colleague"}`,
          quote: k.message,
          tag: k.value,
          module: "kudos",
        });
      }
    }

    // Profile changes ---------------------------------------------------------
    for (const r of changeRequests) {
      const decided = r.status !== "pending" && r.decidedAt;
      push({
        id: `chg-${r.id}`,
        date: day(decided ? r.decidedAt : r.requestedAt),
        category: "profile",
        title:
          r.status === "approved"
            ? `${r.label} updated`
            : r.status === "rejected"
              ? `${r.label} change declined`
              : `${r.label} change requested`,
        detail: `${r.currentValue || "—"} → ${r.requestedValue || "—"}`,
        quote: r.decisionNote || r.reason || undefined,
        person: decided ? r.decidedBy : r.requestedBy,
        status: r.status,
        module: "change-log",
      });
    }

    // Documents ---------------------------------------------------------------
    const documents = applyCollection(
      (b.documents as unknown as RawDocument[]) ?? [],
      "documents",
      edits,
    ).filter((d) => d.employeeId === employeeId);
    for (const d of documents) {
      push({
        id: `doc-${d.id}`,
        date: day(d.uploadedAt),
        category: "profile",
        title: `Document added — ${d.name}`,
        detail: d.category,
        status: d.status,
        module: "documents",
      });
    }

    // Leave -------------------------------------------------------------------
    const leave = applyCollection(
      (b.leaveRequests as unknown as RawLeaveRequest[]) ?? [],
      "leaveRequests",
      edits,
    ).filter((r) => r.employeeId === employeeId);
    for (const l of leave) {
      const days = l.days ?? 0;
      push({
        id: `leave-${l.id}`,
        date: day(l.startDate),
        category: "leave",
        title: `${l.leaveType} — ${days} day${days === 1 ? "" : "s"}`,
        detail:
          l.startDate === l.endDate
            ? undefined
            : `${day(l.startDate)} → ${day(l.endDate)}`,
        quote: l.reason || undefined,
        status: l.status,
        module: "leave",
      });
    }

    // Learning & performance --------------------------------------------------
    const learning = b.learning as {
      enrollments?: RawEnrollment[];
      certifications?: RawCertification[];
    };
    const enrollments = applyCollection(
      learning?.enrollments ?? [],
      "learning.enrollments",
      edits,
    ).filter((e) => e.employeeId === employeeId);
    for (const e of enrollments) {
      push({
        id: `enrol-${e.id}`,
        date: day(e.enrolledAt),
        category: "growth",
        title: `Started course — ${e.courseTitle}`,
        module: "learn",
      });
      if (e.completedAt) {
        push({
          id: `enrol-done-${e.id}`,
          date: day(e.completedAt),
          category: "growth",
          title: `Completed course — ${e.courseTitle}`,
          status: "completed",
          module: "learn",
        });
      }
    }
    const certifications = applyCollection(
      learning?.certifications ?? [],
      "learning.certifications",
      edits,
    ).filter((c) => c.employeeId === employeeId);
    for (const c of certifications) {
      push({
        id: `cert-${c.id}`,
        date: day(c.issuedAt),
        category: "growth",
        title: `Certified — ${c.title}`,
        detail: c.expiresAt ? `Valid until ${day(c.expiresAt)}` : undefined,
        module: "training",
      });
    }

    const perf = b.performance as {
      reviews?: RawReview[];
      oneOnOnes?: RawOneOnOne[];
      feedback?: RawFeedback[];
    };
    for (const r of applyCollection(perf?.reviews ?? [], "perf.reviews", edits).filter(
      (r) => r.employeeId === employeeId && r.completedAt,
    )) {
      const rating = r.calibratedRating ?? r.managerRating ?? r.selfRating;
      push({
        id: `rev-${r.id}`,
        date: day(r.completedAt),
        category: "growth",
        title: "Performance review completed",
        detail: rating != null ? `Rating ${rating}/5` : undefined,
        quote: r.summary,
        module: "performance",
      });
    }
    for (const o of applyCollection(
      perf?.oneOnOnes ?? [],
      "perf.oneOnOnes",
      edits,
    ).filter((o) => o.employeeId === employeeId)) {
      push({
        id: `1on1-${o.id}`,
        date: day(o.date),
        category: "growth",
        title: "1:1 with manager",
        quote: o.notes,
        person: nameOf(o.managerId),
        personRole: roleOf(o.managerId),
        module: "performance",
      });
    }
    for (const f of applyCollection(
      perf?.feedback ?? [],
      "perf.feedback",
      edits,
    ).filter((f) => f.toEmployeeId === employeeId)) {
      push({
        id: `fb-${f.id}`,
        date: day(f.createdAt),
        category: "growth",
        title: "Feedback received",
        quote: f.message,
        person: nameOf(f.fromEmployeeId),
        personRole: roleOf(f.fromEmployeeId),
        module: "performance",
      });
    }

    // Assets ------------------------------------------------------------------
    const assets = applyCollection(
      (b.assets as unknown as RawAsset[]) ?? [],
      "assets",
      edits,
    ).filter((a) => a.assignedTo === employeeId);
    for (const a of assets) {
      push({
        id: `asset-${a.id}`,
        date: day(a.assignedDate),
        category: "assets",
        title: `Assigned ${a.name}`,
        detail: `${a.category} · ${a.assetTag}`,
        module: "assets",
      });
    }

    // Pay ---------------------------------------------------------------------
    const pay = applyCollection(
      (b.payHistory as unknown as RawPayChange[]) ?? [],
      "payHistory",
      edits,
    ).filter((p) => p.employeeId === employeeId);
    for (const p of pay) {
      push({
        id: `pay-${p.id}`,
        date: day(p.effectiveDate),
        category: "pay",
        title: PAY_TITLES[p.changeType] ?? "Pay change",
        detail:
          p.changeType === "bonus"
            ? formatMoneyLocale(p.newAmount)
            : `${formatMoneyLocale(p.previousAmount)} → ${formatMoneyLocale(p.newAmount)}`,
        quote: p.reason || undefined,
        module: "compensation",
      });
    }

    events.sort((a, c) => c.date.localeCompare(a.date) || a.id.localeCompare(c.id));

    const oldest = events.length ? events[events.length - 1].date : joinedDate;
    const newest = events.length ? events[0].date : null;
    const current = nowMonth();
    return {
      events,
      joinedDate,
      earliestMonth: monthKeyOf(
        [joinedDate, oldest].filter(Boolean).sort()[0] ?? `${current}-01`,
      ),
      // Future-dated entries (booked leave) still need a page to live on.
      latestMonth:
        newest && monthKeyOf(newest) > current ? monthKeyOf(newest) : current,
    };
  }, [bundle, edits, changeRequests, employeeId, employee.startDate, employee.jobTitle]);

  return { data, loading, error };
}
