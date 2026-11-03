import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import {
  KPI_BY_ID,
  buildRows,
  formatKpi,
  periodRange,
  type BranchPerformanceRow,
  type KpiId,
  type PerfInput,
} from "@/src/lib/branches/performance";
import type { BradfordAction } from "@/src/lib/types/sickness";
import type { WorkflowTaskPriority } from "@/src/lib/types/workflows";
import {
  RISK_PRIORITY_RANK,
  type RiskAffected,
  type WorkforceRisk,
} from "@/src/lib/types/workforce-risk";

/**
 * The rule engine behind Workforce Risk & Action Management.
 *
 * Every rule is a pure function of the Core HR data, so a risk is rebuilt —
 * never stored — and its id is deterministic. That gives the register three
 * properties for free: no duplicate rows when detection re-runs, a closed risk
 * that stops being detected simply goes quiet, and one that comes back is
 * recognised as the same risk (and reopened) rather than as a new one.
 *
 * Rules recommend; they never act. Nothing here changes an employment record.
 */

export interface RiskPerson {
  id: string;
  fullName: string;
  branchId?: string;
  departmentName?: string;
  status?: string;
  probationStatus?: string;
  probationEndDate?: string;
}

export interface RiskBradford {
  employeeId: string;
  score: number;
  action: BradfordAction;
  episodes: number;
  days: number;
}

/** Thresholds per rule. Organisation- and country-specific values override these. */
export interface RiskRuleSettings {
  /** Warn this many days before a right-to-work document expires. */
  rtwWarningDays: number;
  /** Warn this many days before a probation period ends without a decision. */
  probationWarningDays: number;
  /** Sickness rate rise (percentage points, period on period) that marks a trend. */
  sicknessRiseThreshold: number;
  /** Attendance rate fall (percentage points, period on period) that marks a trend. */
  attendanceFallThreshold: number;
  /** Staffing below this % of target is a problem rather than an opportunity. */
  understaffedBelowPct: number;
  /** Rules switched off by the organisation. */
  disabledRules: string[];
}

export const DEFAULT_RISK_SETTINGS: RiskRuleSettings = {
  rtwWarningDays: 60,
  probationWarningDays: 14,
  sicknessRiseThreshold: 1,
  attendanceFallThreshold: 3,
  understaffedBelowPct: 90,
  disabledRules: [],
};

export interface RiskInput {
  perf: PerfInput;
  people: RiskPerson[];
  bradford: RiskBradford[];
  targets: Record<KpiId, number>;
  settings: RiskRuleSettings;
  /** The tenant's country. Right-to-work rules are UK law and only run there. */
  country?: string;
}

export interface RiskRuleDef {
  id: string;
  label: string;
  description: string;
  /** Countries the rule applies in; every country when unset. */
  countries?: string[];
}

/** Every rule the engine runs, for the settings screen and the reports. */
export const RISK_RULES: RiskRuleDef[] = [
  { id: "rtw-expired", label: "Right to work lapsed", description: "A right-to-work, share code, visa or BRP document has expired or been rejected.", countries: ["uk"] },
  { id: "rtw-expiring", label: "Right to work expiring", description: "A right-to-work document expires within the warning window.", countries: ["uk"] },
  { id: "compliance-docs", label: "Compliance documents outstanding", description: "Expired or rejected employee documents, or DBS checks still pending, at a branch." },
  { id: "bradford", label: "Bradford trigger reached", description: "An employee's Bradford Factor has crossed a review threshold." },
  { id: "sickness-trend", label: "Rising sickness absence", description: "A branch's sickness rate is climbing period on period." },
  { id: "attendance-trend", label: "Falling attendance", description: "A branch's attendance rate is dropping period on period." },
  { id: "probation-overdue", label: "Probation decision overdue", description: "A probation period has ended with no recorded outcome." },
  { id: "probation-due", label: "Probation ending soon", description: "A probation period ends within the warning window with no outcome yet." },
  { id: "understaffed", label: "Branch understaffed", description: "People posted to a branch are well below its headcount target." },
  { id: "overdue-tasks", label: "Overdue work building up", description: "A branch has more overdue tasks than its target allows." },
  { id: "kpi-below-target", label: "Indicator below target", description: "Training, punctuality, task completion or ratings below target, with no immediate risk." },
];

