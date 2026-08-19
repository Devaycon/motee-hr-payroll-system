import type {
  RequisitionStatus,
  RecruitmentStageType,
  HiringPriority,
  FormFieldType,
  RequisitionFlow,
  CriteriaCondition,
  WorkMode,
  PayPeriod,
  ExperienceLevel,
  EducationLevel,
  ApplyMethod,
} from "@/src/lib/types/recruitment";

export const REQUISITION_STATUS_LABELS: Record<RequisitionStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  open: "Open",
  interviewing: "Interviewing",
  offer_stage: "Offer Stage",
  filled: "Filled",
  closed: "Closed",
  cancelled: "Cancelled",
  on_hold: "On Hold",
};

export const REQUISITION_STATUS_STYLES: Record<RequisitionStatus, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  pending_approval:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  open: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  interviewing:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  offer_stage:
    "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400",
  filled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  closed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  on_hold:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
};

export { EMPLOYMENT_TYPE_LABELS } from "@/src/lib/constants/employment-types";

export const HIRING_PRIORITY_LABELS: Record<HiringPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const HIRING_PRIORITY_STYLES: Record<HiringPriority, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  urgent: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
};

// ── Job advert (§7.19) ───────────────────────────────────────────────────────
export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  on_site: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const WORK_MODE_STYLES: Record<WorkMode, string> = {
  on_site: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  hybrid: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  remote: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
};

export const PAY_PERIOD_LABELS: Record<PayPeriod, string> = {
  hour: "Per hour",
  day: "Per day",
  week: "Per week",
  month: "Per month",
  year: "Per year",
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  internship: "Internship",
  entry: "Entry level",
  associate: "Associate",
  mid_senior: "Mid–Senior level",
  director: "Director",
  executive: "Executive",
};

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  none: "No formal requirement",
  secondary: "Secondary school",
  diploma: "Diploma / OND / HND",
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  doctorate: "Doctorate",
};

export const APPLY_MODE_LABELS: Record<ApplyMethod["mode"], string> = {
  internal: "Our careers page",
  external_url: "External link",
  email: "Email application",
};

// ── Recruitment stage types (per-requisition pipeline) ───────────────────────
/** All stage types in pipeline order. */
export const RECRUITMENT_STAGE_TYPES: RecruitmentStageType[] = [
  "applicants",
  "interview",
  "interviewed",
  "offer",
  "hired",
];

/** Stages that can be toggled on/off (applicants & hired are always present). */
export const OPTIONAL_STAGES: RecruitmentStageType[] = [
  "interview",
  "interviewed",
  "offer",
];

/** Nothing follows `hired`; it is the end of the pipeline. */
export const TERMINAL_STAGES: RecruitmentStageType[] = ["hired"];

export const STAGE_TYPE_LABELS: Record<RecruitmentStageType, string> = {
  applicants: "Applicant",
  interview: "Scheduled for Interview",
  interviewed: "Interviewed",
  offer: "Offer",
  hired: "Hired",
};

export const STAGE_TYPE_STYLES: Record<RecruitmentStageType, string> = {
  applicants:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  interview:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  interviewed:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400",
  offer:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  hired:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
};

/**
 * §7.19 — why a candidate was turned down. Rejecting without a reason leaves
 * nothing to report on and nothing to tell the candidate.
 */
export const REJECTION_REASONS: string[] = [
  "Not enough experience",
  "Skills mismatch",
  "Failed assessment",
  "Salary expectations",
  "Location / relocation",
  "Withdrew application",
  "Position filled",
  "Failed background check",
  "Other",
];

/**
 * Default pipeline: Applicant → Scheduled for Interview → Interviewed → Offer
 * → Hired, each advanced manually by a recruiter.
 *
 * All five are on by default because each one now guards something: the
 * interview stage holds people you have booked but not yet met, `interviewed`
 * only admits people carrying a score, and `offer` only releases people whose
 * offer came back accepted.
 */
