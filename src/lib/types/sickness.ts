/**
 * MOTEE Absence & Sickness Management — the data model.
 *
 * Sickness used to be one leave type among many. It now has its own records,
 * approval chain, sick-pay schemes, Bradford Factor scoring, review cases and
 * return-to-work process. The entities mirror the client's brief:
 *
 *   absence_records             → SicknessRecord
 *   sickness_schemes            → SicknessScheme
 *   employee_scheme_assignments → SchemeEnrolment
 *   bradford_scores             → BradfordSnapshot
 *   absence_review_cases        → AbsenceReviewCase
 *   absence_documents           → SicknessDocument (on the record)
 *   absence_audit_logs          → SicknessAuditEntry
 *
 * Every record carries `tenantId` so each Motee customer's data is isolated.
 * Medical detail (`reasonDetail`, documents) is special-category data — the UI
 * only reveals it to authorised HR users and logs every reveal.
 */

import type { SicknessReasonCategory } from "@/src/lib/constants/sickness";

// ── Absence records ──────────────────────────────────────────────────────────

/** Approval state of the absence notification itself. */
export type SicknessApprovalStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "cancelled";

/** Whether the person is still off. */
export type AbsenceState = "ongoing" | "returned";

/** "What do you want to do?" on the Report Sickness form. */
export type SicknessKind = "sickness" | "medical_procedure";

export type SicknessSource = "self" | "manager" | "hr" | "time_attendance";

export const SICKNESS_SOURCE_LABELS: Record<SicknessSource, string> = {
  self: "Self-reported",
  manager: "Reported by manager",
  hr: "Logged by HR",
  time_attendance: "From time & attendance",
};

/** Which part of a day the absence covers on its first/last day. */
export type DayPortion = "full" | "am" | "pm";

export type FitNoteStatus = "not_required" | "self_certified" | "awaiting" | "received" | "expired";

export const FIT_NOTE_STATUS_LABELS: Record<FitNoteStatus, string> = {
  not_required: "Not required",
  self_certified: "Self-certified",
  awaiting: "Fit note awaited",
  received: "Fit note received",
  expired: "Fit note expired",
};

export const FIT_NOTE_STATUS_STYLES: Record<FitNoteStatus, string> = {
  not_required: "border-border bg-muted text-muted-foreground",
  self_certified: "border-sky-500/30 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400",
  awaiting: "border-amber-500/30 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  received: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
  expired: "border-rose-500/30 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
};

export type SicknessDocumentKind = "fit_note" | "self_certificate" | "hospital_letter" | "other";

export const DOCUMENT_KIND_LABELS: Record<SicknessDocumentKind, string> = {
  fit_note: "Fit note",
  self_certificate: "Self-certificate",
  hospital_letter: "Hospital / GP letter",
  other: "Other",
};

export interface SicknessDocument {
  id: string;
  kind: SicknessDocumentKind;
  name: string;
  sizeBytes?: number;
  /** Small uploads are kept inline for the demo; production stores a URL. */
  dataUrl?: string;
  /** Fit-note validity window. */
  validFrom?: string;
  validTo?: string;
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * Why HR treats an absence differently. Protected absences are excluded from
 * the Bradford score when HR records the exclusion — the Equality Act 2010
 * requires disability- and pregnancy-related absence to be considered
 * separately.
 */
export type ProtectedCategory = "disability" | "pregnancy" | "industrial_injury" | "adjustment_related" | "other";

export const PROTECTED_CATEGORY_LABELS: Record<ProtectedCategory, string> = {
  disability: "Disability-related",
  pregnancy: "Pregnancy-related",
  industrial_injury: "Industrial injury",
  adjustment_related: "Linked to a reasonable adjustment",
  other: "Other circumstance",
};

export interface BradfordExclusion {
  category: ProtectedCategory;
  reason: string;
  approvedBy: string;
  approvedAt: string;
}

export type RtwStatus = "not_due" | "pending" | "completed";

export interface ReturnToWork {
  status: RtwStatus;
  /** When the person actually came back. */
  returnDate?: string;
  /** Their last day of sickness (may differ from the day before return). */
  lastSickDay?: string;
  lastDayPortion?: DayPortion;
  interviewRequired: boolean;
  interviewHeld?: boolean;
  interviewDate?: string;
  interviewer?: string;
  /** Safe to return to work — required to complete the RTW. */
  safeToReturn?: boolean;
  /** Employee's own confirmation they are back (self-service). */
  employeeConfirmedAt?: string;
  notes?: string;
  adjustmentsRecommended?: boolean;
  ohReferralRecommended?: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface SicknessRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  branchId?: string;
  managerId?: string | null;

  kind: SicknessKind;
  startDate: string;
  startPortion: DayPortion;
  /** Time the person left work if they went home sick part-way through. */
  leftWorkAt?: string;
  /** Null while ongoing. */
  endDate: string | null;
  endPortion: DayPortion;
  /** Shift start/end for overnight workers — a shift belongs to its start date. */
  overnightShift?: boolean;
  expectedReturnDate?: string;