// A passport on its own isn't right-to-work evidence (a citizen's can lapse
// harmlessly), so it is treated as an ordinary compliance document.
const RTW_DOC = /right to work|share code|visa|biometric residence|\bbrp\b/i;
const INACTIVE = new Set(["terminated", "resigned", "exited", "inactive", "left", "offboarded"]);
const IMPROVEMENT_KPIS: KpiId[] = ["training", "punctuality", "taskCompletion", "rating"];

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function docLabel(name: string): string {
  // Bundle documents read "Arjun Taylor — Passport"; the person is shown elsewhere.
  const parts = name.split(" — ");
  return parts.length > 1 ? parts.slice(1).join(" — ") : name;
}

interface Ctx {
  input: RiskInput;
  asOf: string;
  person: Map<string, RiskPerson>;
  branchName: Map<string, string>;
}

function employeeAffected(ctx: Ctx, p: RiskPerson): RiskAffected {
  return {
    scope: "employee",
    ids: [p.id],
    label: p.fullName,
    count: 1,
    branchId: p.branchId,
    branchName: p.branchId ? ctx.branchName.get(p.branchId) : undefined,
    departmentName: p.departmentName,
    people: [{ id: p.id, name: p.fullName }],
  };
}

function branchAffected(ctx: Ctx, branchId: string, peopleIds: string[]): RiskAffected {
  const name = ctx.branchName.get(branchId) ?? branchId;
  const people = peopleIds
    .map((id) => ctx.person.get(id))
    .filter((p): p is RiskPerson => !!p)
    .map((p) => ({ id: p.id, name: p.fullName }));
  return {
    scope: "branch",
    ids: [branchId],
    label: `${name} branch`,
    count: peopleIds.length,
    branchId,
    branchName: name,
    people: people.length > 0 ? people : undefined,
  };
}

function headcount(ctx: Ctx, branchId: string): string[] {
  return ctx.input.people.filter((p) => p.branchId === branchId).map((p) => p.id);
}

// ── Rules ────────────────────────────────────────────────────────────────────

