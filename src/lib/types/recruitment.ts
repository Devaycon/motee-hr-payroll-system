// ── Requisitions ────────────────────────────────────────────────────────────
export type RequisitionStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "open"
  | "interviewing"
  | "offer_stage"
  | "filled"
  | "closed"
  | "cancelled"
  | "on_hold";

import type { EmploymentType } from "@/src/lib/constants/employment-types";
export type RequisitionEmploymentType = EmploymentType;

export type HiringPriority = "low" | "medium" | "high" | "urgent";

// ── Application form builder ─────────────────────────────────────────────────
export type FormFieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "dropdown"
  | "radio"
  | "checkboxes"
  | "yes_no"
  | "file";

export interface FormFieldConstraints {
  /** Min value (number) or min length (text). */
  min?: number;
  /** Max value (number) or max length (text). */
  max?: number;
  /** Allowed values used to validate/filter applicants (choice fields). */
  allowedValues?: string[];
}

export interface ApplicationFormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  /** Options for choice fields (dropdown / radio / checkboxes). */
  options?: string[];
  constraints?: FormFieldConstraints;
}

// ── Recruitment flow (per-requisition pipeline config) ───────────────────────
/**
 * Closed set of pipeline stages. `applicants` is the entry, `hired` the
 * terminal.
 *
 * §7.18 — `offer` sits between interview and hired. Offers were already on the
 * candidate record but had no stage of their own, so the pipeline jumped
 * straight from "interviewed" to "hired" with the offer/accept/decline round
 * trip happening entirely off-system.
 */
export type RecruitmentStageType =
  | "applicants"
  | "shortlisted"
  | "interview"
  | "offer"
  | "hired";

/** What happens to an applicant who fails a stage's entry gate. */
export type GateFailAction = "stay" | "reject";

export interface CriteriaCondition {
  /** References an ApplicationFormField.id on the requisition's form. */
  fieldId: string;
  operator: "eq" | "neq" | "gte" | "lte" | "includes";
  value: string;
}

export interface CriteriaGate {
  match: "all" | "any";
  conditions: CriteriaCondition[];
  onFail: GateFailAction;
}

/**
 * A named, reusable filter built off the application form (e.g. "First class",
 * "Has certification"). Applied as a table filter on the stage tabs — it does
 * NOT advance applicants automatically.
 */
export interface FilterConstraint {
  id: string;
  name: string;
  match: "all" | "any";
  conditions: CriteriaCondition[];
}

export interface QuizQuestion {
  id: string;
  /** Built with the same form-builder model as the application form. */
  field: ApplicationFormField;
  /** Acceptable answers (for choice fields, the correct option(s)). */
  correctAnswers: string[];
  points: number;
}

export interface QuizGate {
  questions: QuizQuestion[];
  /** Minimum points required to pass. */
  passThreshold: number;
  onFail: GateFailAction;
}

/** Entry gate controlling how applicants move INTO a stage. Gates are combinable. */
export interface StageGate {
  manual: boolean;
  criteria?: CriteriaGate;
  quiz?: QuizGate;
}

export interface FlowStage {
  type: RecruitmentStageType;
  /** `applicants` and `hired` are always enabled. */
  enabled: boolean;
  /** Entry gate; omitted for the `applicants` entry stage. */
  gate?: StageGate;
  /** Interview only — auto-schedule an interview when an applicant enters. */
  autoSchedule?: boolean;
  /** Hired only — auto-hire when the final gate passes (vs manual confirm). */
  autoConfirm?: boolean;
}

export interface RequisitionFlow {
  /** Ordered applicants → … → hired. */
  stages: FlowStage[];
}

