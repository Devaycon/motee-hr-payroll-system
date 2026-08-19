import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { employmentTypeFromName } from "@/src/lib/constants/employment-types";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type {
  CandidateGateProgress,
  CandidateStatus,
  RecruitmentStageType,
  ApplicationFormField,
  Candidate,
  CandidateCommunication,
  CandidateOffer,
  FilterConstraint,
  Interview,
  JobRequisition,
  RequisitionStatus,
  RequisitionTemplate,
  Scorecard,
  ScorecardRecommendation,
  WorkMode,
} from "@/src/lib/types/recruitment";
import { defaultFlow } from "@/src/data/recruitment-demo";

/**
 * Bump to force a one-time reseed of recruitment demo data on next load.
 *
 * v5 flattened the pipeline to Applicant → Scheduled for Interview →
 * Interviewed → Offer → Hired. Buckets persisted at v4 may hold candidates in
 * `shortlisted` or `talent_pool`, which no longer have tabs, so they are
 * discarded and reseeded rather than left stranded.
 *
 * v6 reseeds so every candidate satisfies the gates for the stage they are in:
 * scored from `interviewed` onwards, and holding an offer at `offer`.
 *
 * v7 adds the §7.19 job advert. The bundles' `workMode` and salary currency
 * were being read past and dropped, so buckets seeded at v6 have no advert at
 * all and would export a job listing missing its most important fields.
 */
export const SEED_VERSION = 7;

export interface RecruitmentBucket {
  requisitions: JobRequisition[];
  candidates: Candidate[];
  interviews: Interview[];
  templates: RequisitionTemplate[];
  /** Demo seed version this bucket was built with (drives reseed). */
  seedVersion?: number;
}

interface RecruitmentState {
  byCountry: Record<string, RecruitmentBucket>;
  status: "idle" | "ready";
}

const initialState: RecruitmentState = { byCountry: {}, status: "idle" };

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const SKILL_POOL = [
  "Communication",
  "Teamwork",
  "Problem solving",
  "Attention to detail",
  "Leadership",
  "Time management",
];

function normalizeSource(s?: string): string {
  const v = (s ?? "").toLowerCase();
  if (v.includes("linkedin")) return "linkedin";
  if (v.includes("jobberman")) return "jobberman";
  if (v.includes("refer")) return "referral";
  if (v.includes("agen")) return "agency";
  if (v.includes("nysc")) return "nysc_portal";
  if (v.includes("internal") || v.includes("transfer")) return "internal_transfer";
  if (v.includes("website") || v.includes("career") || v.includes("direct"))
    return "careers_page";
  return "careers_page";
}

/**
 * Map a raw/granular stage string onto the live pipeline set.
 *
 * `shortlisted` and `talent_pool` were removed when the pipeline was flattened.
 * They fall through to the entry stage rather than being dropped, so anyone
 * parked in one reappears as an applicant instead of vanishing into a stage
 * that no longer has a tab.
 */
function mapStage(s?: string): RecruitmentStageType {
  switch (s) {
    case "interview":
    case "interview_1":
    case "interview_2":
    case "assessment":
      return "interview";
    case "interviewed":
    case "interview_complete":
      return "interviewed";
    // The seed distinguishes offer from interview; folding them together lost
    // the offer stage's whole population on import.
    case "offer":
      return "offer";
    case "hired":
      return "hired";
    default:
      // applied, screening, shortlisted, talent_pool, rejected, unknown → entry
      return "applicants";
  }
}

function deriveStatus(s?: string): CandidateStatus {
  return s === "rejected" ? "rejected" : "active";
}

/**
 * §7.19 — the bundles say "hybrid" / "onsite" / "remote"; job boards want the
 * canonical three. Falls back to reading the employment type, which carries a
 * "remote" member that is really a work mode.
 */
function mapWorkMode(raw?: string, employmentType?: string): WorkMode {
  const v = (raw ?? "").toLowerCase().replace(/[\s_-]/g, "");
  if (v === "remote" || v === "telecommute") return "remote";
  if (v === "hybrid") return "hybrid";
  if (v === "onsite" || v === "office" || v === "inoffice") return "on_site";
  return employmentTypeFromName(employmentType) === "remote" ? "remote" : "on_site";
}