function rightToWork(ctx: Ctx): WorkforceRisk[] {
  const { asOf } = ctx;
  const warnBy = addDays(parseISO(asOf), ctx.input.settings.rtwWarningDays);
  const byPerson = new Map<string, { lapsed: string[]; expiring: { doc: string; on: string; days: number }[] }>();

  for (const d of ctx.input.perf.documents) {
    if (!RTW_DOC.test(d.name) || !ctx.person.has(d.employeeId)) continue;
    const entry = byPerson.get(d.employeeId) ?? { lapsed: [], expiring: [] };
    const expires = d.expiresAt?.slice(0, 10);
    if (d.status === "expired" || d.status === "rejected" || (expires && expires < asOf)) {
      entry.lapsed.push(`${docLabel(d.name)} (${d.status === "rejected" ? "rejected" : `expired${expires ? ` ${expires}` : ""}`})`);
    } else if (expires && parseISO(expires) <= warnBy) {
      entry.expiring.push({ doc: docLabel(d.name), on: expires, days: differenceInCalendarDays(parseISO(expires), parseISO(asOf)) });
    }
    byPerson.set(d.employeeId, entry);
  }

  const out: WorkforceRisk[] = [];
  for (const [employeeId, { lapsed, expiring }] of byPerson) {
    const p = ctx.person.get(employeeId)!;
    if (lapsed.length > 0) {
      out.push({
        id: `rtw-expired:${employeeId}`,
        ruleId: "rtw-expired",
        kind: "existing_problem",
        basis: "actual",
        category: "compliance",
        priority: "critical",
        title: "Right-to-work evidence has lapsed",
        evidence: lapsed.map((l) => ({ label: "Document", value: l })),
        affected: employeeAffected(ctx, p),
        impact: "Employing someone without a valid right-to-work check can carry a civil penalty and removes the employer's statutory excuse.",
        priorityReason: "Critical: the legal obligation is already unmet, so every day adds exposure.",
        recommendedAction: "Contact the employee for current right-to-work evidence, complete and record a fresh check, and take advice before making any change to their employment.",
        suggestedDueDays: 3,
        sourceHref: `/organization/employees/${employeeId}`,
        sourceLabel: "Employee documents",
        fingerprint: lapsed.slice().sort().join("|"),
        detectedOn: asOf,
      });
    }
    if (expiring.length > 0 && lapsed.length === 0) {
      const soonest = expiring.reduce((a, b) => (a.days <= b.days ? a : b));
      out.push({
        id: `rtw-expiring:${employeeId}`,
        ruleId: "rtw-expiring",
        kind: "emerging_risk",
        basis: "actual",
        category: "compliance",
        priority: soonest.days <= 30 ? "high" : "normal",
        title: "Right-to-work document expiring",
        evidence: expiring.map((e) => ({ label: e.doc, value: `expires ${e.on} (in ${plural(e.days, "day")})` })),
        affected: employeeAffected(ctx, p),
        impact: "If the document lapses before a follow-up check, the employer loses its statutory excuse from that date.",
        priorityReason:
          soonest.days <= 30
            ? `High: the earliest document expires in ${plural(soonest.days, "day")}, inside the 30-day window.`
            : `Normal: the earliest expiry is ${plural(soonest.days, "day")} away, inside the ${ctx.input.settings.rtwWarningDays}-day warning window.`,
        recommendedAction: "Ask the employee for their renewed document or share code and schedule the follow-up check before the expiry date.",
        suggestedDueDays: Math.max(1, Math.min(soonest.days - 7, 30)),
        sourceHref: `/organization/employees/${employeeId}`,
        sourceLabel: "Employee documents",
        fingerprint: expiring.map((e) => `${e.doc}@${e.on}`).sort().join("|"),
        detectedOn: asOf,
      });
    }
  }
  return out;
}

function complianceDocs(ctx: Ctx): WorkforceRisk[] {
  const { asOf } = ctx;
  const byBranch = new Map<string, { items: string[]; people: Set<string> }>();
  const add = (employeeId: string, item: string) => {
    const p = ctx.person.get(employeeId);
    if (!p?.branchId) return;
    const entry = byBranch.get(p.branchId) ?? { items: [], people: new Set<string>() };
    entry.items.push(`${p.fullName}: ${item}`);
    entry.people.add(p.id);
    byBranch.set(p.branchId, entry);
  };
  const rtwHandled = ruleApplies("rtw-expired", ctx.input.country);
  for (const d of ctx.input.perf.documents) {
    if (rtwHandled && RTW_DOC.test(d.name)) continue; // right to work has its own, sharper rule
    const expires = d.expiresAt?.slice(0, 10);
    if (d.status === "expired" || d.status === "rejected" || (expires && expires < asOf)) {
      add(d.employeeId, `${docLabel(d.name)} ${d.status === "rejected" ? "rejected" : "expired"}`);
    }
  }
  for (const c of ctx.input.perf.dbsChecks) {
    if (c.status === "pending") add(c.employeeId, "DBS check pending");
    else if (c.expiryDate && c.expiryDate.slice(0, 10) < asOf) add(c.employeeId, "DBS check expired");
  }

  return [...byBranch].map(([branchId, { items, people }]) => {
    const priority: WorkflowTaskPriority = items.length >= 5 ? "high" : "normal";
    return {
      id: `compliance-docs:${branchId}`,
      ruleId: "compliance-docs",
      kind: "existing_problem" as const,
      basis: "actual" as const,
      category: "compliance" as const,
      priority,
      title: "Compliance documents outstanding",
      evidence: [
        { label: "Outstanding items", value: String(items.length) },
        ...items.slice(0, 8).map((i) => ({ label: "Item", value: i })),
        ...(items.length > 8 ? [{ label: "And", value: `${items.length - 8} more` }] : []),
      ],
      affected: branchAffected(ctx, branchId, [...people]),
      impact: "Lapsed or unverified records weaken audit readiness and can leave people working without the checks their role requires.",
      priorityReason:
        priority === "high"
          ? `High: ${items.length} items at one branch suggests the process, not one person, has slipped.`
          : `Normal: ${plural(items.length, "item")} to chase, none of them a right-to-work lapse.`,
      recommendedAction: "Ask the branch manager to collect the missing documents, verify them, and confirm any DBS checks still in progress.",
      suggestedDueDays: 14,
      sourceHref: "/organization/branches",
      sourceLabel: "Branch compliance",
      metric: { label: "Outstanding items", value: items.length, target: 0, unit: "count" as const },
      fingerprint: items.slice().sort().join("|"),
      detectedOn: asOf,
    };
  });
}

