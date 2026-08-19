/**
 * §7.19 — turning an internal requisition into something a job board will take.
 *
 * HR re-lists vacancies on LinkedIn, Indeed, Glassdoor, Jobberman and Google
 * for Jobs, and until now did it by reading the detail page and retyping. This
 * module is the one place that decides **what may leave the building**.
 *
 * The rule it enforces: a requisition is mostly internal. Pipeline metrics, the
 * hiring manager, hiring priority, budget, the approval chain, stage gates and
 * quiz answer keys are none of a job board's business — publishing the quiz
 * answers would let the next applicant game the screen outright. So rather than
 * serialise the requisition and delete the awkward parts (which quietly breaks
 * the first time someone adds a field), {@link buildAdvertDoc} *copies across a
 * named whitelist* and everything else is excluded by default.
 *
 * Every export format — PDF, schema.org JSON-LD, clipboard text — is derived
 * from {@link AdvertDoc}, so the boundary is enforced once and only once.
 *
 * Deliberately free of React and of the Redux store so it can be unit-tested
 * directly; callers pass the company profile and currency in.
 */

import type { ProfileData } from "@/src/lib/types/company-profile";
import type { DocSection } from "@/src/lib/reports/print-document";
import type {
  ApplicationFormField,
  ApplyMethod,
  EducationLevel,
  ExperienceLevel,
  JobAdvert,
  JobLocation,
  JobRequisition,
  PayPeriod,
  PublishWarning,
  RequisitionEmploymentType,
  WorkMode,
} from "@/src/lib/types/recruitment";
import { EMPLOYMENT_TYPE_LABELS } from "@/src/lib/constants/employment-types";
import {
  EDUCATION_LEVEL_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  PAY_PERIOD_LABELS,
  WORK_MODE_LABELS,
} from "@/src/data/recruitment-demo";

// ── The publishable shape ────────────────────────────────────────────────────

/** A screening question, stripped to what an applicant would actually see. */
export interface AdvertQuestion {
  label: string;
  required: boolean;
  /** Choice options, so the question can be recreated on the board. */
  options?: string[];
}

export interface AdvertSalary {
  min: number;
  max: number;
  currency: string;
  period: PayPeriod;
}

/**
 * The complete set of facts that may appear on a public job advert. If it is
 * not on this interface, it does not get published.
 */
export interface AdvertDoc {
  // Role
  title: string;
  department: string;
  employmentType: RequisitionEmploymentType;
  employmentTypeLabel: string;
  workMode: WorkMode | null;
  workModeLabel: string | null;
  locations: JobLocation[];
  /** Free-text fallback when the advert has no structured location yet. */
  locationText: string;
  openings: number;

  // Body copy
  description: string;
  responsibilities: string | null;
  qualifications: string | null;
  benefits: string | null;
  requiredSkills: string[];

  // Requirements
  experienceLevel: ExperienceLevel | null;
  experienceLevelLabel: string | null;
  minYearsExperience: number | null;
  educationLevel: EducationLevel | null;
  educationLevelLabel: string | null;
  visaSponsorship: boolean | null;

  // Terms
  /** Null whenever the band is unset *or* marked internal-only. */
  salary: AdvertSalary | null;
  workingHours: string | null;
  contractMonths: number | null;
  targetStartDate: string | null;

  // Classification
  jobFunction: string | null;
  industry: string | null;

  // Posting
  /** Public reference number, e.g. "REQ-0001" — boards ask for one. */
  reference: string | null;
  datePosted: string | null;
  validThrough: string | null;
  apply: ApplyMethod | null;

  // Employer
  company: {
    name: string;
    website: string | null;
    address: string | null;
    industry: string | null;
    contactEmail: string | null;
  };

  eeoStatement: string | null;
  /** Present only when explicitly requested; never includes answer keys. */
  questions: AdvertQuestion[];
}

export interface BuildAdvertOptions {
  /**
   * Include the applicant-facing screening questions. Labels and options only —
   * quiz correct answers, pass thresholds, criteria gates and filter
   * constraints are never read by this module at all.
   */
  includeQuestions?: boolean;
}

// ── Derivation helpers ───────────────────────────────────────────────────────

function clean(v: string | undefined | null): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

