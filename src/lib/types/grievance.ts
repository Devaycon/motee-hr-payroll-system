// Unified "Employee Relations Cases" model.
// One case model covers grievance, disciplinary and all related complaint types,
// progressing through a single 8-stage workflow.

export type CaseComplaintType =
  | "grievance"
  | "disciplinary"
  | "harassment"
  | "discrimination"
  | "pay_dispute"
  | "misconduct"
  | "attendance"
  | "policy_violation"
  | "working_conditions"
  // Client feedback §5.1 — case types the client explicitly asked for.
  | "bullying_harassment"
  | "absence_management"
  | "performance_improvement"
  | "capability"
  | "whistleblowing"
  | "health_safety"
  | "equality_diversity"
  | "appeal"
  | "investigation"
  | "safeguarding";

export type CaseStage =
  | "raised"
  | "triage"
  | "assigned"
  | "investigation"
  | "hearing"
  | "outcome_issued"
  | "appeal"
  | "closed";

export type ConfidentialityLevel =
  | "standard"
  | "confidential"
  | "highly_confidential"
  /** §5.8 — tighter than "highly confidential"; named individuals only. */
  | "restricted";

export type CaseOutcome =
  | "verbal_warning"
  | "written_warning"
  | "final_written_warning"
  | "suspension"
  | "demotion"
  | "termination"
  | "no_action"
  | "upheld"
  | "partially_upheld"
  | "not_upheld"
  | "resolved"
  // §5.6 — the client's standard outcome list.
  | "no_case_to_answer"
  | "informal_resolution"
  | "mediation"
  | "training_required"
  | "policy_update";

/** §5.12 — who a case note is visible to. */
export type NoteVisibility = "hr_only" | "case_team" | "employee_visible";

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  hr_only: "HR Only",
  case_team: "Case Team",
  employee_visible: "Employee Visible",
};

/** §5.4 — meetings held as part of a case. */
export type CaseMeetingKind =
  | "investigation"
  | "disciplinary_hearing"
  | "grievance_meeting"
  | "appeal_hearing";

export const CASE_MEETING_LABELS: Record<CaseMeetingKind, string> = {
  investigation: "Investigation meeting",
  disciplinary_hearing: "Disciplinary hearing",
  grievance_meeting: "Grievance meeting",
  appeal_hearing: "Appeal hearing",
};

export interface CaseMeeting {
  id: string;
  kind: CaseMeetingKind;
  date: string;
  time?: string;
  /** Employee ids or free-text names of who attended. */
  attendees: string[];
  notes?: string;
  outcome?: string;
  createdAt: string;
}

/** §5.5 — one entry in the case's chronological activity log. */
export interface CaseActivityEntry {
  id: string;
  at: string;
  actorName: string;
  action: string;
  detail?: string;
}

export type CasePriority = "low" | "medium" | "high" | "urgent";

export interface CaseNote {
  id: string;
  authorName: string;
  authorInitials: string;
  message?: string;
  content: string;
  createdAt: string;
  isPrivate?: boolean;
  isInternal?: boolean;
  /**
   * §5.12 — a single "internal" flag couldn't express the middle ground where
   * the case team sees a note but the employee doesn't. Falls back to
   * `isInternal` for notes written before this existed.
   */
  visibility?: NoteVisibility;
}

export interface CaseWitness {
  name: string;
  statement?: string;
}

export interface CaseEvidence {
  name: string;
  url?: string;
  uploadedAt: string;
}

export interface ERCase {
  id: string;
  /** Human-readable case ID, e.g. ERC-001. */
  caseNumber: string;
  complaintType: CaseComplaintType;
  employeeName: string;
  employeeInitials: string;
  employeeDept: string;
  dateRaised: string;
  incidentDate?: string;
  description: string;
  stage: CaseStage;
  priority: CasePriority;
  confidentialityLevel: ConfidentialityLevel;
  assignedTo?: string;
  assignedInitials?: string;
  /** §5.12 — the person accountable for the case, distinct from the investigator. */
  caseOwner?: string;
  /** §5.7 — links the case to the employee record it concerns. */
  employeeId?: string;
  // §5.3 — dates and SLAs. Overdue is derived by comparing these to today.
  targetResolutionDate?: string;
  investigationDueDate?: string;
  outcomeDueDate?: string;
  // Investigation
  witnesses: CaseWitness[];
  evidence: CaseEvidence[];
  // Hearing
  hearingDate?: string;
  hearingPanel: string[];
  // Outcome
  outcome?: CaseOutcome | string;
  outcomeDate?: string;
  suspensionDays?: number;
  // Appeal
  hasAppeal: boolean;
  appealCaseId?: string;
  appealReviewer?: string;
  appealGrounds?: string;
  // Closure
  retentionPeriod?: string;
  closureDate?: string;
  // Trail
  notes: CaseNote[];
  /** §5.4 — investigation meetings, hearings and appeal hearings. */
  meetings?: CaseMeeting[];
  /** §5.5 — full chronological activity log. */
  activity?: CaseActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

/** Days a case has been open, for the SLA display (§5.12). */
export function daysOpen(c: ERCase, now: Date = new Date()): number {
  const raised = new Date(c.dateRaised);
  if (Number.isNaN(raised.getTime())) return 0;
  const closed = c.closureDate ? new Date(c.closureDate) : now;
  return Math.max(
    0,
    Math.round((closed.getTime() - raised.getTime()) / 86_400_000),
  );
}

export type SlaState = "on_track" | "due_soon" | "overdue" | "none";

export const SLA_LABELS: Record<SlaState, string> = {
  on_track: "On track",
  due_soon: "Due soon",
  overdue: "Overdue",
  none: "No target set",
};

export const SLA_STYLES: Record<SlaState, string> = {
  on_track:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  due_soon:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  overdue: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  none: "border-border bg-muted text-muted-foreground",
};

/**
 * §5.3 — where a case stands against its target resolution date. A closed case
 * is never "overdue"; the clock stopped when it closed.
 */
export function slaState(c: ERCase, now: Date = new Date()): SlaState {
  if (c.stage === "closed") return "on_track";
  if (!c.targetResolutionDate) return "none";
  const target = new Date(c.targetResolutionDate);
  if (Number.isNaN(target.getTime())) return "none";
  const daysLeft = Math.round((target.getTime() - now.getTime()) / 86_400_000);
  if (daysLeft < 0) return "overdue";
  return daysLeft <= 3 ? "due_soon" : "on_track";
}

/** Backwards-compatibility alias for consumers migrating to the unified model. */
export type AnyCase = ERCase;

export interface NewERCase {
  complaintType: CaseComplaintType;
  employeeName: string;
  employeeDept: string;
  incidentDate?: string;
  description: string;
  priority: CasePriority;
  confidentialityLevel: ConfidentialityLevel;
  assignedTo?: string;
  witnesses?: CaseWitness[];
  evidence?: CaseEvidence[];
}