const BRADFORD_PRIORITY: Record<BradfordAction, WorkflowTaskPriority | null> = {
  monitor: null,
  manager_review: "normal",
  formal_review: "high",
  senior_hr_review: "critical",
};

const BRADFORD_STEP: Record<BradfordAction, string> = {
  monitor: "",
  manager_review: "an informal absence conversation with their line manager",
  formal_review: "a formal absence review meeting",
  senior_hr_review: "a senior HR absence review",
};

function bradford(ctx: Ctx): WorkforceRisk[] {
  const out: WorkforceRisk[] = [];
  for (const b of ctx.input.bradford) {
    const priority = BRADFORD_PRIORITY[b.action];
    const p = ctx.person.get(b.employeeId);
    if (!priority || !p) continue;
    out.push({
      id: `bradford:${b.employeeId}`,
      ruleId: "bradford",
      kind: "existing_problem",
      basis: "actual",
      category: "absence",
      priority,
      title: "Bradford Factor review threshold reached",
      evidence: [
        { label: "Bradford score", value: String(b.score) },
        { label: "Spells in window", value: String(b.episodes) },
        { label: "Days lost", value: String(b.days) },
      ],
      affected: employeeAffected(ctx, p),
      impact: "Frequent short absences disrupt rotas and cover costs; left unreviewed, any underlying health or workload issue is missed.",
      priorityReason: `${priority === "critical" ? "Critical" : priority === "high" ? "High" : "Normal"}: the score sits in the band that calls for ${BRADFORD_STEP[b.action]}.`,
      recommendedAction: `Arrange ${BRADFORD_STEP[b.action]}, explore any underlying cause, and consider an Occupational Health referral. The score is a prompt for a conversation, not grounds for a decision on its own.`,
      suggestedDueDays: priority === "critical" ? 5 : 10,
      sourceHref: "/time-payroll/sickness",
      sourceLabel: "Sickness & Absence",
      metric: { label: "Bradford score", value: b.score, target: 0, unit: "score" },
      fingerprint: `${b.action}`,
      detectedOn: ctx.asOf,
    });
  }
  return out;
}