export interface JobRequisition {
  id: string;
  positionTitle: string;
  department: string;
  departmentId?: string;
  hiringManager: string;
  hiringManagerId?: string;
  employmentType: RequisitionEmploymentType;
  status: RequisitionStatus;
  hiringPriority: HiringPriority;
  location: string;
  openings: number;
  salaryMin: number;
  salaryMax: number;
  jobDescription: string;
  requiredSkills: string[];
  targetStartDate: string;
  createdAt: string;
  /** Linked approval request (job_requisition chain), if submitted for approval. */
  approvalRequestId?: string;
  /** Workforce request this requisition was converted from, if any. */
  workforceRequestId?: string;
  /** Approved Requisition (Requisition module) this recruitment was created from. */
  sourceRequisitionId?: string;
  /** Qualifications / requirements beyond skills. */
  qualifications?: string;
  /** The applicant-facing form HR built for this role. */
  applicationForm?: ApplicationFormField[];
  /** Named filters built off the application form, applied on the stage tabs. */
  filterConstraints?: FilterConstraint[];
  /** Ids of the job-posting platforms this role is published to. */
  postingPlatforms?: string[];
  /** Human-friendly requisition number (e.g. "REQ-0001"). */
  requisitionNumber?: string;
  /** This requisition's configured stage pipeline. */
  flow?: RequisitionFlow;
  // §7.15 — scheduling controls, so a vacancy can go live on a chosen date
  // and close itself rather than being left open indefinitely.
  /** ISO date to publish on; absent means "publish immediately". */
  scheduledPublishAt?: string;
  /** ISO date after which the vacancy stops accepting applications. */
  expiryDate?: string;
  /** Close the vacancy automatically once the expiry date passes. */
  autoCloseOnExpiry?: boolean;
}

/** §7.17 — one thing that should be sorted out before a vacancy goes live. */
export interface PublishWarning {
  field: string;
  message: string;
  /** Blocking issues can't be published past; advisory ones can. */
  severity: "blocking" | "advisory";
}

/**
 * §7.17 — validate a recruitment before publishing. A vacancy with no job
 * description or no hiring manager wastes every applicant's time, so it is
 * worth catching before it reaches a job board.
 */
export function validateBeforePublish(
  req: Partial<JobRequisition>,
): PublishWarning[] {
  const warnings: PublishWarning[] = [];

  if (!req.jobDescription?.trim()) {
    warnings.push({
      field: "Job description",
      message: "Applicants have nothing to read without one.",
      severity: "blocking",
    });
  }
  if (!req.hiringManager?.trim()) {
    warnings.push({
      field: "Hiring manager",
      message: "Nobody is assigned to own this hire.",
      severity: "blocking",
    });
  }
  if ((req.applicationForm?.length ?? 0) === 0) {
    warnings.push({
      field: "Application questions",
      message: "The form collects nothing beyond the defaults.",
      severity: "advisory",
    });
  }
  if (!req.salaryMin && !req.salaryMax) {
    warnings.push({
      field: "Salary",
      message: "No salary range set — expect more unsuitable applicants.",
      severity: "advisory",
    });
  }
  if ((req.postingPlatforms?.length ?? 0) === 0) {
    warnings.push({
      field: "Posting platforms",
      message: "Not selected for any channel, so nobody will see it.",
      severity: "blocking",
    });
  }
  if (!req.flow) {
    warnings.push({
      field: "Interview workflow",
      message: "No stage pipeline configured for this role.",
      severity: "advisory",
    });
  }

  return warnings;
}

export interface NewJobRequisition {
  positionTitle: string;
  department: string;
  hiringManager: string;
  employmentType: RequisitionEmploymentType;
  hiringPriority: HiringPriority;
  location: string;
  openings: number;
  salaryMin: number;
  salaryMax: number;
  jobDescription: string;
  requiredSkills: string[];
  targetStartDate: string;
}

export interface PipelineCounters {
  openings: number;
  hired: number;
  remaining: number;
  offerSent: number;
  offerAccepted: number;
  offerRejected: number;
}

// ── Candidates ────────────────────────────────────────────────────────────--
/** Whether an applicant is still in the running or has been rejected. */
export type CandidateStatus = "active" | "rejected";

