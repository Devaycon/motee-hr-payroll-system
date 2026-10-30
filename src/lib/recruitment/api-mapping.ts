import type {
  CandidateDto,
  CandidateRequest,
  ScorecardRecommendation as ApiRecommendation,
} from "@/src/types/candidates";
import type { InterviewDto, InterviewRequest } from "@/src/types/interviews";
import type {
  RequisitionDto,
  RequisitionRequest,
  RequisitionStatus as ApiRequisitionStatus,
} from "@/src/types/requisitions";
import type {
  Candidate,
  Interview,
  JobRequisition,
  RecruitmentStageType,
  RequisitionStatus,
  ScorecardRecommendation,
} from "@/src/lib/types/recruitment";
import { getInitials } from "@/src/lib/types/dashboard";
import {
  employmentTypeFromApi,
  employmentTypeToApi,
} from "@/src/lib/employees/api-mapping";
import { defaultFlow } from "@/src/data/recruitment-demo";

/**
 * The recruitment screens were built first and the API follows them closely;
 * the differences are camelCase enums and the parts of a vacancy the API does
 * not store (application form, advert, posting platforms, stage gates). Those
 * stay on the local copy and are carried across each refresh by `mergeLocal`.
 */

const STATUS_FROM_API: Record<ApiRequisitionStatus, RequisitionStatus> = {
  draft: "draft",
  pendingApproval: "pending_approval",
  approved: "approved",
  open: "open",
  interviewing: "interviewing",
  offerStage: "offer_stage",
  filled: "filled",
  closed: "closed",
  cancelled: "cancelled",
  onHold: "on_hold",
};

const RECOMMENDATION_FROM_API: Record<ApiRecommendation, ScorecardRecommendation> = {
  strongNo: "strong_no",
  no: "no",
  yes: "yes",
  strongYes: "strong_yes",
};

const RECOMMENDATION_TO_API: Record<ScorecardRecommendation, ApiRecommendation> = {
  strong_no: "strongNo",
  no: "no",
  yes: "yes",
  strong_yes: "strongYes",
};

export function recommendationToApi(
  r: ScorecardRecommendation | undefined,
): ApiRecommendation | undefined {
  return r ? RECOMMENDATION_TO_API[r] : undefined;
}

const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Vacancies are still started from the (demo) Requisition module, whose
 * people carry sample ids; only real record ids are sent.
 */
const recordId = (id?: string | null) => (id && UUID.test(id) ? id : null);

export function toJobRequisition(dto: RequisitionDto): JobRequisition {
  // The API lists the enabled stages; the screens hold the whole pipeline
  // with a flag on each.
  const enabled = new Set<RecruitmentStageType>(dto.stages);
  const flow = defaultFlow();
  if (enabled.size) {
    for (const stage of flow.stages) {
      if (stage.type !== "applicants" && stage.type !== "hired") {
        stage.enabled = enabled.has(stage.type);
      }
    }
  }

  return {
    id: dto.id,
    requisitionNumber: dto.reference ?? undefined,
    positionTitle: dto.positionTitle,
    department: dto.department ?? "",
    departmentId: dto.departmentId ?? undefined,
    hiringManager: dto.hiringManager ?? "",
    hiringManagerId: dto.hiringManagerId ?? undefined,
    recruiter: dto.recruiter ?? undefined,
    recruiterId: dto.recruiterId ?? undefined,
    hrBusinessPartner: dto.hrBusinessPartner ?? undefined,
    hrBusinessPartnerId: dto.hrBusinessPartnerId ?? undefined,
    interviewPanel: dto.interviewPanel,
    interviewPanelNames: dto.interviewPanelNames,
    employmentType: employmentTypeFromApi(dto.employmentType),
    status: STATUS_FROM_API[dto.status],
    hiringPriority: dto.hiringPriority,
    location: dto.location ?? "",
    openings: dto.openings,
    salaryMin: dto.salaryMin ?? 0,
    salaryMax: dto.salaryMax ?? 0,
    jobDescription: dto.jobDescription ?? "",
    qualifications: dto.qualifications ?? undefined,
    requiredSkills: dto.requiredSkills,
    targetStartDate: day(dto.targetStartDate) ?? "",
    expiryDate: day(dto.expiryDate),
    createdAt: day(dto.createdAt) ?? "",
    flow,
  };
}

export function requisitionToRequest(
  req: JobRequisition,
  departmentIdByName: Map<string, string>,
): RequisitionRequest {
  const stages = (req.flow ?? defaultFlow()).stages
    .filter((s) => s.enabled)
    .map((s) => s.type);
  return {
    positionTitle: req.positionTitle.trim(),
    departmentId: departmentIdByName.get(req.department) ?? recordId(req.departmentId),
    hiringManagerId: recordId(req.hiringManagerId),
    recruiterId: recordId(req.recruiterId),
    hrBusinessPartnerId: recordId(req.hrBusinessPartnerId),
    interviewPanel: (req.interviewPanel ?? []).filter((id) => UUID.test(id)),
    employmentType: employmentTypeToApi(req.employmentType),
    hiringPriority: req.hiringPriority,
    location: req.location || null,
    openings: req.openings,
    salaryMin: req.salaryMin || null,
    salaryMax: req.salaryMax || null,
    jobDescription: req.jobDescription || null,
    qualifications: req.qualifications || null,
    requiredSkills: req.requiredSkills,
    targetStartDate: req.targetStartDate || null,
    expiryDate: req.expiryDate || null,
    stages,
  };
}

