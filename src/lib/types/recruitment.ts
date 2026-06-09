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
/** Closed set of pipeline stages. `applicants` is the entry, `hired` the terminal. */
export type RecruitmentStageType =
  | "applicants"
  | "shortlisted"
  | "interview"
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