  reasonCategory: SicknessReasonCategory;
  /** Confidential — what the employee said. Authorised HR only. */
  reasonDetail?: string;
  /** When the employee first notified the business. */
  notifiedAt: string;
  hospitalised: boolean;

  source: SicknessSource;
  reportedBy: { employeeId?: string; name: string };
  reportedAt: string;

  approvalStatus: SicknessApprovalStatus;
  approvalRequestId?: string;
  absenceState: AbsenceState;

  fitNoteStatus: FitNoteStatus;
  documents: SicknessDocument[];

  /** Same illness recurring within the linking window — one period of incapacity. */
  linkedRecordId?: string;
  /** An existing case this episode belongs to (OH referral or review case). */
  linkedCaseId?: string;
  ohReferralId?: string;

  exclusion?: BradfordExclusion;
  rtw: ReturnToWork;

  createdAt: string;
  updatedAt: string;
}

// ── Sickness schemes (occupational sick pay) ─────────────────────────────────

export type EntitlementPeriod = "rolling" | "leave_year" | "per_spell" | "length_of_service";
export type EntitlementUnit = "contracted_days" | "calendar_days" | "hours" | "weeks";

export const ENTITLEMENT_PERIOD_LABELS: Record<EntitlementPeriod, string> = {
  rolling: "Rolling period",
  leave_year: "Leave year",
  per_spell: "Each spell of sickness",
  length_of_service: "Length of service bands",
};

export const ENTITLEMENT_UNIT_LABELS: Record<EntitlementUnit, string> = {
  contracted_days: "Contracted work days",
  calendar_days: "Calendar days",
  hours: "Hours",
  weeks: "Weeks",
};

/** One pay step, consumed in order. After the last step sickness is unpaid (SSP aside). */
export interface SchemeStep {
  id: string;
  label: string;
  amount: number;
  /** % of normal pay: 100 full, 50 half, 0 SSP-only. */
  payPercent: number;
}

/** Service-based entitlement — longer service, bigger steps. */
export interface ServiceBand {
  id: string;
  minServiceMonths: number;
  steps: SchemeStep[];
}

export type PartTimeFormula = "days_ratio" | "hours_ratio" | "no_proration";

export const PART_TIME_FORMULA_LABELS: Record<PartTimeFormula, string> = {
  days_ratio: "Full time entitlement × (employee's average days per week / full time days per week)",
  hours_ratio: "Full time entitlement × (employee's weekly hours / full time weekly hours)",
  no_proration: "No pro-rating — part-time workers get the full entitlement",
};

export type SchemeStatus = "draft" | "active" | "archived";

export interface SicknessScheme {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  reference?: string;
  status: SchemeStatus;
  kind: "system" | "custom";

  period: EntitlementPeriod;
  rollingMonths: number;
  unit: EntitlementUnit;
  steps: SchemeStep[];
  serviceBands: ServiceBand[];

  publicHoliday: "holiday_precedence" | "ignore";
  fullTimeWeeklyHours: number;
  fullTimeDaysPerWeek: number;
  partTimeFormula: PartTimeFormula;

  eligibility: {
    minServiceDays: number;
    /** Empty = every employment type. */
    employmentTypeIds: string[];
    excludeProbation: boolean;
  };
  /** Days at the start of each spell before company sick pay starts. */
  waitingDays: number;
  /** Spells this close together (calendar days) are linked as one period of incapacity. */
  linkingDays: number;
  /** Pay statutory sick pay where company pay runs out or is below it (UK). */
  applyStatutory: boolean;

  notifyOnSick: string[];
  notifyOnReturn: string[];

  advanced: {
    selfCertDays: number;
    rtwInterview: "always" | "after_days" | "never";
    rtwAfterDays: number;
    ohReferralAfterDays: number;
    payrollCode?: string;
    exportToPayroll: boolean;
  };

