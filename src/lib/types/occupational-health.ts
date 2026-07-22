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
  /** Recommended workplace adjustments — the only clinical-adjacent output stored. */
  recommendedAdjustments: string[];
  /** Whether Equality Act 2010 (UK) considerations were flagged. */
  equalityActConsidered: boolean;
  expectedReturnDate?: string;
  /** Administrative, non-medical notes only. */
  caseNotes?: string;
  // Intentionally NO `diagnosis` / `condition` / `medicalDetail` field. See header.
}