function trends(ctx: Ctx, rows: BranchPerformanceRow[]): WorkforceRisk[] {
  const { settings, targets } = ctx.input;
  const out: WorkforceRisk[] = [];
  for (const r of rows) {
    const people = headcount(ctx, r.branch.id);
    const sick = r.values.sicknessRate;
    const sickPrev = r.previous.sicknessRate;
    if (sick != null && sickPrev != null && sick - sickPrev >= settings.sicknessRiseThreshold) {
      const over = sick > targets.sicknessRate;
      out.push({
        id: `sickness-trend:${r.branch.id}`,
        ruleId: "sickness-trend",
        kind: "emerging_risk",
        basis: "forecast",
        category: "absence",
        priority: over ? "high" : "normal",
        title: "Sickness absence is rising",
        evidence: [
          { label: "Last 30 days", value: formatKpi("sicknessRate", sick) },
          { label: "Previous 30 days", value: formatKpi("sicknessRate", sickPrev) },
          { label: "Target", value: `${formatKpi("sicknessRate", targets.sicknessRate)} or less` },
        ],
        affected: branchAffected(ctx, r.branch.id, people),
        impact: "If the trend continues, cover costs and overtime rise and the remaining team is stretched, which tends to drive further absence.",
        priorityReason: over
          ? "High: the rate is rising and already above target."
          : "Normal: the rate is rising but still within target. This is an early warning.",
        recommendedAction: "Review the absence pattern with the branch manager, check for a common cause (workload, a team, a season), and agree a targeted attendance intervention.",
        suggestedDueDays: 14,
        sourceHref: "/organization/branches",
        sourceLabel: "Branch performance",
        metric: { label: "Sickness rate", value: sick, target: targets.sicknessRate, unit: "pct" },
        fingerprint: `${over ? "over" : "within"}`,
        detectedOn: ctx.asOf,
      });
    }

    const att = r.values.attendance;
    const attPrev = r.previous.attendance;
    if (att != null && attPrev != null && attPrev - att >= settings.attendanceFallThreshold) {
      const under = att < targets.attendance;
      out.push({
        id: `attendance-trend:${r.branch.id}`,
        ruleId: "attendance-trend",
        kind: "emerging_risk",
        basis: "forecast",
        category: "attendance",
        priority: under ? "high" : "normal",
        title: "Attendance is falling",
        evidence: [
          { label: "Last 30 days", value: formatKpi("attendance", att) },
          { label: "Previous 30 days", value: formatKpi("attendance", attPrev) },
          { label: "Target", value: formatKpi("attendance", targets.attendance) },
        ],
        affected: branchAffected(ctx, r.branch.id, people),
        impact: "A continuing fall in attendance reduces service capacity and, if it settles in, becomes an ongoing staffing cost.",
        priorityReason: under
          ? "High: attendance is falling and already below target."
          : "Normal: attendance is falling but still at or above target.",
        recommendedAction: "Look at who and which shifts account for the drop, and agree a targeted attendance-management plan with the branch manager.",
        suggestedDueDays: 14,
        sourceHref: "/time-payroll/attendance",
        sourceLabel: "Attendance",
        metric: { label: "Attendance rate", value: att, target: targets.attendance, unit: "pct" },
        fingerprint: `${under ? "under" : "within"}`,
        detectedOn: ctx.asOf,
      });
    }
  }
  return out;
}