/**
 * Best-effort structured location when the advert has none yet. Requisitions
 * predating §7.19 only carry a free-text `location` such as "Enugu" or "Leeds",
 * so treat the first comma-part as the city and fall back to the company's
 * country rather than emitting nothing.
 */
function fallbackLocations(
  requisition: JobRequisition,
  company: ProfileData | null,
): JobLocation[] {
  const raw = clean(requisition.location);
  if (!raw) return [];
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  const city = parts[0] ?? raw;
  const country = parts.length > 1 ? parts[parts.length - 1] : (company?.country ?? "");
  return [{ city, country, region: parts.length > 2 ? parts[1] : undefined }];
}

/**
 * `employmentType` carries a "remote" member, which conflates contract type
 * with work mode. Boards keep them separate, so read it as a work-mode hint
 * when no explicit mode has been set.
 */
function fallbackWorkMode(requisition: JobRequisition): WorkMode | null {
  return requisition.employmentType === "remote" ? "remote" : null;
}

// ── The whitelist ────────────────────────────────────────────────────────────

/**
 * Project a requisition onto the publishable {@link AdvertDoc}.
 *
 * Note what is *absent* and cannot be reached from the result: `hiringManager`,
 * `hiringManagerId`, `hiringPriority`, `status`, `flow` (and therefore every
 * stage gate and `QuizGate.correctAnswers`), `filterConstraints`,
 * `approvalRequestId`, `workforceRequestId`, `sourceRequisitionId`, the
 * internal `id`, and all candidate/pipeline data.
 */
export function buildAdvertDoc(
  requisition: JobRequisition,
  company: ProfileData | null,
  opts: BuildAdvertOptions = {},
): AdvertDoc {
  const advert: Partial<JobAdvert> = requisition.advert ?? {};

  const workMode = advert.workMode ?? fallbackWorkMode(requisition);
  const locations =
    advert.locations && advert.locations.length > 0
      ? advert.locations
      : fallbackLocations(requisition, company);

  // The band is published only on an explicit opt-in. An advert built from a
  // requisition that predates §7.19 has no `advert`, so `publishSalary` is
  // undefined — and undefined must mean "don't publish", not "publish".
  const showSalary =
    advert.publishSalary === true &&
    (requisition.salaryMin > 0 || requisition.salaryMax > 0);

  return {
    title: requisition.positionTitle,
    department: requisition.department,
    employmentType: requisition.employmentType,
    employmentTypeLabel: EMPLOYMENT_TYPE_LABELS[requisition.employmentType],
    workMode,
    workModeLabel: workMode ? WORK_MODE_LABELS[workMode] : null,
    locations,
    locationText: clean(requisition.location) ?? "",
    openings: requisition.openings,

    description: requisition.jobDescription,
    responsibilities: clean(advert.responsibilities),
    qualifications: clean(requisition.qualifications),
    benefits: clean(advert.benefits),
    requiredSkills: requisition.requiredSkills ?? [],

    experienceLevel: advert.experienceLevel ?? null,
    experienceLevelLabel: advert.experienceLevel
      ? EXPERIENCE_LEVEL_LABELS[advert.experienceLevel]
      : null,
    minYearsExperience: advert.minYearsExperience ?? null,
    educationLevel: advert.educationLevel ?? null,
    educationLevelLabel: advert.educationLevel
      ? EDUCATION_LEVEL_LABELS[advert.educationLevel]
      : null,
    visaSponsorship: advert.visaSponsorship ?? null,

    salary: showSalary
      ? {
          min: requisition.salaryMin,
          max: requisition.salaryMax,
          currency: advert.salaryCurrency ?? "",
          period: advert.payPeriod ?? "year",
        }
      : null,
    workingHours: clean(advert.workingHours),
    contractMonths: advert.contractMonths ?? null,
    targetStartDate: clean(requisition.targetStartDate),

    jobFunction: clean(advert.jobFunction),
    industry: clean(advert.industry) ?? clean(company?.industry),

    reference: clean(requisition.requisitionNumber),
    datePosted: clean(requisition.scheduledPublishAt) ?? clean(requisition.createdAt),
    validThrough: clean(requisition.expiryDate),
    apply: advert.apply ?? null,

    company: {
      name: clean(company?.name) ?? "",
      website: clean(company?.website),
      address: clean(company?.address),
      industry: clean(company?.industry),
      contactEmail: clean(company?.contactEmail),
    },

    eeoStatement: clean(advert.eeoStatement),
    questions: opts.includeQuestions
      ? toAdvertQuestions(requisition.applicationForm)
      : [],
  };
}

