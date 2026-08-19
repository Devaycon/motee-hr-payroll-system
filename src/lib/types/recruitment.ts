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

// ── Job advert (the board-facing half of a requisition) ──────────────────────
/**
 * §7.19 — everything an external job board asks for that the internal
 * requisition never needed.
 *
 * This is a separate object rather than more fields on {@link JobRequisition}
 * for one reason: it makes "what may be published" a type instead of a
 * convention. The exporter whitelists this object plus a short list of named
 * base fields, so pipeline metrics, the hiring manager, the approval chain,
 * stage gates and quiz answer keys are internal *by construction* — a new
 * field added to the requisition cannot leak onto a job advert by accident.
 */

/**
 * Where the work physically happens. Deliberately separate from
 * {@link RequisitionEmploymentType}, which answers a different question (what
 * kind of contract). Boards treat them as independent facets: LinkedIn
 * `workplaceTypes`, Indeed `remotetype`, schema.org `jobLocationType`.
 */
export type WorkMode = "on_site" | "hybrid" | "remote";

/** The period a salary band is quoted in — schema.org `baseSalary.unitText`. */
export type PayPeriod = "hour" | "day" | "week" | "month" | "year";

/** Seniority, using LinkedIn's `experienceLevel` vocabulary. */
export type ExperienceLevel =
  | "internship"
  | "entry"
  | "associate"
  | "mid_senior"
  | "director"
  | "executive";

/** Highest qualification required — schema.org `educationRequirements`. */
export type EducationLevel =
  | "none"
  | "secondary"
  | "diploma"
  | "bachelor"
  | "master"
  | "doctorate";

/**
 * A structured address. Boards need the parts, not one free-text string:
 * Google for Jobs requires `addressLocality`/`addressCountry`, and Indeed
 * and LinkedIn both key their location search off discrete city/region fields.
 */
export interface JobLocation {
  streetAddress?: string;
  city: string;
  region?: string;
  postalCode?: string;
  /** ISO 3166-1 country name or code. */
  country: string;
}

/**
 * How someone applies from an external board. `internal` means the board links
 * back to our own careers page, which is what schema.org `directApply` asserts.
 */
export interface ApplyMethod {
  mode: "internal" | "external_url" | "email";
  url?: string;
  email?: string;
}

export interface JobAdvert {
  workMode: WorkMode;
  /** First entry is the primary location; the rest are alternates. */
  locations: JobLocation[];
  /** ISO 4217, e.g. "NGN" / "GBP". */
  salaryCurrency: string;
  payPeriod: PayPeriod;
  /**
   * Publish the band on the advert. When false the salary is omitted from
   * every export — an internal band stays internal.
   */
  publishSalary: boolean;
  apply: ApplyMethod;
  /** What the person will do, kept apart from the general description. */
  responsibilities?: string;
  /** Perks and package — schema.org `jobBenefits`. */
  benefits?: string;
  experienceLevel?: ExperienceLevel;
  minYearsExperience?: number;
  educationLevel?: EducationLevel;
  /** Free-text job family, e.g. "Engineering" — LinkedIn `jobFunctions`. */
  jobFunction?: string;
  /** Industry of the role, which need not match the company's own. */
  industry?: string;
  /** Whether the employer will sponsor a work visa for this role. */
  visaSponsorship?: boolean;
  /** Shift pattern or hours, e.g. "40 hours/week, Mon–Fri".  */
  workingHours?: string;
  /** Fixed-term length, carried over from the source requisition. */
  contractMonths?: number;
  /** Equal-opportunity statement printed at the foot of the advert. */
  eeoStatement?: string;
}

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
 * terminal, and every candidate walks the line in order.
 *
 * The pipeline is deliberately five linear steps with no sidings. Each
 * transition out of the middle three is gated on something real having been
 * recorded, which is what stops a candidate arriving at `hired` with no
 * evidence behind them:
 *
 *  - `interview` → `interviewed` requires a scorecard. You cannot rate someone
 *    you have not yet met, which is why a score is captured on the way *out* of
 *    "scheduled for interview" rather than being editable while they sit in it.
 *  - `offer` → `hired` requires an accepted offer. The offer conversation
 *    itself happens over email; what the system holds is the outcome.
 */
export type RecruitmentStageType =
  | "applicants"
  | "interview"
  | "interviewed"
  | "offer"
  | "hired";

/**
 * Stages that existed before the pipeline was flattened. Candidates parked in
 * one are migrated back to `applicants` on read rather than being stranded in a
 * stage that no longer renders.
 */
export const RETIRED_STAGES = ["shortlisted", "talent_pool"] as const;

/** Normalise a possibly-retired stage value onto the current stage set. */
export function normaliseStage(stage: string): RecruitmentStageType {
  return (RETIRED_STAGES as readonly string[]).includes(stage)
    ? "applicants"
    : (stage as RecruitmentStageType);
}

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
  /**
   * §7.19 — the board-facing advert. Optional because requisitions created
   * before this existed (and demo seed rows) simply don't have one; the
   * exporter degrades to what it can derive and warns about the rest.
   */
  advert?: JobAdvert;
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

/**
 * An offer and what came back.
 *
 * The negotiation happens over email — the system does not pretend to own the
 * conversation. What it owns is the outcome, because that is what gates the
 * move to `hired` and what anyone reviewing the hire later needs to see.
 */
export interface CandidateOffer {
  id: string;
  at: string;
  status: "sent" | "accepted" | "rejected";
  salary?: number;
  startDate?: string;
  notes?: string;
  /** When the candidate's answer was recorded, and by whom. */
  respondedAt?: string;
  respondedBy?: string;
  /** What the candidate said — their words, not a status label. */
  responseNote?: string;
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
  /**
   * When the onboarding invite was sent. Stored on the candidate rather than
   * held in component state so a page reload doesn't make every hire look
   * un-invited — and so the drawer and the stage table agree.
   */
  onboardingInvitedAt?: string;
  /** Why the candidate was rejected, and when. Blank for active candidates. */
  rejectionReason?: string;
  rejectedAt?: string;
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

/** Their latest offer was turned down — the pipeline ends here, not at hired. */
export function hasDeclinedOffer(candidate: Candidate): boolean {
  return latestOffer(candidate)?.status === "rejected";
}

/**
 * Has this candidate actually been interviewed and rated?
 *
 * A score is the record that an interview happened. Without one there is
 * nothing to justify moving them towards an offer, so this is what the
 * `interview` → `interviewed` gate checks.
 */
export function hasInterviewScore(candidate: Candidate): boolean {
  return candidate.scorecards.length > 0 && candidate.score != null;
}

/**
 * Whether a stage is far enough along the pipeline for a score to exist.
 *
 * Used to decide where the Score column is worth rendering: showing it on
 * "scheduled for interview" invites someone to rate a candidate they have not
 * met yet, which is exactly the habit the score gate exists to break.
 */
export function stageShowsScore(stage: RecruitmentStageType): boolean {
  return stage === "interviewed" || stage === "offer" || stage === "hired";
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