  lastModifiedBy: string;
  lastModifiedAt: string;
  createdAt: string;
}

export interface SchemeEnrolment {
  id: string;
  tenantId: string;
  employeeId: string;
  schemeId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  enrolledBy: string;
  enrolledAt: string;
}

/** Notification recipients a scheme can target. */
export const NOTIFY_ROLES = [
  { id: "line_manager", label: "Manager" },
  { id: "hr_contact", label: "HR Contact" },
  { id: "hr_admin", label: "HR Administrator" },
  { id: "hr_admin_no_payroll", label: "HR Admin No Payroll" },
  { id: "payroll", label: "Payroll" },
  { id: "approver", label: "Approver" },
  { id: "administrator", label: "Administrator" },
  { id: "employee", label: "Employee" },
  { id: "oh_provider", label: "Occupational Health" },
] as const;

// ── Bradford Factor ──────────────────────────────────────────────────────────

export type BradfordAction = "monitor" | "manager_review" | "formal_review" | "senior_hr_review";

export const BRADFORD_ACTION_LABELS: Record<BradfordAction, string> = {
  monitor: "Normal monitoring",
  manager_review: "Manager review suggested",
  formal_review: "Formal attendance review suggested",
  senior_hr_review: "Senior HR review suggested",
};

export interface BradfordThreshold {
  id: string;
  min: number;
  label: string;
  action: BradfordAction;
}

export const BRADFORD_ACTION_STYLES: Record<BradfordAction, string> = {
  monitor: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
  manager_review: "border-sky-500/30 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400",
  formal_review: "border-amber-500/30 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  senior_hr_review: "border-rose-500/30 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
};

export interface BradfordSettings {
  /** Rolling window, normally 52 weeks. */
  windowWeeks: number;
  /**
   * Absences separated by no more than this many calendar days of non-working
   * time count as one episode (e.g. sick Friday and Monday = one spell).
   */
  mergeAcrossNonWorkingDays: boolean;
  thresholds: BradfordThreshold[];
  /** Count half-days as 0.5 rather than a full day. */
  halfDaysAsHalf: boolean;
  /** Exclude records HR has marked as protected (disability, pregnancy…). */
  honourExclusions: boolean;
  /** Bumped whenever the calculation rules change, stored on each snapshot. */
  calcVersion: number;
}

export interface BradfordSnapshot {
  id: string;
  tenantId: string;
  employeeId: string;
  computedAt: string;
  windowStart: string;
  windowEnd: string;
  episodes: number;
  days: number;
  score: number;
  action: BradfordAction;
  calcVersion: number;
  /** What changed to trigger the recalculation. */
  trigger: string;
}

// ── Review cases ─────────────────────────────────────────────────────────────

export type ReviewCaseStatus = "open" | "in_review" | "closed";

export type ReviewOutcome =
  | "no_action"
  | "informal_discussion"
  | "support_plan"
  | "oh_referral"
  | "adjustments"
  | "formal_attendance_meeting";

export const REVIEW_OUTCOME_LABELS: Record<ReviewOutcome, string> = {
  no_action: "No action needed",
  informal_discussion: "Informal welfare discussion",
  support_plan: "Attendance support plan",
  oh_referral: "Refer to Occupational Health",
  adjustments: "Consider reasonable adjustments",
  formal_attendance_meeting: "Formal attendance meeting",
};

export type ReviewTrigger = "bradford_threshold" | "rtw_interview" | "policy_review" | "long_term" | "fit_note";

export const REVIEW_TRIGGER_LABELS: Record<ReviewTrigger, string> = {
  bradford_threshold: "Bradford threshold reached",
  rtw_interview: "Return-to-work interview due",
  policy_review: "Sickness policy review",
  long_term: "Long-term absence",
  fit_note: "Fit note overdue",
};

export interface AbsenceReviewCase {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  trigger: ReviewTrigger;
  action?: BradfordAction;
  scoreAtOpen?: number;
  status: ReviewCaseStatus;
  openedAt: string;
  owner: string;
  dueDate?: string;
  recordIds: string[];
  /**
   * The checks HR must complete before any outcome — the Bradford score is a
   * prompt for a human conversation, never an automatic sanction.
   */
  considerations: {
    disability: boolean;
    pregnancy: boolean;
    adjustments: boolean;
    otherCircumstances: boolean;
  };
  outcome?: ReviewOutcome;
  outcomeNotes?: string;
  closedBy?: string;
  closedAt?: string;
}

// ── Audit ────────────────────────────────────────────────────────────────────

export type SicknessAuditAction =
  | "created"
  | "updated"
  | "approved"
  | "rejected"
  | "returned"
  | "document_added"
  | "medical_viewed"
  | "exclusion_set"
  | "exclusion_removed"
  | "rtw_completed"
  | "oh_referred"
  | "review_opened"
  | "review_closed"
  | "scheme_enrolled"
  | "scheme_changed"
  | "score_recalculated"
  | "retention_purged";

export interface SicknessAuditEntry {
  id: string;
  tenantId: string;
  at: string;
  actor: string;
  action: SicknessAuditAction;
  /** Record, case, scheme or employee the entry is about. */
  subjectId: string;
  employeeId?: string;
  note?: string;
}

// ── Settings ─────────────────────────────────────────────────────────────────

export interface SicknessSettings {
  bradford: BradfordSettings;
  /** Calendar days off in one spell before the absence counts as long-term. */
  longTermDays: number;
  /** Continuous days off before an OH referral is suggested to HR. */
  ohTriggerDays: number;
  /** Self-certification limit before a fit note is needed (UK: 7 days). */
  selfCertDays: number;
  /** Months to keep closed sickness records before anonymising them. */
  retentionMonths: number;
}