/**
 * Screening questions reduced to what an applicant sees. `constraints` is
 * dropped on purpose: `allowedValues` is what the criteria gate filters on, so
 * publishing it would tell candidates exactly which answers pass.
 */
function toAdvertQuestions(
  fields: ApplicationFormField[] | undefined,
): AdvertQuestion[] {
  return (fields ?? []).map((f) => ({
    label: f.label,
    required: f.required,
    options: f.options && f.options.length > 0 ? [...f.options] : undefined,
  }));
}

// ── Readiness checks ─────────────────────────────────────────────────────────

/** schema.org `employmentType`, which Indeed and LinkedIn also accept. */
const SCHEMA_EMPLOYMENT_TYPE: Record<RequisitionEmploymentType, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  temporary: "TEMPORARY",
  contract: "CONTRACTOR",
  freelance: "CONTRACTOR",
  internship: "INTERN",
  apprenticeship: "INTERN",
  casual: "PART_TIME",
  seasonal: "TEMPORARY",
  // "remote" describes where, not what — the contract is a normal full-time
  // one, and the remoteness is carried by jobLocationType instead.
  remote: "FULL_TIME",
  field_based: "FULL_TIME",
};

const SCHEMA_PAY_UNIT: Record<PayPeriod, string> = {
  hour: "HOUR",
  day: "DAY",
  week: "WEEK",
  month: "MONTH",
  year: "YEAR",
};

const SCHEMA_EDUCATION: Record<EducationLevel, string | null> = {
  none: null,
  secondary: "high school",
  diploma: "associate degree",
  bachelor: "bachelor degree",
  master: "postgraduate degree",
  doctorate: "postgraduate degree",
};

/**
 * What a job board will reject or silently drop. Mirrors the shape of
 * {@link PublishWarning} used by `validateBeforePublish`, so the builder can
 * render both lists the same way.
 *
 * "blocking" here means Google for Jobs treats the field as required, not that
 * we refuse to produce a file — HR may well be pasting into a board that fills
 * the gap itself, so the export always succeeds and just warns.
 */
export function advertWarnings(requisition: JobRequisition): PublishWarning[] {
  const warnings: PublishWarning[] = [];
  const advert = requisition.advert;

  if (!requisition.jobDescription?.trim()) {
    warnings.push({
      field: "Job description",
      message: "Every board requires a description.",
      severity: "blocking",
    });
  }
  if (!advert?.workMode) {
    warnings.push({
      field: "Work mode",
      message: "Boards filter on on-site / hybrid / remote.",
      severity: "blocking",
    });
  }
  const primary = advert?.locations?.[0];
  if (!primary?.city || !primary?.country) {
    warnings.push({
      field: "Location",
      message: "A city and country are required unless the role is remote.",
      severity: advert?.workMode === "remote" ? "advisory" : "blocking",
    });
  }
  if (!advert?.apply || advert.apply.mode === "internal") {
    // Not blocking: an internal apply route is legitimate, but a board needs
    // somewhere to send people, so it is worth a nudge.
    if (!advert?.apply) {
      warnings.push({
        field: "How to apply",
        message: "No apply link or email set for external boards.",
        severity: "blocking",
      });
    }
  } else if (advert.apply.mode === "external_url" && !clean(advert.apply.url)) {
    warnings.push({
      field: "Apply link",
      message: "External apply selected but no URL given.",
      severity: "blocking",
    });
  } else if (advert.apply.mode === "email" && !clean(advert.apply.email)) {
    warnings.push({
      field: "Apply email",
      message: "Email application selected but no address given.",
      severity: "blocking",
    });
  }
  if (advert?.publishSalary && !clean(advert.salaryCurrency)) {
    warnings.push({
      field: "Salary currency",
      message: "A published band needs a currency.",
      severity: "blocking",
    });
  }
  if (!requisition.expiryDate) {
    warnings.push({
      field: "Expiry date",
      message: "Without one, boards keep the advert live indefinitely.",
      severity: "advisory",
    });
  }
  if (!advert?.benefits?.trim()) {
    warnings.push({
      field: "Benefits",
      message: "Adverts listing a package attract more applicants.",
      severity: "advisory",
    });
  }
  if ((requisition.requiredSkills?.length ?? 0) === 0) {
    warnings.push({
      field: "Required skills",
      message: "Boards use skills to match the role to candidates.",
      severity: "advisory",
    });
  }
  return warnings;
}