export function toCandidate(dto: CandidateDto): Candidate {
  return {
    id: dto.id,
    requisitionId: dto.requisitionId,
    requisitionTitle: dto.requisitionTitle ?? "",
    name: dto.name,
    initials: getInitials(dto.name),
    email: dto.email,
    phone: dto.phone ?? undefined,
    source: dto.source ?? "careers_page",
    stage: dto.stage,
    status: dto.status,
    appliedAt: day(dto.appliedAt) ?? "",
    updatedAt: day(dto.updatedAt) ?? "",
    notes: dto.notes ?? undefined,
    linkedin: dto.linkedIn ?? undefined,
    skills: dto.skills,
    experienceSummary: dto.experienceSummary ?? undefined,
    scorecards: dto.scorecards.map((s) => ({
      id: s.id,
      interviewId: s.interviewId ?? undefined,
      by: s.byName ?? "Interviewer",
      at: day(s.createdAt) ?? "",
      criteria: s.criteria,
      overall: s.overall ?? 0,
      comment: s.comment ?? undefined,
      recommendation: s.recommendation
        ? RECOMMENDATION_FROM_API[s.recommendation]
        : undefined,
    })),
    communications: [],
    offers: dto.offers.map((o) => ({
      id: o.id,
      at: day(o.sentAt) ?? "",
      // A withdrawn offer is no longer live; the screens have no state for it.
      status: o.status === "withdrawn" ? "rejected" : o.status,
      salary: o.salary ?? undefined,
      startDate: day(o.startDate),
      notes: o.notes ?? undefined,
      respondedAt: day(o.respondedAt),
      responseNote: o.responseNote ?? undefined,
      attachmentId: o.attachmentFileId ?? undefined,
    })),
    attachments: [],
    score: dto.score ?? null,
    createdEmployeeId: dto.createdEmployeeId ?? undefined,
    ownerEmployeeId: dto.ownerEmployeeId ?? undefined,
    ownerName: dto.ownerName ?? undefined,
    rejectionReason: dto.rejectionReason ?? undefined,
    rejectedAt: day(dto.rejectedAt),
  };
}

export function candidateToRequest(c: Candidate): CandidateRequest {
  const [firstName, ...rest] = c.name.trim().split(/\s+/);
  return {
    requisitionId: c.requisitionId,
    firstName: firstName ?? "",
    // The API needs both names; a single-word name repeats as the surname.
    lastName: rest.join(" ") || firstName || "",
    email: c.email.trim(),
    phone: c.phone || null,
    source: c.source || null,
    skills: c.skills,
    experienceSummary: c.experienceSummary || null,
    notes: c.notes || null,
    linkedIn: c.linkedin || null,
    ownerEmployeeId: recordId(c.ownerEmployeeId),
  };
}

export function toInterview(dto: InterviewDto): Interview {
  return {
    id: dto.id,
    candidateId: dto.candidateId,
    candidateName: dto.candidateName,
    requisitionId: dto.requisitionId,
    round: dto.round,
    scheduledAt: dto.scheduledAt,
    durationMins: dto.durationMinutes,
    mode: dto.mode,
    panel: dto.panel,
    panelNames: dto.panelNames,
    location: dto.location ?? undefined,
    status: dto.status,
  };
}

export function interviewToRequest(iv: Interview): InterviewRequest {
  return {
    candidateId: iv.candidateId,
    round: iv.round,
    scheduledAt: iv.scheduledAt,
    durationMinutes: iv.durationMins,
    mode: iv.mode,
    panel: iv.panel,
    location: iv.location || null,
  };
}

/**
 * Server records with the local-only parts of the matching local record laid
 * back on, so a refresh does not wipe what the API has no field for.
 */
export function mergeLocal<T extends { id: string }>(
  server: T[],
  local: T[],
  localOnly: (keyof T)[],
): T[] {
  const byId = new Map(local.map((x) => [x.id, x]));
  return server.map((item) => {
    const mine = byId.get(item.id);
    if (!mine) return item;
    const kept: Partial<T> = {};
    for (const key of localOnly) {
      if (mine[key] !== undefined) kept[key] = mine[key];
    }
    return { ...item, ...kept };
  });
}

/** What the API does not store on a vacancy. */
export const REQUISITION_LOCAL_FIELDS: (keyof JobRequisition)[] = [
  "applicationForm",
  "filterConstraints",
  "postingPlatforms",
  "flow",
  "scheduledPublishAt",
  "autoCloseOnExpiry",
  "advert",
  "approvalRequestId",
  "workforceRequestId",
  "sourceRequisitionId",
];

/** What the API does not store on an applicant. */
export const CANDIDATE_LOCAL_FIELDS: (keyof Candidate)[] = [
  "communications",
  "attachments",
  "gateProgress",
  "onboardingInvitedAt",
  "cvUrl",
  "coverLetterUrl",
];
