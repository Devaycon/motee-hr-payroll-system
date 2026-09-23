// Occupational Health (OH) referral model (§18).
//
// OH is a FORMAL process distinct from ordinary sickness absence: HR seeks advice
// from an OH professional on an employee's fitness for work and any workplace
// adjustments.
//
// ⚠️ DATA-PRIVACY CONSTRAINT (do not remove):
// The OH clinician never tells the employer the employee's medical DIAGNOSIS.
// This schema therefore has NO diagnosis field, and one must never be added.
// We store only: fitness-for-work status and recommended workplace adjustments.

/** Ordered workflow stages — the referral state machine. */
export const OH_STAGES = [
  { key: "absence_recorded", label: "Absence recorded" },
  { key: "monitoring", label: "Monitoring duration" },
  { key: "threshold_reached", label: "Threshold reached" },
  { key: "hr_alerted", label: "HR alerted" },
  { key: "referred", label: "Referred to OH" },
  { key: "assessment_completed", label: "Assessment completed" },
  { key: "recommendations_received", label: "Recommendations received" },
  { key: "hr_review", label: "HR review" },
  { key: "adjustments_implemented", label: "Adjustments implemented" },
  { key: "returned", label: "Employee returned" },
  { key: "rtw_completed", label: "Return-to-work interview" },
  { key: "closed", label: "Case closed" },
] as const;

export type OHStatus = (typeof OH_STAGES)[number]["key"];

export function ohStageIndex(status: OHStatus): number {
  return OH_STAGES.findIndex((s) => s.key === status);
}

/** OH advises on fitness for work only — never a diagnosis. */
export type OHFitnessStatus =
  | "pending"
  | "fit"
  | "fit_with_adjustments"
  | "temporarily_unfit"
  | "unfit";

export const OH_FITNESS_LABELS: Record<OHFitnessStatus, string> = {
  pending: "Pending assessment",
  fit: "Fit for work",
  fit_with_adjustments: "Fit with adjustments",
  temporarily_unfit: "Temporarily unfit",
  unfit: "Unfit for work",
};

export const OH_FITNESS_STYLES: Record<OHFitnessStatus, string> = {
  pending: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  fit: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  fit_with_adjustments: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  temporarily_unfit: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  unfit: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

/**
 * §10.2 (Correction 2 feedback) — what needs to happen next on a case, and
 * who owns it. Turns the board from a status screen into an action centre.
 */
export interface OHNextAction {
  label: string;
  owner: string;
  due: string; // ISO date
}

/**
 * §10.5 — Adjustments get their own lifecycle rather than being a bare
 * string list. `description` is the only clinical-adjacent text stored,
 * same privacy constraint as the rest of this file (no diagnosis).
 */
export type AdjustmentStatus =
  | "proposed"
  | "agreed"
  | "implemented"
  | "reviewed"
  | "closed";

export const ADJUSTMENT_STATUS_LABELS: Record<AdjustmentStatus, string> = {
  proposed: "Proposed",
  agreed: "Agreed",
  implemented: "Implemented",
  reviewed: "Reviewed",
  closed: "Closed",
};

export const ADJUSTMENT_STATUS_STYLES: Record<AdjustmentStatus, string> = {
  proposed: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  agreed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  implemented: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  reviewed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  closed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export interface AdjustmentRecord {
  id: string;
  /** e.g. "Phased return over 4 weeks" — the recommended adjustment itself. */
  description: string;
  dateRecommended: string;
  agreedBy?: string;
  implementationOwner?: string;
  effectiveDate?: string;
  reviewDate?: string;
  status: AdjustmentStatus;
}

/** A single entry in a case's timeline / audit history (§10.10 "View Case"). */
export interface OHHistoryEvent {
  id: string;
  at: string;
  actorName: string;
  note: string;
}

export interface OHReferral {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  /** Start of the continuous absence that triggered monitoring. */
  absenceStartDate: string;
  referralDate?: string;
  assessmentDate?: string;
  status: OHStatus;
  fitnessStatus: OHFitnessStatus;
  /** §10.5 — full adjustment lifecycle records (replaces a bare string list). */
  adjustments: AdjustmentRecord[];
  /**
   * Whether reasonable-adjustments-under-the-Equality-Act considerations
   * were flagged for this case (§10.4 — badge relabelled from "Equality Act
   * 2010"; the underlying field name is kept so it isn't a wider rename).
   */
  equalityActConsidered: boolean;
  expectedReturnDate?: string;
  /** Administrative, non-medical notes only. */
  caseNotes?: string;
  /** §10.2/§10.3 — who is driving this case forward, for the owner filter. */
  caseOwner: string;
  /** §10.2 — the single next step, surfaced on the card as an action CTA. */
  nextAction?: OHNextAction;
  /** §10.6 "Reviews Due" — next date this case needs a scheduled review. */
  reviewDate?: string;
  /** §10.9/§10.10 — timeline shown on the "View Case" detail route. */
  history?: OHHistoryEvent[];
  // Intentionally NO `diagnosis` / `condition` / `medicalDetail` field. See header.
}

/** Fields a line manager may see (§10.8) — no confidential OH correspondence. */
export interface OHManagerView {
  id: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  fitnessStatus: OHFitnessStatus;
  adjustmentDescriptions: string[];
  reviewDate?: string;
}

export function ohManagerView(r: OHReferral): OHManagerView {
  return {
    id: r.id,
    employeeName: r.employeeName,
    employeeInitials: r.employeeInitials,
    department: r.department,
    fitnessStatus: r.fitnessStatus,
    adjustmentDescriptions: r.adjustments.map((a) => a.description),
    reviewDate: r.reviewDate,
  };
}
