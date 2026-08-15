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
} from "@/src/lib/types/recruitment";
import { defaultFlow } from "@/src/data/recruitment-demo";

/** Bump to force a one-time reseed of recruitment demo data on next load. */
export const SEED_VERSION = 3;

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

/** Map a raw/granular stage string onto the live 3-stage pipeline set. */
function mapStage(s?: string): RecruitmentStageType {
  switch (s) {
    case "interview":
    case "interview_1":
    case "interview_2":
    case "assessment":
    case "offer":
      return "interview";
    case "hired":
      return "hired";
    default:
      // applied, screening, talent_pool, shortlisted, rejected, unknown → entry
      return "applicants";
  }
}

function deriveStatus(s?: string): CandidateStatus {
  return s === "rejected" ? "rejected" : "active";
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
  salaryRange?: { min?: number; max?: number };
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

  const scorecards: Scorecard[] = [];
  if ((stage === "interview" || stage === "hired") && status !== "rejected") {
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
    });
  }

  const offers: CandidateOffer[] = [];
  if (stage === "hired") {
    offers.push({
      id: `${id}-OF`,
      at: createdAt,
      status: "accepted",
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
    shortlisted: 3,
    interview: 2,
    offer: 1,
    hired: 1,
  };
  let applicants = base.applicants;
  if (!enabled.has("shortlisted")) applicants += base.shortlisted;
  if (!enabled.has("interview")) applicants += base.interview;
  const counts: Record<RecruitmentStageType, number> = {
    applicants,
    shortlisted: enabled.has("shortlisted") ? base.shortlisted : 0,
    interview: enabled.has("interview") ? base.interview : 0,
    // §7.18 — a flow stored before the offer stage existed has no entry for
    // it, so treat a missing entry as enabled rather than as switched off.
    offer: enabled.has("offer") || !enabled.size ? base.offer : 0,
    hired: base.hired,
  };

  const out: Candidate[] = [];
  let n = 1;
  (
    [
      "applicants",
      "shortlisted",
      "interview",
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
    recruitment?: { jobPostings?: RawJobPosting[]; candidates?: RawCandidate[] };
  }).recruitment ?? {};
  const postings = rec.jobPostings ?? [];
  const rawCandidates = rec.candidates ?? [];

  const priorities = ["low", "medium", "high", "urgent"] as const;

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

    const offers: CandidateOffer[] = [];
    if (stage === "hired") {
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

  return {
    requisitions,
    candidates: [...candidates, ...synthetic],
    interviews: [],
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
     */
    respondToOffer(
      state,
      action: PayloadAction<{
        country: string;
        candidateId: string;
        accepted: boolean;
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
      latest.at = at;
      if (!action.payload.accepted) c.status = "rejected";
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
    addOffer(
      state,
      action: PayloadAction<{
        country: string;
        candidateId: string;
        offer: CandidateOffer;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const c = b?.candidates.find((x) => x.id === action.payload.candidateId);
      if (c) c.offers.unshift(action.payload.offer);
    },
    setOfferStatus(
      state,
      action: PayloadAction<{
        country: string;
        candidateId: string;
        offerId: string;
        status: CandidateOffer["status"];
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      const c = b?.candidates.find((x) => x.id === action.payload.candidateId);
      const o = c?.offers.find((x) => x.id === action.payload.offerId);
      if (o) o.status = action.payload.status;
    },

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
     * Bulk-complete the interviews for a set of candidates and record a single
     * interview score on each (via a one-criterion scorecard, which feeds the
     * candidate's Score column and the drawer's Score tab).
     */
    completeInterviews(
      state,
      action: PayloadAction<{
        country: string;
        candidateIds: string[];
        score: number;
        by: string;
      }>,
    ) {
      const b = state.byCountry[action.payload.country];
      if (!b) return;
      const at = new Date().toISOString().slice(0, 10);
      const ids = new Set(action.payload.candidateIds);
      for (const iv of b.interviews) {
        if (ids.has(iv.candidateId) && iv.status === "scheduled") {
          iv.status = "completed";
        }
      }
      for (const c of b.candidates) {
        if (!ids.has(c.id)) continue;
        c.scorecards.push({
          id: uid("SC"),
          by: action.payload.by,
          at,
          criteria: [{ label: "Interview", score: action.payload.score }],
          overall: action.payload.score,
          recommendation: action.payload.score >= 4 ? "yes" : "no",
        });
        recomputeScore(c);
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
  addOffer,
  setOfferStatus,
  scheduleInterview,
  cancelInterview,
  markReminder,
  setInterviewStatus,
  completeInterviews,
  addTemplate,
} = recruitmentSlice.actions;

export default recruitmentSlice.reducer;