// ── schema.org JobPosting ────────────────────────────────────────────────────

/**
 * The JSON-LD block Google for Jobs indexes. Pasted into a careers page, this
 * is what makes the vacancy appear in Google's job search.
 *
 * Built from {@link AdvertDoc} rather than the requisition, so it inherits the
 * whitelist for free.
 */
export function toJobPostingJsonLd(doc: AdvertDoc): Record<string, unknown> {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: doc.title,
    description: buildDescriptionHtml(doc),
    employmentType: SCHEMA_EMPLOYMENT_TYPE[doc.employmentType],
  };

  if (doc.datePosted) json.datePosted = doc.datePosted;
  if (doc.validThrough) json.validThrough = doc.validThrough;

  json.hiringOrganization = {
    "@type": "Organization",
    name: doc.company.name,
    ...(doc.company.website ? { sameAs: doc.company.website } : {}),
  };

  if (doc.locations.length > 0) {
    const places = doc.locations.map((l) => ({
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(l.streetAddress ? { streetAddress: l.streetAddress } : {}),
        addressLocality: l.city,
        ...(l.region ? { addressRegion: l.region } : {}),
        ...(l.postalCode ? { postalCode: l.postalCode } : {}),
        addressCountry: l.country,
      },
    }));
    json.jobLocation = places.length === 1 ? places[0] : places;
  }

  // Google requires TELECOMMUTE plus an applicant-location requirement for
  // fully remote roles; hybrid keeps a physical jobLocation and no flag.
  if (doc.workMode === "remote") {
    json.jobLocationType = "TELECOMMUTE";
    const country = doc.locations[0]?.country;
    if (country) {
      json.applicantLocationRequirements = { "@type": "Country", name: country };
    }
  }

  if (doc.salary) {
    json.baseSalary = {
      "@type": "MonetaryAmount",
      currency: doc.salary.currency,
      value: {
        "@type": "QuantitativeValue",
        minValue: doc.salary.min,
        maxValue: doc.salary.max,
        unitText: SCHEMA_PAY_UNIT[doc.salary.period],
      },
    };
  }

  if (doc.reference) {
    json.identifier = {
      "@type": "PropertyValue",
      name: doc.company.name || doc.title,
      value: doc.reference,
    };
  }

  if (doc.responsibilities) json.responsibilities = doc.responsibilities;
  if (doc.qualifications) json.qualifications = doc.qualifications;
  if (doc.benefits) json.jobBenefits = doc.benefits;
  if (doc.requiredSkills.length > 0) json.skills = doc.requiredSkills.join(", ");
  if (doc.workingHours) json.workHours = doc.workingHours;
  if (doc.industry) json.industry = doc.industry;
  if (doc.jobFunction) json.occupationalCategory = doc.jobFunction;
  if (doc.openings > 0) json.totalJobOpenings = doc.openings;

  if (doc.educationLevel && SCHEMA_EDUCATION[doc.educationLevel]) {
    json.educationRequirements = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: SCHEMA_EDUCATION[doc.educationLevel],
    };
  }
  if (doc.minYearsExperience !== null) {
    json.experienceRequirements = {
      "@type": "OccupationalExperienceRequirements",
      monthsOfExperience: doc.minYearsExperience * 12,
    };
  }

  // directApply asserts the application is completed on the employer's own
  // site — true only when we are not handing off to a third-party URL.
  if (doc.apply) json.directApply = doc.apply.mode === "internal";

  return json;
}