export function defaultFlow(): RequisitionFlow {
  return {
    stages: [
      { type: "applicants", enabled: true },
      { type: "interview", enabled: true, gate: { manual: true } },
      { type: "interviewed", enabled: true, gate: { manual: true } },
      { type: "offer", enabled: true, gate: { manual: true } },
      { type: "hired", enabled: true, gate: { manual: true } },
    ],
  };
}

/** Operators available when building filter constraints / conditions. */
export const OPERATOR_OPTIONS: {
  value: CriteriaCondition["operator"];
  label: string;
}[] = [
  { value: "eq", label: "is" },
  { value: "neq", label: "is not" },
  { value: "includes", label: "contains" },
  { value: "gte", label: "≥" },
  { value: "lte", label: "≤" },
];

export const SOURCE_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  jobberman: "Jobberman",
  referral: "Referral",
  careers_page: "Careers Page",
  agency: "Recruitment Agency",
  nysc_portal: "NYSC Portal",
  internal_transfer: "Internal Transfer",
};

export const SOURCE_OPTIONS = Object.keys(SOURCE_LABELS);

// Department options are sourced from the centralized system-data config.
export { DEPARTMENTS as DEPARTMENT_OPTIONS } from "@/src/config/system-data";

// ── Job-posting platforms ────────────────────────────────────────────────────
export interface PostingPlatform {
  id: string;
  label: string;
  /** Short description of the channel. */
  hint: string;
}

export const POSTING_PLATFORMS: PostingPlatform[] = [
  { id: "careers_page", label: "Company Careers Page", hint: "Your own site" },
  { id: "linkedin", label: "LinkedIn", hint: "Professional network" },
  { id: "indeed", label: "Indeed", hint: "Global job board" },
  { id: "jobberman", label: "Jobberman", hint: "Top job board in Nigeria" },
  { id: "glassdoor", label: "Glassdoor", hint: "Reviews + jobs" },
  { id: "nysc_portal", label: "NYSC Portal", hint: "Graduate placements" },
  { id: "referral", label: "Referral Network", hint: "Employee referrals" },
];

// ── Application form builder ──────────────────────────────────────────────────
export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  short_text: "Short text",
  long_text: "Paragraph",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  dropdown: "Dropdown",
  radio: "Single choice",
  checkboxes: "Multiple choice",
  yes_no: "Yes / No",
  file: "File upload",
};

/** Choice-style fields that need an options list. */
export const CHOICE_FIELD_TYPES: FormFieldType[] = [
  "dropdown",
  "radio",
  "checkboxes",
];

// ── Requisition display status (Requisition tab) ─────────────────────────────
export type RequisitionDisplayTone = "ongoing" | "completed" | "inactive";

/**
 * How a requisition's status reads to a human.
 *
 * `label` is the full form used in tables, where a column header already says
 * what is being described. `short` is for the detail page header, where the
 * badge sits beside a job title and is qualified with "Vacancy" instead — a
 * bare "Open" next to a role name never says open for *what*.
 */
export const REQUISITION_DISPLAY_STATUS: Record<
  RequisitionStatus,
  { label: string; short: string; tone: RequisitionDisplayTone }
> = {
  draft: { label: "Draft", short: "Draft", tone: "inactive" },
  pending_approval: {
    label: "Pending Approval",
    short: "Awaiting approval",
    tone: "ongoing",
  },
  approved: { label: "Approved", short: "Approved", tone: "ongoing" },
  open: { label: "Ongoing — Open", short: "Open for applications", tone: "ongoing" },
  interviewing: {
    label: "Ongoing — Interviewing",
    short: "Interviewing",
    tone: "ongoing",
  },
  offer_stage: {
    label: "Ongoing — Offer",
    short: "Offer out",
    tone: "ongoing",
  },
  filled: { label: "Completed — Filled", short: "Filled", tone: "completed" },
  closed: { label: "Completed — Closed", short: "Closed", tone: "completed" },
  cancelled: { label: "Cancelled", short: "Cancelled", tone: "inactive" },
  on_hold: { label: "On Hold", short: "On hold", tone: "inactive" },
};

export const REQUISITION_DISPLAY_TONE_STYLES: Record<
  RequisitionDisplayTone,
  string
> = {
  ongoing: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  inactive:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};