/** Per-stage gate progress (quiz sent / score / pass) for an applicant. */
export interface CandidateGateProgress {
  quizSentAt?: string;
  quizScore?: number;
  passed?: boolean;
}

export type CandidateSource =
  | "linkedin"
  | "jobberman"
  | "referral"
  | "careers_page"
  | "agency"
  | "nysc_portal"
  | "internal_transfer";

export interface ScorecardCriterion {
  label: string;
  score: number; // 1-5
}

export type ScorecardRecommendation = "strong_yes" | "yes" | "no" | "strong_no";

export interface Scorecard {
  id: string;
  interviewId?: string;
  by: string;
  at: string;
  criteria: ScorecardCriterion[];
  overall: number; // 1-5, derived from criteria
  comment?: string;
  recommendation?: ScorecardRecommendation;
}

export interface CandidateCommunication {
  id: string;
  at: string;
  channel: "email" | "phone" | "note";
  subject?: string;
  body: string;
  by: string;
}

export interface CandidateOffer {
  id: string;
  at: string;
  status: "sent" | "accepted" | "rejected";
  salary?: number;
  startDate?: string;
  notes?: string;
}

export interface CandidateAttachment {
  id: string;
  name: string;
  url: string;
  kind: "cv" | "cover_letter" | "other";
}

export interface Candidate {
  id: string;
  requisitionId: string;
  requisitionTitle: string;
  name: string;
  initials: string;
  email: string;
  phone?: string;
  source: CandidateSource | string;
  /** The pipeline stage this applicant is currently in (for their requisition). */
  stage: RecruitmentStageType;
  /** Active or rejected. Rejected is a status, not a stage/tab. */
  status: CandidateStatus;
  appliedAt: string;
  updatedAt: string;
  notes?: string;
  cvUrl?: string;
  coverLetterUrl?: string;
  linkedin?: string;
  skills: string[];
  experienceSummary?: string;
  scorecards: Scorecard[];
  communications: CandidateCommunication[];
  offers: CandidateOffer[];
  attachments: CandidateAttachment[];
  /** Average of scorecard overalls (null if unscored). */
  score: number | null;
  /** Gate progress keyed by the stage the gate guards entry to. */
  gateProgress?: Partial<Record<RecruitmentStageType, CandidateGateProgress>>;
  /**
   * §7.18 — the employee record created from this hire, once onboarding
   * completes. Closes the Applicant → Offer → Hired → Onboarding → Employee
   * chain the client flagged as the biggest gap.
   */
  createdEmployeeId?: string;
}

/** §7.18 — the candidate's most recent offer, or null if none has been sent. */
export function latestOffer(candidate: Candidate): CandidateOffer | null {
  return candidate.offers.at(-1) ?? null;
}

/**
 * §7.18 — a candidate may only be marked hired once they have actually
 * accepted. Advancing on a "sent" offer is how someone ends up onboarded
 * before they have said yes.
 */
export function hasAcceptedOffer(candidate: Candidate): boolean {
  return candidate.offers.some((o) => o.status === "accepted");
}

// ── Interviews ────────────────────────────────────────────────────────────--
export type InterviewMode = "onsite" | "video" | "phone";

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  requisitionId: string;
  round: string;
  scheduledAt: string; // ISO datetime
  durationMins: number;
  mode: InterviewMode;
  panel: string[]; // employee ids
  panelNames: string[];
  location?: string; // address or meeting link
  status: "scheduled" | "completed" | "cancelled";
  reminderSent?: boolean;
}

// ── Requisition templates ────────────────────────────────────────────────---
export interface InterviewPlanRound {
  round: string;
  mode: InterviewMode;
  durationMins: number;
}

export interface RequisitionTemplate {
  id: string;
  name: string;
  jobDescription: string;
  interviewPlan: InterviewPlanRound[];
  compMin: number;
  compMax: number;
  skills: string[];
  approvalChainId?: string;
}