/** schema.org wants `description` as HTML; boards render the tags. */
function buildDescriptionHtml(doc: AdvertDoc): string {
  const out: string[] = [];
  const para = (s: string) =>
    s
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br />")}</p>`)
      .join("");

  if (doc.description) out.push(para(doc.description));
  if (doc.responsibilities) {
    out.push(`<h3>Responsibilities</h3>${para(doc.responsibilities)}`);
  }
  if (doc.qualifications) {
    out.push(`<h3>Requirements</h3>${para(doc.qualifications)}`);
  }
  if (doc.requiredSkills.length > 0) {
    out.push(
      `<h3>Skills</h3><ul>${doc.requiredSkills
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join("")}</ul>`,
    );
  }
  if (doc.benefits) out.push(`<h3>Benefits</h3>${para(doc.benefits)}`);
  if (doc.eeoStatement) out.push(para(doc.eeoStatement));
  return out.join("");
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Plain text ───────────────────────────────────────────────────────────────

/** One-line human-readable location, e.g. "Enugu, Enugu State, Nigeria". */
export function formatLocation(l: JobLocation): string {
  return [l.streetAddress, l.city, l.region, l.postalCode, l.country]
    .filter(Boolean)
    .join(", ");
}

/** All locations, or the free-text fallback when none are structured. */
export function locationSummary(doc: AdvertDoc): string {
  if (doc.locations.length === 0) return doc.locationText;
  return doc.locations.map(formatLocation).join(" · ");
}

/** The salary band as it should read on an advert. */
export function formatAdvertSalary(salary: AdvertSalary): string {
  const cur = salary.currency ? `${salary.currency} ` : "";
  const period = PAY_PERIOD_LABELS[salary.period].toLowerCase();
  const range =
    salary.min && salary.max
      ? `${cur}${salary.min.toLocaleString()} – ${cur}${salary.max.toLocaleString()}`
      : `${cur}${(salary.min || salary.max).toLocaleString()}`;
  return `${range} ${period}`;
}

/** How to apply, as a single sentence. */
export function formatApply(apply: ApplyMethod): string {
  if (apply.mode === "email" && apply.email) return `Apply by email: ${apply.email}`;
  if (apply.mode === "external_url" && apply.url) return `Apply online: ${apply.url}`;
  return "Apply via our careers page";
}

/**
 * The advert as plain text, for pasting into LinkedIn's or Indeed's description
 * box — both strip most rich formatting, so anything fancier is wasted.
 */
export function toPlainText(doc: AdvertDoc): string {
  const out: string[] = [];
  const section = (heading: string, body: string) => {
    out.push("", heading.toUpperCase(), body.trim());
  };

  out.push(doc.title);
  if (doc.company.name) out.push(doc.company.name);

  const facts = [
    locationSummary(doc),
    doc.workModeLabel,
    doc.employmentTypeLabel,
    doc.salary ? formatAdvertSalary(doc.salary) : null,
  ].filter(Boolean);
  if (facts.length > 0) out.push(facts.join(" · "));

  if (doc.description) section("About the role", doc.description);
  if (doc.responsibilities) section("Responsibilities", doc.responsibilities);
  if (doc.qualifications) section("Requirements", doc.qualifications);

  if (doc.requiredSkills.length > 0) {
    section("Skills", doc.requiredSkills.map((s) => `• ${s}`).join("\n"));
  }
  if (doc.benefits) section("Benefits", doc.benefits);

  const terms = [
    doc.experienceLevelLabel ? `Experience level: ${doc.experienceLevelLabel}` : null,
    doc.minYearsExperience !== null
      ? `Minimum experience: ${doc.minYearsExperience} year${doc.minYearsExperience === 1 ? "" : "s"}`
      : null,
    doc.educationLevelLabel ? `Education: ${doc.educationLevelLabel}` : null,
    doc.workingHours ? `Hours: ${doc.workingHours}` : null,
    doc.contractMonths ? `Contract length: ${doc.contractMonths} months` : null,
    doc.targetStartDate ? `Expected start: ${doc.targetStartDate}` : null,
    doc.openings > 1 ? `Openings: ${doc.openings}` : null,
    doc.visaSponsorship === true ? "Visa sponsorship available" : null,
    doc.visaSponsorship === false ? "Visa sponsorship not available" : null,
    doc.validThrough ? `Closing date: ${doc.validThrough}` : null,
  ].filter(Boolean) as string[];
  if (terms.length > 0) section("Details", terms.join("\n"));

  if (doc.questions.length > 0) {
    section(
      "Application questions",
      doc.questions
        .map((q) => `• ${q.label}${q.required ? " (required)" : ""}`)
        .join("\n"),
    );
  }

  if (doc.apply) section("How to apply", formatApply(doc.apply));
  if (doc.eeoStatement) section("Equal opportunity", doc.eeoStatement);
  if (doc.reference) out.push("", `Reference: ${doc.reference}`);

  return out.join("\n").trim();
}

// ── PDF ──────────────────────────────────────────────────────────────────────

/** The advert's one-line strapline: where, how and on what terms. */
export function advertStrapline(doc: AdvertDoc): string {
  return [
    locationSummary(doc),
    doc.workModeLabel,
    doc.employmentTypeLabel,
    doc.salary ? formatAdvertSalary(doc.salary) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The advert as printable sections. Kept here rather than in the component so
 * the PDF is built from the same whitelisted {@link AdvertDoc} as every other
 * format — there is no second path by which an internal field could reach paper.
 */
export function toDocSections(doc: AdvertDoc): DocSection[] {
  const sections: DocSection[] = [];

  if (doc.description) {
    sections.push({ kind: "prose", heading: "About the role", body: doc.description });
  }
  if (doc.responsibilities) {
    sections.push({
      kind: "prose",
      heading: "Responsibilities",
      body: doc.responsibilities,
    });
  }
  if (doc.qualifications) {
    sections.push({ kind: "prose", heading: "Requirements", body: doc.qualifications });
  }
  if (doc.requiredSkills.length > 0) {
    sections.push({ kind: "tags", heading: "Skills", items: doc.requiredSkills });
  }
  if (doc.benefits) {
    sections.push({ kind: "prose", heading: "Benefits", body: doc.benefits });
  }

  const facts: Array<{ label: string; value: string }> = [];
  const fact = (label: string, value: string | null | undefined) => {
    if (value) facts.push({ label, value });
  };
  fact("Employment type", doc.employmentTypeLabel);
  fact("Work mode", doc.workModeLabel);
  fact("Location", locationSummary(doc));
  fact("Department", doc.department);
  if (doc.salary) fact("Salary", formatAdvertSalary(doc.salary));
  fact("Experience level", doc.experienceLevelLabel);
  if (doc.minYearsExperience !== null) {
    fact(
      "Minimum experience",
      `${doc.minYearsExperience} year${doc.minYearsExperience === 1 ? "" : "s"}`,
    );
  }
  fact("Education", doc.educationLevelLabel);
  fact("Working hours", doc.workingHours);
  if (doc.contractMonths) fact("Contract length", `${doc.contractMonths} months`);
  fact("Expected start", doc.targetStartDate);
  if (doc.openings > 1) fact("Openings", String(doc.openings));
  if (doc.visaSponsorship !== null) {
    fact("Visa sponsorship", doc.visaSponsorship ? "Available" : "Not available");
  }
  fact("Job function", doc.jobFunction);
  fact("Industry", doc.industry);
  fact("Closing date", doc.validThrough);
  if (facts.length > 0) {
    sections.push({ kind: "facts", heading: "At a glance", items: facts });
  }

  if (doc.questions.length > 0) {
    sections.push({
      kind: "list",
      heading: "Application questions",
      items: doc.questions.map(
        (q) =>
          `${q.label}${q.required ? " (required)" : ""}` +
          (q.options ? ` — ${q.options.join(" / ")}` : ""),
      ),
    });
  }

  if (doc.apply) {
    sections.push({
      kind: "prose",
      heading: "How to apply",
      body: formatApply(doc.apply),
    });
  }

  const employer = [doc.company.address, doc.company.website, doc.company.contactEmail]
    .filter(Boolean)
    .join(" · ");
  if (employer) {
    sections.push({ kind: "prose", heading: "About the employer", body: employer });
  }
  if (doc.eeoStatement) {
    sections.push({ kind: "note", body: doc.eeoStatement });
  }

  return sections;
}