function branchTargets(ctx: Ctx, rows: BranchPerformanceRow[]): WorkforceRisk[] {
  const { targets, settings } = ctx.input;
  const out: WorkforceRisk[] = [];
  for (const r of rows) {
    const people = headcount(ctx, r.branch.id);

    const staffing = r.values.staffing;
    if (staffing != null && staffing < targets.staffing) {
      const severe = staffing < settings.understaffedBelowPct;
      out.push({
        id: `understaffed:${r.branch.id}`,
        ruleId: "understaffed",
        kind: severe ? "existing_problem" : "improvement",
        basis: "actual",
        category: "staffing",
        priority: severe ? "high" : "low",
        title: severe ? "Branch is understaffed" : "Branch is below its headcount target",
        evidence: [
          { label: "Staffing vs target", value: formatKpi("staffing", staffing) },
          { label: "People posted", value: String(r.headcount) },
          { label: "Headcount target", value: String(r.branch.headcountTarget ?? "—") },
        ],
        affected: branchAffected(ctx, r.branch.id, people),
        impact: severe
          ? "The team is carrying vacant roles, which drives overtime, missed work and burnout."
          : "Small gap to plan; filling it would ease pressure but nothing is at immediate risk.",
        priorityReason: severe
          ? `High: staffing is under ${settings.understaffedBelowPct}% of target.`
          : `Low: within ${settings.understaffedBelowPct}% of target.`,
        recommendedAction: severe
          ? "Confirm the vacancies with the branch manager and raise a workforce request or requisition for the gap; consider temporary cover meanwhile."
          : "Review the gap at the next workforce planning cycle.",
        suggestedDueDays: severe ? 14 : 30,
        sourceHref: "/organization/headcount",
        sourceLabel: "Headcount planning",
        metric: { label: "Staffing vs target", value: staffing, target: targets.staffing, unit: "pct" },
        fingerprint: severe ? "severe" : "minor",
        detectedOn: ctx.asOf,
      });
    }

    const overdue = r.values.overdueTasks;
    if (overdue != null && overdue > targets.overdueTasks) {
      out.push({
        id: `overdue-tasks:${r.branch.id}`,
        ruleId: "overdue-tasks",
        kind: "existing_problem",
        basis: "actual",
        category: "workload",
        priority: overdue >= targets.overdueTasks * 2 ? "high" : "normal",
        title: "Overdue work is building up",
        evidence: [
          { label: "Overdue tasks", value: String(overdue) },
          { label: "Target", value: `${targets.overdueTasks} or fewer` },
        ],
        affected: branchAffected(ctx, r.branch.id, people),
        impact: "Backlogs compound: late tasks delay the work that depends on them and hide which items genuinely matter.",
        priorityReason:
          overdue >= targets.overdueTasks * 2
            ? "High: at least double the tolerated backlog."
            : "Normal: above the tolerated backlog.",
        recommendedAction: "Have the branch manager triage the overdue list: close, reassign or re-date each item, and flag anything blocked.",
        suggestedDueDays: 7,
        sourceHref: "/organization/branches",
        sourceLabel: "Branch performance",
        metric: { label: "Overdue tasks", value: overdue, target: targets.overdueTasks, unit: "count" },
        fingerprint: overdue >= targets.overdueTasks * 2 ? "double" : "over",
        detectedOn: ctx.asOf,
      });
    }

    for (const kpi of IMPROVEMENT_KPIS) {
      const v = r.values[kpi];
      const t = targets[kpi];
      if (v == null || v >= t) continue;
      const def = KPI_BY_ID[kpi];
      const gap = t - v;
      out.push({
        id: `kpi-below-target:${r.branch.id}:${kpi}`,
        ruleId: "kpi-below-target",
        kind: "improvement",
        basis: "actual",
        category: kpi === "training" ? "learning" : kpi === "punctuality" ? "attendance" : "performance",
        priority: def.unit === "rating" ? (gap >= 0.5 ? "normal" : "low") : gap >= 10 ? "normal" : "low",
        title: `${def.label} below target`,
        evidence: [
          { label: "Last 30 days", value: formatKpi(kpi, v) },
          { label: "Target", value: formatKpi(kpi, t) },
          { label: "Measured from", value: def.source },
        ],
        affected: branchAffected(ctx, r.branch.id, people),
        impact: "No immediate risk, but closing the gap would lift the branch's overall performance score.",
        priorityReason: "Improvement opportunity: below target with no compliance or safety exposure.",
        recommendedAction:
          kpi === "training"
            ? "Send reminders for incomplete enrolments and agree protected time to finish them."
            : kpi === "punctuality"
              ? "Share punctuality figures with the team and review rota start times with the branch manager."
              : kpi === "taskCompletion"
                ? "Review task load and due dates with the branch manager to see where work is stalling."
                : "Discuss development support for the branch's lowest-rated reviews at the next calibration.",
        suggestedDueDays: 30,
        sourceHref: "/organization/branches",
        sourceLabel: "Branch performance",
        metric: { label: def.label, value: v, target: t, unit: def.unit === "rating" ? "score" : "pct" },
        fingerprint: `${Math.floor(gap / (def.unit === "rating" ? 0.5 : 5))}`,
        detectedOn: ctx.asOf,
      });
    }
  }
  return out;
}