function mapReqStatus(s?: string): RequisitionStatus {
  switch (s) {
    case "open":
      return "open";
    case "closed":
      return "closed";
    case "filled":
      return "filled";
    case "draft":
      return "draft";
    case "pending":
    case "pending_approval":
      return "pending_approval";
    case "cancelled":
      return "cancelled";
    case "on_hold":
      return "on_hold";
    default:
      return "approved";
  }
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function recomputeScore(c: Candidate): void {
  if (!c.scorecards.length) {
    c.score = null;
    return;
  }
  const avg =
    c.scorecards.reduce((s, sc) => s + sc.overall, 0) / c.scorecards.length;
  c.score = Math.round(avg * 10) / 10;
}

const DEFAULT_TEMPLATES: RequisitionTemplate[] = [
  {
    id: "RQT-ENG",
    name: "Software Engineer",
    jobDescription:
      "Design, build and maintain scalable services and ship high-quality features.",
    interviewPlan: [
      { round: "Recruiter Screen", mode: "phone", durationMins: 30 },
      { round: "Technical Interview", mode: "video", durationMins: 60 },
      { round: "System Design", mode: "video", durationMins: 60 },
    ],
    compMin: 6000000,
    compMax: 14000000,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Cloud"],
  },
  {
    id: "RQT-SALES",
    name: "Sales Representative",
    jobDescription:
      "Own a pipeline of prospects, run demos and close deals against quota.",
    interviewPlan: [
      { round: "Recruiter Screen", mode: "phone", durationMins: 30 },
      { round: "Hiring Manager", mode: "video", durationMins: 45 },
      { round: "Role Play", mode: "onsite", durationMins: 60 },
    ],
    compMin: 3000000,
    compMax: 7000000,
    skills: ["Negotiation", "CRM", "Prospecting"],
  },
  {
    id: "RQT-OPS",
    name: "Operations Associate",
    jobDescription:
      "Keep day-to-day operations running smoothly and improve processes.",
    interviewPlan: [
      { round: "Recruiter Screen", mode: "phone", durationMins: 30 },
      { round: "Hiring Manager", mode: "video", durationMins: 45 },
    ],
    compMin: 2500000,
    compMax: 5500000,
    skills: ["Process improvement", "Excel", "Coordination"],
  },
];

interface RawJobPosting {
  id?: string;
  title?: string;
  departmentId?: string;
  hiringManagerId?: string;
  employmentType?: string;
  status?: string;
  openings?: number;
  location?: string;
  /** §7.19 — present in the bundles all along, but previously discarded. */
  workMode?: string;
  salaryRange?: { min?: number; max?: number; currency?: string };
  description?: string;
  postedAt?: string;
  closingDate?: string;
  requiredSkills?: string[];
}

interface RawCandidate {
  id?: string;
  jobPostingId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  stage?: string;
  source?: string;
  appliedAt?: string;
  updatedAt?: string;
  resumeUrl?: string;
  rating?: number | null;
  notes?: string;
}

interface RawInterview {
  id?: string;
  candidateId?: string;
  jobPostingId?: string;
  round?: string;
  scheduledAt?: string;
  interviewerIds?: string[];
  status?: string;
  feedback?: string;
}

interface RawOffer {
  id?: string;
  candidateId?: string;
  jobPostingId?: string;
  amount?: number;
  currency?: string;
  extendedAt?: string;
  status?: string;
  startDate?: string;
}

/**
 * How a round is run and how long it takes. The seed only names the round, but
 * a schedule with no duration can't be laid out on a calendar or checked for
 * clashes, so infer both from the round name.
 */
function interviewShapeFor(round: string): {
  mode: Interview["mode"];
  durationMins: number;
} {
  const r = round.toLowerCase();
  if (r.includes("screen")) return { mode: "phone", durationMins: 30 };
  if (r.includes("final") || r.includes("onsite") || r.includes("panel"))
    return { mode: "onsite", durationMins: 60 };
  if (r.includes("technical") || r.includes("design"))
    return { mode: "video", durationMins: 60 };
  return { mode: "video", durationMins: 45 };
}

function mapInterviewStatus(s?: string): Interview["status"] {
  return s === "completed" ? "completed" : s === "cancelled" ? "cancelled" : "scheduled";
}

/** The seed calls an outstanding offer "pending"; the model calls it "sent". */
function mapOfferStatus(s?: string): CandidateOffer["status"] {
  switch (s) {
    case "accepted":
      return "accepted";
    case "rejected":
    case "declined":
      return "rejected";
    default:
      return "sent";
  }
}

// ── Synthetic demo applicants (so every requisition has a testable pipeline) ──
const FIRST_NAMES = [
  "Ada", "Chinedu", "Bola", "Tunde", "Ngozi", "Yusuf", "Kemi", "Uche",
  "Ifeoma", "Emeka", "Zainab", "Femi", "Hauwa", "Obi", "Funmi", "Sani",
  "Amaka", "Tobi", "Halima", "Ekene",
];
const LAST_NAMES = [
  "Okafor", "Adeyemi", "Bello", "Eze", "Johnson", "Okeke", "Nwosu", "Balogun",
  "Abiola", "Mohammed", "Ogunleye", "Chukwu", "Lawal", "Danjuma", "Olawale",
  "Ibrahim", "Nnamdi", "Adebayo", "Suleiman", "Onyeka",
];
const SYNTH_SOURCES = [
  "linkedin", "jobberman", "referral", "careers_page", "agency", "nysc_portal",
];

function makeSyntheticCandidate(
  req: JobRequisition,
  n: number,
  stage: RecruitmentStageType,
  status: CandidateStatus,
  createdAt: string,
): Candidate {
  const id = `${req.id}-SC${n}`;
  const h = hash(id);
  const name = `${FIRST_NAMES[h % FIRST_NAMES.length]} ${
    LAST_NAMES[(h >> 3) % LAST_NAMES.length]
  }`;
  const skillSource = req.requiredSkills.length ? req.requiredSkills : SKILL_POOL;
  const skills = skillSource.slice(0, 3 + (h % 2));

  // Seeded candidates must satisfy the same gates a real one would have passed
  // to reach their stage. Scoring someone still sitting in `interview` implied
  // they had been rated before the interview happened; leaving `interviewed`
  // and `offer` unscored put candidates in stages they could not legally have
  // reached. Both read as bugs in the pipeline rather than in the fixture.
  const SCORED_FROM: RecruitmentStageType[] = ["interviewed", "offer", "hired"];
  const scorecards: Scorecard[] = [];
  if (SCORED_FROM.includes(stage) && status !== "rejected") {
    const overall = 3 + (h % 3);
    scorecards.push({
      id: `${id}-SC`,
      by: req.hiringManager,
      at: createdAt,
      criteria: [
        { label: "Technical", score: overall },
        { label: "Communication", score: Math.max(1, overall - (h % 2)) },
        { label: "Culture fit", score: Math.min(5, overall + (h % 2)) },
      ],
      overall,
      recommendation: overall >= 4 ? "yes" : "no",
      comment: "Structured interview across the required skills.",
    });
  }

  const offers: CandidateOffer[] = [];
  // Anyone at `hired` accepted; anyone at `offer` is still waiting to answer,
  // which is what that stage means.
  if (stage === "hired") {
    offers.push({
      id: `${id}-OF`,
      at: createdAt,
      status: "accepted",
      salary: req.salaryMin,
      startDate: req.targetStartDate,
      respondedAt: createdAt,
      respondedBy: req.hiringManager,
    });
  } else if (stage === "offer" && status !== "rejected") {
    offers.push({
      id: `${id}-OF`,
      at: createdAt,
      status: "sent",
      salary: req.salaryMin,
      startDate: req.targetStartDate,
    });
  }

  const candidate: Candidate = {
    id,
    requisitionId: req.id,
    requisitionTitle: req.positionTitle,
    name,
    initials: initialsFor(name),
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
    source: SYNTH_SOURCES[h % SYNTH_SOURCES.length],
    stage,
    status,
    appliedAt: createdAt,
    updatedAt: createdAt,
    skills,
    experienceSummary: `Candidate applying for ${req.positionTitle} in ${req.department}.`,
    scorecards,
    communications: [
      {
        id: `${id}-CM`,
        at: createdAt,
        channel: "note",
        body: "Application received.",
        by: "System",
      },
    ],
    offers,
    attachments: [],
    score: null,
  };
  recomputeScore(candidate);
  return candidate;
}

/** A spread of synthetic applicants across a requisition's enabled stages. */
function syntheticForRequisition(
  req: JobRequisition,
  createdAt: string,
): Candidate[] {
  const enabled = new Set(
    (req.flow?.stages ?? []).filter((s) => s.enabled).map((s) => s.type),
  );
  const base = {
    applicants: 5,
    interview: 2,
    interviewed: 2,
    offer: 1,
    hired: 1,
  };
  let applicants = base.applicants;
  if (!enabled.has("interview")) applicants += base.interview;
  const counts: Record<RecruitmentStageType, number> = {
    applicants,
    interview: enabled.has("interview") ? base.interview : 0,
    // A flow stored before a stage existed has no entry for it, so treat a
    // missing entry as enabled rather than as switched off.
    interviewed: enabled.has("interviewed") || !enabled.size ? base.interviewed : 0,
    offer: enabled.has("offer") || !enabled.size ? base.offer : 0,
    hired: base.hired,
  };

  const out: Candidate[] = [];
  let n = 1;
  (
    [
      "applicants",
      "interview",
      "interviewed",
      "offer",
      "hired",
    ] as RecruitmentStageType[]
  ).forEach((st) => {
    for (let k = 0; k < counts[st]; k++) {
      out.push(makeSyntheticCandidate(req, n++, st, "active", createdAt));
    }
  });
  // A couple of rejected applicants (rejected is a status, shown via toggle).
  for (let k = 0; k < 2; k++) {
    out.push(makeSyntheticCandidate(req, n++, "applicants", "rejected", createdAt));
  }
  return out;
}

// ── Pre-configured requisitions (so filters are testable on first load) ──
const GATE_FIELD_GRAD = "fld-graduate";
const GATE_FIELD_EXP = "fld-experience";
const GATE_FIELD_RELOCATE = "fld-relocate";

function gatedApplicationForm(): ApplicationFormField[] {
  return [
    {
      id: GATE_FIELD_GRAD,
      type: "yes_no",
      label: "Are you a graduate?",
      required: true,
    },
    {
      id: GATE_FIELD_EXP,
      type: "dropdown",
      label: "Years of experience",
      required: true,
      options: ["0-2", "3-5", "5+"],
    },
    {
      id: GATE_FIELD_RELOCATE,
      type: "yes_no",
      label: "Willing to relocate?",
      required: false,
    },
  ];
}

/** Demo filter constraints built off `gatedApplicationForm()` field ids. */
function demoFilterConstraints(): FilterConstraint[] {
  return [
    {
      id: "fc-graduates",
      name: "Graduates",
      match: "all",
      conditions: [{ fieldId: GATE_FIELD_GRAD, operator: "eq", value: "Yes" }],
    },
    {
      id: "fc-senior",
      name: "5+ years experience",
      match: "all",
      conditions: [{ fieldId: GATE_FIELD_EXP, operator: "eq", value: "5+" }],
    },
    {
      id: "fc-relocate",
      name: "Willing to relocate",
      match: "all",
      conditions: [
        { fieldId: GATE_FIELD_RELOCATE, operator: "eq", value: "Yes" },
      ],
    },
  ];
}

/** Build a fresh recruitment bucket from a locale bundle (one-time seed). */
export function seedBucketFromBundle(bundle: LocaleBundle): RecruitmentBucket {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const departmentsById = new Map(bundle.departments.map((d) => [d.id, d]));
  const rec = (bundle as unknown as {
    recruitment?: {
      jobPostings?: RawJobPosting[];
      candidates?: RawCandidate[];
      interviews?: RawInterview[];
      offers?: RawOffer[];
    };
  }).recruitment ?? {};
  const postings = rec.jobPostings ?? [];
  const rawCandidates = rec.candidates ?? [];
  const rawInterviews = rec.interviews ?? [];
  const rawOffers = rec.offers ?? [];

  // The bundle's offers are the real ones; synthesising an offer for every
  // hire (as this used to) overwrote the actual amounts and dates.
  const offersByCandidate = new Map<string, CandidateOffer[]>();
  for (const o of rawOffers) {
    if (!o.candidateId) continue;
    const list = offersByCandidate.get(o.candidateId) ?? [];
    list.push({
      id: o.id ?? uid("OF"),
      at: o.extendedAt ?? "2026-01-01",
      status: mapOfferStatus(o.status),
      salary: o.amount,
      startDate: o.startDate,
    });
    offersByCandidate.set(o.candidateId, list);
  }
  // `latestOffer()` reads the last element, so keep each list oldest-first.
  for (const list of offersByCandidate.values()) {
    list.sort((a, b) => a.at.localeCompare(b.at));
  }

  const priorities = ["low", "medium", "high", "urgent"] as const;

  // §7.19 — the employer's own address is the sensible default advert location
  // when a posting only carries a city name.
  const hq = (bundle as unknown as {
    companyProfile?: {
      headquarters?: {
        city?: string;
        region?: string;
        postalCode?: string;
        country?: string;
      };
    };
  }).companyProfile?.headquarters;

  const requisitions: JobRequisition[] = postings.map((p, i) => {
    const dept = p.departmentId ? departmentsById.get(p.departmentId) : null;
    const mgr = p.hiringManagerId ? employeesById.get(p.hiringManagerId) : null;
    const id = p.id ?? `req-${i + 1}`;
    return {
      id,
      positionTitle: p.title ?? "Untitled role",
      department: dept?.name ?? p.departmentId ?? "—",
      departmentId: p.departmentId,
      hiringManager: mgr?.fullName ?? "—",
      hiringManagerId: p.hiringManagerId,
      employmentType: employmentTypeFromName(p.employmentType),
      status: mapReqStatus(p.status),
      hiringPriority: priorities[hash(id) % priorities.length],
      location: p.location ?? "—",
      openings: p.openings ?? 1,
      salaryMin: p.salaryRange?.min ?? 0,
      salaryMax: p.salaryRange?.max ?? 0,
      jobDescription: p.description ?? "",
      requiredSkills: p.requiredSkills ?? [],
      targetStartDate:
        p.closingDate ?? p.postedAt ?? bundle.tenant.createdAt.slice(0, 10),
      createdAt: p.postedAt ?? bundle.tenant.createdAt.slice(0, 10),
      requisitionNumber: `REQ-${String(i + 1).padStart(4, "0")}`,
      flow: defaultFlow(),
      advert: {
        workMode: mapWorkMode(p.workMode, p.employmentType),
        // The HQ's region and postcode only belong to a posting in the HQ's
        // own city — stamping "Lagos State, 101241" onto a role in Enugu would
        // put a wrong address on a public advert, which is worse than an
        // incomplete one. Country is safe to carry either way.
        locations: [
          (() => {
            const city = p.location ?? hq?.city ?? "";
            const atHq = !!hq?.city && city.toLowerCase() === hq.city.toLowerCase();
            return {
              city,
              region: atHq ? hq?.region : undefined,
              postalCode: atHq ? hq?.postalCode : undefined,
              country: hq?.country ?? bundle.tenant.country,
            };
          })(),
        ],
        salaryCurrency: p.salaryRange?.currency ?? bundle.tenant.currency,
        payPeriod: "year",
        // Demo bands are shown: these are sample adverts, and a hidden band
        // would make the export look broken rather than deliberate.
        publishSalary: true,
        apply: { mode: "internal" },
      },
    };
  });

  // Pre-configure the first couple of requisitions with an application form +
  // named filter constraints so the tab filters are testable immediately.
  requisitions.slice(0, 2).forEach((r) => {
    r.applicationForm = gatedApplicationForm();
    r.filterConstraints = demoFilterConstraints();
  });

  const reqById = new Map(requisitions.map((r) => [r.id, r]));

  const candidates: Candidate[] = rawCandidates.map((c, i) => {
    const reqId = c.jobPostingId ?? "";
    const req = reqById.get(reqId);
    const name =
      c.fullName ??
      c.name ??
      `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() ??
      `Candidate ${i + 1}`;
    const id = c.id ?? `CAND-${i + 1}`;
    const stage = mapStage(c.stage);
    const status = deriveStatus(c.stage);
    const h = hash(id);
    const skillSource =
      req && req.requiredSkills.length ? req.requiredSkills : SKILL_POOL;
    const skills = skillSource.slice(0, 3 + (h % 2));

    const scorecards: Scorecard[] = [];
    if ((stage === "interview" || stage === "hired") && status !== "rejected") {
      const overall = 3 + (h % 3); // 3..5
      scorecards.push({
        id: `${id}-SC1`,
        by: req?.hiringManager ?? "Hiring Manager",
        at: c.updatedAt ?? c.appliedAt ?? "2026-01-01",
        criteria: [
          { label: "Technical", score: overall },
          { label: "Communication", score: Math.max(1, overall - (h % 2)) },
          { label: "Culture fit", score: Math.min(5, overall + (h % 2)) },
        ],
        overall,
        recommendation: overall >= 4 ? "yes" : "no",
      });
    }

    // Real offers from the bundle win; fall back to a synthetic acceptance so
    // a hire imported without one still satisfies the offer gate.
    const offers: CandidateOffer[] = offersByCandidate.get(id) ?? [];
    if (!offers.length && stage === "hired") {
      offers.push({
        id: `${id}-OF1`,
        at: c.updatedAt ?? "2026-01-01",
        status: "accepted",
        salary: req?.salaryMin,
        startDate: req?.targetStartDate,
      });
    }

    const communications: CandidateCommunication[] = [
      {
        id: `${id}-CM1`,
        at: c.appliedAt ?? "2026-01-01",
        channel: "note",
        body: "Application received.",
        by: "System",
      },
    ];

    const candidate: Candidate = {
      id,
      requisitionId: reqId,
      requisitionTitle: req?.positionTitle ?? "—",
      name,
      initials: initialsFor(name),
      email: c.email ?? `candidate${i + 1}@example.com`,
      phone: c.phone,
      source: normalizeSource(c.source),
      stage,
      status,
      appliedAt: c.appliedAt ?? bundle.tenant.createdAt.slice(0, 10),
      updatedAt:
        c.updatedAt ?? c.appliedAt ?? bundle.tenant.createdAt.slice(0, 10),
      notes: c.notes,
      cvUrl: c.resumeUrl,
      linkedin: undefined,
      skills,
      experienceSummary: req
        ? `Candidate applying for ${req.positionTitle} in ${req.department}.`
        : undefined,
      scorecards,
      communications,
      offers,
      attachments: c.resumeUrl
        ? [{ id: `${id}-CV`, name: "CV / Resume", url: c.resumeUrl, kind: "cv" }]
        : [],
      score: null,
    };
    recomputeScore(candidate);
    return candidate;
  });

  // Ensure every requisition has a full pipeline of applicants to test with.
  const createdAt = bundle.tenant.createdAt.slice(0, 10);
  const synthetic = requisitions.flatMap((r) =>
    syntheticForRequisition(r, createdAt),
  );

  const candidateNames = new Map(candidates.map((c) => [c.id, c.name]));
  const interviews: Interview[] = rawInterviews.map((iv, i) => {
    const round = iv.round ?? "Interview";
    const { mode, durationMins } = interviewShapeFor(round);
    const panel = iv.interviewerIds ?? [];
    return {
      id: iv.id ?? `INT-${i + 1}`,
      candidateId: iv.candidateId ?? "",
      candidateName: candidateNames.get(iv.candidateId ?? "") ?? "—",
      requisitionId: iv.jobPostingId ?? "",
      round,
      scheduledAt: iv.scheduledAt ?? createdAt,
      durationMins,
      mode,
      panel,
      panelNames: panel.map(
        (id) => employeesById.get(id)?.fullName ?? id,
      ),
      status: mapInterviewStatus(iv.status),
    };
  });

  return {
    requisitions,
    candidates: [...candidates, ...synthetic],
    interviews,
    templates: DEFAULT_TEMPLATES,
    seedVersion: SEED_VERSION,
  };
}

const recruitmentSlice = createSlice({
  name: "recruitment",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{ byCountry: Record<string, RecruitmentBucket> }>,
    ) {
      // Only accept persisted buckets at the current seed version. Stale data
      // (older shape / pre-migration stages) is ignored so the fresh demo seed
      // wins — this also stops an async cache/server hydrate from clobbering a
      // just-reseeded bucket.
      const incoming = action.payload.byCountry;
      if (incoming) {
        for (const [country, bucket] of Object.entries(incoming)) {
          if (bucket?.seedVersion === SEED_VERSION) {
            state.byCountry[country] = bucket;
          }
        }
      }
      state.status = "ready";
    },
    seedCountry(
      state,
      action: PayloadAction<{ country: string; bucket: RecruitmentBucket }>,
    ) {
      const { country, bucket } = action.payload;
      const existing = state.byCountry[country];
      // Seed when missing, or replace when the demo seed version changed.
      if (!existing || existing.seedVersion !== bucket.seedVersion) {
        state.byCountry[country] = bucket;
      }
      state.status = "ready";
    },

    // ── Requisitions ──
    addRequisition(
      state,
      action: PayloadAction<{ country: string; requisition: JobRequisition }>,
    ) {
      state.byCountry[action.payload.country]?.requisitions.unshift(
        action.payload.requisition,
      );
    },
    updateRequisition(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        patch: Partial<JobRequisition>;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const r = b?.requisitions.find((x) => x.id === action.payload.id);
      if (r) Object.assign(r, action.payload.patch);
    },
    setRequisitionStatus(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        status: RequisitionStatus;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const r = b?.requisitions.find((x) => x.id === action.payload.id);
      if (r) r.status = action.payload.status;
    },
    setRequisitionApproval(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        approvalRequestId: string;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const r = b?.requisitions.find((x) => x.id === action.payload.id);
      if (r) {
        r.approvalRequestId = action.payload.approvalRequestId;
        r.status = "pending_approval";
      }
    },

    // ── Candidates ──
    addCandidate(
      state,
      action: PayloadAction<{ country: string; candidate: Candidate }>,
    ) {
      state.byCountry[action.payload.country]?.candidates.unshift(
        action.payload.candidate,
      );
    },
    updateCandidate(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        patch: Partial<Candidate>;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const c = b?.candidates.find((x) => x.id === action.payload.id);
      if (c) Object.assign(c, action.payload.patch);
    },
    moveStage(
      state,
      action: PayloadAction<{
        country: string;
        ids: string[];
        stage: RecruitmentStageType;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      if (!b) return;
      const at = new Date().toISOString().slice(0, 10);
      for (const c of b.candidates) {
        if (action.payload.ids.includes(c.id)) {
          c.stage = action.payload.stage;
          c.status = "active"; // advancing re-activates
          c.updatedAt = at;
        }
      }
    },
    setCandidateStatus(
      state,
      action: PayloadAction<{
        country: string;
        ids: string[];
        status: CandidateStatus;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      if (!b) return;
      const at = new Date().toISOString().slice(0, 10);
      for (const c of b.candidates) {
        if (action.payload.ids.includes(c.id)) {
          c.status = action.payload.status;
          c.updatedAt = at;
        }
      }
    },
    /**
     * §7.18 — record an offer against a candidate. `Candidate.offers` already
     * existed but nothing ever wrote to it, so the offer/accept/decline round
     * trip happened entirely outside the system.
     */
    sendOffer(
      state,
      action: PayloadAction<{
        country: string;
        candidateId: string;
        salary?: number;
        startDate?: string;
        notes?: string;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      if (!b) return;
      const c = b.candidates.find((x) => x.id === action.payload.candidateId);
      if (!c) return;
      const at = new Date().toISOString().slice(0, 10);
      c.offers.push({
        id: `OF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        at,
        status: "sent",
        salary: action.payload.salary,
        startDate: action.payload.startDate,
        notes: action.payload.notes,
      });
      c.updatedAt = at;
    },

    /**
     * §7.18 — the candidate's answer. Declining rejects them outright: an
     * offer turned down is the end of that pipeline, not a state to sit in.
     *
     * The offer conversation itself happens over email. This records the
     * outcome, which is what gates `hired` and what anyone auditing the hire
     * later actually needs. `at` is left as the date the offer was *sent* —
     * overwriting it with the response date lost how long the candidate took
     * to answer, which is the one thing the pair of dates is good for.
     */
    respondToOffer(
      state,
      action: PayloadAction<{
        country: string;
        candidateId: string;
        accepted: boolean;
        by?: string;
        note?: string;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      if (!b) return;
      const c = b.candidates.find((x) => x.id === action.payload.candidateId);
      if (!c) return;
      const latest = c.offers.at(-1);
      if (!latest) return;
      const at = new Date().toISOString().slice(0, 10);
      latest.status = action.payload.accepted ? "accepted" : "rejected";
      latest.respondedAt = at;
      latest.respondedBy = action.payload.by;
      latest.responseNote = action.payload.note?.trim() || undefined;
      if (!action.payload.accepted) {
        c.status = "rejected";
        c.rejectionReason = "Declined offer";
        c.rejectedAt = at;
      }
      c.updatedAt = at;
    },

    /**
     * §7.18 — links the candidate to the employee record created from them,
     * so the Applicant → Offer → Hired → Onboarding → Employee chain can be
     * followed in either direction.
     */
    linkEmployeeRecord(
      state,
      action: PayloadAction<{
        country: string;
        candidateId: string;
        employeeId: string;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      if (!b) return;
      const c = b.candidates.find((x) => x.id === action.payload.candidateId);
      if (!c) return;
      c.createdEmployeeId = action.payload.employeeId;
      c.updatedAt = new Date().toISOString().slice(0, 10);
    },

    setGateProgress(
      state,
      action: PayloadAction<{
        country: string;
        candidateId: string;
        stage: RecruitmentStageType;
        progress: CandidateGateProgress;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const c = b?.candidates.find((x) => x.id === action.payload.candidateId);
      if (!c) return;
      const gp = c.gateProgress ?? {};
      gp[action.payload.stage] = {
        ...gp[action.payload.stage],
        ...action.payload.progress,
      };
      c.gateProgress = gp;
    },
    addScorecard(
      state,
      action: PayloadAction<{
        country: string;
        candidateId: string;
        scorecard: Scorecard;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const c = b?.candidates.find((x) => x.id === action.payload.candidateId);
      if (c) {
        c.scorecards.push(action.payload.scorecard);
        recomputeScore(c);
      }
    },
    addCommunication(
      state,
      action: PayloadAction<{
        country: string;
        candidateIds: string[];
        comm: Omit<CandidateCommunication, "id">;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      if (!b) return;
      for (const c of b.candidates) {
        if (action.payload.candidateIds.includes(c.id)) {
          c.communications.unshift({ id: uid("CM"), ...action.payload.comm });
        }
      }
    },
    // `addOffer`/`setOfferStatus` used to sit here as a second, incompatible
    // offer path: they unshifted (so `latestOffer()` read the oldest offer)
    // and changed nothing else, leaving a candidate who had accepted stuck at
    // the offer stage. Everything now goes through sendOffer/respondToOffer.

    // ── Interviews ──
    scheduleInterview(
      state,
      action: PayloadAction<{ country: string; interview: Interview }>,
    ) {
      state.byCountry[action.payload.country]?.interviews.unshift(
        action.payload.interview,
      );
    },
    cancelInterview(
      state,
      action: PayloadAction<{ country: string; id: string }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const iv = b?.interviews.find((x) => x.id === action.payload.id);
      if (iv) iv.status = "cancelled";
    },
    markReminder(
      state,
      action: PayloadAction<{ country: string; id: string }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const iv = b?.interviews.find((x) => x.id === action.payload.id);
      if (iv) iv.reminderSent = true;
    },
    setInterviewStatus(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        status: Interview["status"];
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const iv = b?.interviews.find((x) => x.id === action.payload.id);
      if (iv) iv.status = action.payload.status;
    },
    /**
     * Record the outcome of an interview: mark the session completed, write a
     * scorecard, and move the candidate on.
     *
     * Scoring and advancing are one action rather than two dispatches because
     * the `interview` → `interviewed` gate reads the candidate's score. Split
     * across two dispatches the caller would be checking a candidate object
     * captured before the score landed, so the gate would either reject a
     * candidate who had just been scored or have to be skipped entirely — and a
     * gate you skip on the happy path is not a gate.
     */
    recordInterviewScores(
      state,
      action: PayloadAction<{
        country: string;
        entries: {
          candidateId: string;
          score: number;
          comment?: string;
          recommendation?: ScorecardRecommendation;
        }[];
        by: string;
        /** Stage to move the scored candidates into once recorded. */
        advanceTo?: RecruitmentStageType;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      if (!b) return;
      const at = new Date().toISOString().slice(0, 10);
      const byId = new Map(
        action.payload.entries.map((e) => [e.candidateId, e]),
      );

      for (const iv of b.interviews) {
        if (byId.has(iv.candidateId) && iv.status === "scheduled") {
          iv.status = "completed";
        }
      }

      for (const c of b.candidates) {
        const entry = byId.get(c.id);
        if (!entry) continue;
        c.scorecards.push({
          id: uid("SC"),
          by: action.payload.by,
          at,
          criteria: [{ label: "Interview", score: entry.score }],
          overall: entry.score,
          comment: entry.comment?.trim() || undefined,
          recommendation:
            entry.recommendation ?? (entry.score >= 4 ? "yes" : "no"),
        });
        recomputeScore(c);
        if (action.payload.advanceTo) c.stage = action.payload.advanceTo;
        c.updatedAt = at;
      }
    },

    // ── Templates ──
    addTemplate(
      state,
      action: PayloadAction<{ country: string; template: RequisitionTemplate }>,
    ) {
      state.byCountry[action.payload.country]?.templates.unshift(
        action.payload.template,
      );
    },
  },
});

export const {
  hydrate,
  seedCountry,
  addRequisition,
  updateRequisition,
  setRequisitionStatus,
  setRequisitionApproval,
  addCandidate,
  updateCandidate,
  moveStage,
  setCandidateStatus,
  sendOffer,
  respondToOffer,
  linkEmployeeRecord,
  setGateProgress,
  addScorecard,
  addCommunication,
  scheduleInterview,
  cancelInterview,
  markReminder,
  setInterviewStatus,
  recordInterviewScores,
  addTemplate,
} = recruitmentSlice.actions;

export default recruitmentSlice.reducer;