function probation(ctx: Ctx): WorkforceRisk[] {
  const { asOf } = ctx;
  const out: WorkforceRisk[] = [];
  for (const p of ctx.input.people) {
    if (p.probationStatus?.toLowerCase() !== "open" || !p.probationEndDate) continue;
    const end = p.probationEndDate.slice(0, 10);
    const days = differenceInCalendarDays(parseISO(end), parseISO(asOf));
    if (days < 0) {
      out.push({
        id: `probation-overdue:${p.id}`,
        ruleId: "probation-overdue",
        kind: "existing_problem",
        basis: "actual",
        category: "performance",
        priority: days < -30 ? "high" : "normal",
        title: "Probation ended without a decision",
        evidence: [
          { label: "Probation end date", value: end },
          { label: "Days past", value: String(-days) },
          { label: "Recorded status", value: p.probationStatus ?? "—" },
        ],
        affected: employeeAffected(ctx, p),
        impact: "An undecided probation leaves the employee uncertain and the organisation without a documented decision if one is later needed.",
        priorityReason: days < -30 ? "High: more than 30 days past the end date." : "Normal: recently past the end date.",
        recommendedAction: "Ask the line manager to hold the probation review and record the outcome (confirm, extend with objectives, or seek HR advice).",
        suggestedDueDays: 7,
        sourceHref: `/organization/employees/${p.id}`,
        sourceLabel: "Employee record",
        fingerprint: end,
        detectedOn: asOf,
      });
    } else if (days <= ctx.input.settings.probationWarningDays) {
      out.push({
        id: `probation-due:${p.id}`,
        ruleId: "probation-due",
        kind: "emerging_risk",
        basis: "actual",
        category: "performance",
        priority: "normal",
        title: "Probation ending soon",
        evidence: [
          { label: "Probation end date", value: end },
          { label: "Days left", value: String(days) },
        ],
        affected: employeeAffected(ctx, p),
        impact: "If the review isn't held before the end date, the probation lapses without a documented decision.",
        priorityReason: `Normal: ends within the ${ctx.input.settings.probationWarningDays}-day warning window.`,
        recommendedAction: "Book the probation review meeting with the line manager before the end date.",
        suggestedDueDays: Math.max(1, days),
        sourceHref: `/organization/employees/${p.id}`,
        sourceLabel: "Employee record",
        fingerprint: end,
        detectedOn: asOf,
      });
    }
  }
  return out;
}

// ── Entry point ──────────────────────────────────────────────────────────────

/** Whether a rule runs in this country (e.g. UK-only right to work). */
export function ruleApplies(ruleId: string, country: string | undefined): boolean {
  const countries = RISK_RULES.find((r) => r.id === ruleId)?.countries;
  return !countries || (country != null && countries.includes(country));
}

/** Every live risk, most urgent first, existing problems before emerging ones. */
export function detectRisks(input: RiskInput): WorkforceRisk[] {
  const asOf = input.perf.asOf;
  const active = input.people.filter((p) => !INACTIVE.has((p.status ?? "").toLowerCase()));
  const scoped: RiskInput = { ...input, people: active };
  const ctx: Ctx = {
    input: scoped,
    asOf,
    person: new Map(active.map((p) => [p.id, p])),
    branchName: new Map(input.perf.branches.map((b) => [b.id, b.name])),
  };
  const branchIds = input.perf.branches.filter((b) => b.status === "active").map((b) => b.id);
  const rows = buildRows(input.perf, branchIds, periodRange("30d", asOf), []);

  const all = [
    ...rightToWork(ctx),
    ...complianceDocs(ctx),
    ...bradford(ctx),
    ...trends(ctx, rows),
    ...branchTargets(ctx, rows),
    ...probation(ctx),
  ].filter((r) => ruleApplies(r.ruleId, input.country) && !input.settings.disabledRules.includes(r.ruleId));

  const kindRank = { existing_problem: 0, emerging_risk: 1, improvement: 2 } as const;
  return all.sort(
    (a, b) =>
      RISK_PRIORITY_RANK[a.priority] - RISK_PRIORITY_RANK[b.priority] ||
      kindRank[a.kind] - kindRank[b.kind] ||
      a.title.localeCompare(b.title),
  );
}
