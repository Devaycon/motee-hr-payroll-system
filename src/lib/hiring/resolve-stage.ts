/**
 * Where every hiring effort has got to, as one list.
 *
 * The chain runs across five slices — workforce requests, requisitions,
 * vacancies, candidates and onboarding records — and nothing joined them up,
 * so answering "what stage is this recruitment on?" meant opening three
 * modules and comparing by eye. This resolves each effort to exactly one of
 * the eight lifecycle stages, and never lists the same effort twice: a
 * workforce request that became a requisition is represented by the
 * requisition, not by both.
 */
import type { WorkforceRequest } from "@/src/lib/stores/workforce-requests-slice";
import type { Requisition } from "@/src/lib/stores/requisitions-slice";
import type { Candidate, JobRequisition } from "@/src/lib/types/recruitment";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";
import { isRecruitingVacancy } from "@/src/lib/types/recruitment";
import { isSyntheticVacancyId } from "@/src/lib/demo/hiring-chain";

/** Lifecycle stage ids, mirroring `LIFECYCLE_STAGES` in the lifecycle module. */
export type HiringStageId =
  | "workforce-planning"
  | "requisition"
  | "attract"
  | "select"
  | "pre-employment"
  | "onboard";

export const HIRING_STAGES: { id: HiringStageId; step: number; label: string }[] = [
  { id: "workforce-planning", step: 1, label: "Workforce Planning" },
  { id: "requisition", step: 2, label: "Requisition" },
  { id: "attract", step: 3, label: "Attract" },
  { id: "select", step: 4, label: "Select" },
  { id: "pre-employment", step: 5, label: "Pre-employment" },
  { id: "onboard", step: 6, label: "Onboard" },
];

/** Days without movement before a row is called out as stalled. */
export const STALL_DAYS = 10;

export interface HiringRow {
  /** Stable key — the id of the furthest-along record in the chain. */
  id: string;
  /** The role being filled. */
  title: string;
  department: string;
  stageId: HiringStageId;
  /** 1–6, so a tracker can render progress without a lookup. */
  step: number;
  /** What is actually happening right now, in words. */
  detail: string;
  /** The named hire, once one exists. */
  person?: string;
  /** Who the work currently sits with. */
  owner: string;
  /** Days since this effort last moved. */
  days: number;
  stalled: boolean;
  href: string;
}

function daysSince(iso: string | undefined, now: Date): number {
  if (!iso) return 0;
  const then = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(then.getTime())) return 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - then.getTime()) / 86_400_000));
}

/**
 * Where to send someone who wants to see a vacancy.
 *
 * A back-filled vacancy has no page in the Recruitment module - linking to one
 * lands on "Requisition not found" - so the onboarding record it was minted
 * for stands in as the thing you can actually open.
 */
function vacancyHref(
  vacancyId: string | undefined,
  fallbackRecordId?: string,
): string | undefined {
  if (!vacancyId) return undefined;
  if (!isSyntheticVacancyId(vacancyId)) return `/talent/recruitment/${vacancyId}`;
  return fallbackRecordId ? `/talent/onboarding/${fallbackRecordId}` : undefined;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** The reviewer of the first task still outstanding — who the record waits on. */
function onboardingOwner(record: OnboardingRecord): string {
  const pending = record.tasks.find((t) => t.status !== "completed");
  return pending?.reviewer ?? "HR";
}

export interface HiringSources {
  workforceRequests: WorkforceRequest[];
  requisitions: Requisition[];
  vacancies: JobRequisition[];
  candidates: Candidate[];
  onboarding: OnboardingRecord[];
}

/**
 * One row per hiring effort, ordered by how far along it is (least advanced
 * first, so the things needing a push sit at the top).
 */
export function resolveHiringRows(
  sources: HiringSources,
  now: Date = new Date(),
): HiringRow[] {
  const { workforceRequests, requisitions, vacancies, candidates, onboarding } =
    sources;
  const rows: HiringRow[] = [];

  // Onboarding records created from a hire are keyed `onb-<candidateId>`, which
  // is the only link back to the vacancy they came from.
  const onboardingByCandidate = new Map<string, OnboardingRecord>();
  for (const record of onboarding) {
    if (record.id.startsWith("onb-")) {
      onboardingByCandidate.set(record.id.slice(4), record);
    }
  }
  const claimedOnboarding = new Set<string>();

  // ── Stage 3–6: vacancies, placed by what their pipeline contains ──
  for (const vacancy of vacancies) {
    const mine = candidates.filter((c) => c.requisitionId === vacancy.id);
    const active = mine.filter((c) => c.status === "active");
    const linked = mine
      .map((c) => onboardingByCandidate.get(c.id))
      .filter((r): r is OnboardingRecord => Boolean(r));
    for (const record of linked) claimedOnboarding.add(record.id);

    const onboarding_ = linked.filter((r) => r.stage !== "pre_boarding");
    const preBoarding = linked.filter((r) => r.stage === "pre_boarding");
    const atOffer = active.filter((c) => c.stage === "offer");
    const hiredNotInvited = active.filter(
      (c) => c.stage === "hired" && !c.onboardingInvitedAt,
    );
    const inSelection = active.filter(
      (c) => c.stage === "interview" || c.stage === "interviewed",
    );

    let stageId: HiringStageId;
    let detail: string;
    let person: string | undefined;
    let owner = vacancy.hiringManager || "Unassigned";
    let anchor = vacancy.createdAt;

    if (onboarding_.length > 0) {
      const record = onboarding_[0];
      stageId = "onboard";
      person = record.employeeName;
      detail = `${record.completedTasks}/${record.totalTasks} onboarding tasks done`;
      owner = onboardingOwner(record);
      anchor = record.initiatedAt;
    } else if (preBoarding.length > 0) {
      const record = preBoarding[0];
      stageId = "pre-employment";
      person = record.employeeName;
      detail = `Checks in progress · starts ${record.startDate}`;
      owner = onboardingOwner(record);
      anchor = record.initiatedAt;
    } else if (hiredNotInvited.length > 0) {
      const hire = hiredNotInvited[0];
      stageId = "pre-employment";
      person = hire.name;
      detail = "Hired — onboarding invite not sent";
      anchor = hire.updatedAt;
    } else if (atOffer.length > 0) {
      const hire = atOffer[0];
      stageId = "pre-employment";
      person = hire.name;
      detail = "Offer out — awaiting acceptance";
      anchor = hire.updatedAt;
    } else if (inSelection.length > 0) {
      stageId = "select";
      detail = `${plural(inSelection.length, "candidate")} in selection`;
      // The most recent movement in the group — one candidate progressing
      // means the vacancy is not stalled, even if the others have sat still.
      anchor =
        inSelection
          .map((c) => c.updatedAt)
          .sort()
          .at(-1) ?? anchor;
    } else if (isRecruitingVacancy(vacancy.status)) {
      stageId = "attract";
      const applicants = active.filter((c) => c.stage === "applicants").length;
      detail =
        applicants > 0
          ? `${plural(applicants, "applicant")} to review`
          : "Published — no applicants yet";
    } else {
      stageId = "attract";
      detail = vacancy.status === "draft" ? "Vacancy still in draft" : "Not recruiting";
    }

    const days = daysSince(anchor, now);
    rows.push({
      id: vacancy.id,
      title: vacancy.positionTitle,
      department: vacancy.department,
      stageId,
      step: HIRING_STAGES.find((s) => s.id === stageId)!.step,
      detail,
      person,
      owner,
      days,
      stalled: days >= STALL_DAYS,
      href:
        vacancyHref(vacancy.id, linked[0]?.id) ?? `/talent/hire-tracker/${vacancy.id}`,
    });
  }

  // ── Stage 2: requisitions that have not become a vacancy yet ──
  for (const requisition of requisitions) {
    if (requisition.status === "converted" || requisition.recruitmentId) continue;
    const days = daysSince(requisition.createdAt, now);
    rows.push({
      id: requisition.id,
      title: requisition.title,
      department: requisition.department,
      stageId: "requisition",
      step: 2,
      detail: requisition.approvalRequestId
        ? "Requisition awaiting approval"
        : "Requisition drafted — not submitted",
      owner:
        requisition.hiringManager ||
        requisition.reportingManager ||
        requisition.createdByName,
      days,
      stalled: days >= STALL_DAYS,
      href: "/talent/requisition",
    });
  }

  // ── Stage 1: workforce requests that have not become a requisition yet ──
  for (const request of workforceRequests) {
    if (request.status === "converted" || request.requisitionId) continue;
    const days = daysSince(request.createdAt, now);
    rows.push({
      id: request.id,
      title: request.position || `${plural(request.numberOfHires, "hire")}`,
      department: request.department,
      stageId: "workforce-planning",
      step: 1,
      detail: request.approvalRequestId
        ? "Workforce request awaiting approval"
        : "Workforce request drafted — not submitted",
      owner: request.createdByName,
      days,
      stalled: days >= STALL_DAYS,
      href: "/talent/workforce-requests",
    });
  }

  // ── Stage 5–6: onboarding entered by hand, with no vacancy behind it ──
  for (const record of onboarding) {
    if (claimedOnboarding.has(record.id)) continue;
    const isPre = record.stage === "pre_boarding";
    const days = daysSince(record.initiatedAt, now);
    rows.push({
      id: record.id,
      title: record.jobTitle,
      department: record.department,
      stageId: isPre ? "pre-employment" : "onboard",
      step: isPre ? 5 : 6,
      detail: isPre
        ? `Checks in progress · starts ${record.startDate}`
        : `${record.completedTasks}/${record.totalTasks} onboarding tasks done`,
      person: record.employeeName,
      owner: onboardingOwner(record),
      days,
      stalled: days >= STALL_DAYS,
      href: `/talent/onboarding/${record.id}`,
    });
  }

  // Least advanced first, and within a stage the most stuck first — the top of
  // the list is then always the thing most in need of a push.
  return rows.sort((a, b) => a.step - b.step || b.days - a.days);
}

/**
 * Everything behind one row of the tracker.
 *
 * The chain is stored as four records in four slices linked by id, so a detail
 * view has to walk it in both directions: from whichever record you clicked,
 * back to the workforce request that started it and forward to the people it
 * ended up hiring.
 */
export interface HiringDetail {
  row: HiringRow;
  workforceRequest?: WorkforceRequest;
  requisition?: Requisition;
  vacancy?: JobRequisition;
  /** Applicants on the vacancy, in pipeline order. */
  candidates: Candidate[];
  /** Onboarding records for this vacancy's hires. */
  onboarding: OnboardingRecord[];
}

export function findHiringDetail(
  sources: HiringSources,
  id: string,
  now: Date = new Date(),
): HiringDetail | null {
  const row = resolveHiringRows(sources, now).find((r) => r.id === id);
  if (!row) return null;

  const { workforceRequests, requisitions, vacancies, candidates, onboarding } =
    sources;

  // Every back-link is guarded on the id being present. A bare
  // `find((w) => w.requisitionId === requisition?.id)` reads as "the request
  // that became this requisition", but when there is no requisition it
  // silently becomes `=== undefined` and matches the first *unconverted*
  // request in the list - attaching a stranger's budget and headcount to a
  // hire that has nothing to do with it.
  const byId = <T extends { id: string }>(xs: T[], wanted?: string) =>
    wanted ? xs.find((x) => x.id === wanted) : undefined;

  const vacancy =
    vacancies.find((v) => v.id === id) ??
    vacancies.find((v) => v.sourceRequisitionId === id);

  const requisition =
    requisitions.find((r) => r.id === id) ??
    byId(requisitions, vacancy?.sourceRequisitionId) ??
    (vacancy
      ? requisitions.find((r) => r.recruitmentId === vacancy.id)
      : undefined);

  const workforceRequest =
    workforceRequests.find((w) => w.id === id) ??
    byId(workforceRequests, requisition?.workforceRequestId) ??
    (requisition
      ? workforceRequests.find((w) => w.requisitionId === requisition.id)
      : undefined);

  const mine = vacancy
    ? candidates.filter((c) => c.requisitionId === vacancy.id)
    : [];
  const order: RecruitmentStageOrder = {
    applicants: 0,
    interview: 1,
    interviewed: 2,
    offer: 3,
    hired: 4,
  };
  const sorted = [...mine].sort((a, b) => order[b.stage] - order[a.stage]);

  const hireIds = new Set(mine.map((c) => `onb-${c.id}`));
  const records = onboarding.filter(
    (r) => hireIds.has(r.id) || r.id === id,
  );

  return {
    row,
    workforceRequest,
    requisition,
    vacancy,
    candidates: sorted,
    onboarding: records,
  };
}

type RecruitmentStageOrder = Record<Candidate["stage"], number>;

/** Per-stage facts for the detail timeline, in stage order. */
export interface StageFact {
  id: HiringStageId;
  step: number;
  label: string;
  /**
   * Where this effort is relative to the stage. `skipped` matters: a hire
   * entered by hand never had a requisition, and rendering that as `done`
   * claims something happened that did not.
   */
  state: "done" | "current" | "skipped" | "upcoming";
  /** One line saying what actually happened here, or what is pending. */
  detail: string;
  /** Who did or owes it. */
  owner?: string;
  /** Deep link into the module that owns the stage. */
  href?: string;
}

export function buildStageFacts(detail: HiringDetail): StageFact[] {
  const { row, workforceRequest, requisition, vacancy, candidates, onboarding } =
    detail;

  const counts = {
    applicants: candidates.filter((c) => c.stage === "applicants").length,
    interviewing: candidates.filter(
      (c) => c.stage === "interview" || c.stage === "interviewed",
    ).length,
    offer: candidates.filter((c) => c.stage === "offer").length,
    hired: candidates.filter((c) => c.stage === "hired").length,
  };

  const facts: Record<HiringStageId, { detail: string; owner?: string; href?: string }> =
    {
      "workforce-planning": {
        detail: workforceRequest
          ? `${workforceRequest.numberOfHires} hire(s) requested for ${workforceRequest.department}`
          : "No workforce request on record",
        owner: workforceRequest?.createdByName,
        href: workforceRequest ? "/talent/workforce-requests" : undefined,
      },
      requisition: {
        detail: requisition
          ? `${requisition.numberOfPositions} position(s) approved`
          : "No requisition raised",
        owner: requisition?.hiringManager || requisition?.reportingManager,
        href: requisition ? "/talent/requisition" : undefined,
      },
      attract: {
        detail: vacancy
          ? `${counts.applicants} applicant(s) awaiting review`
          : "Vacancy not published",
        owner: vacancy?.recruiter ?? vacancy?.hiringManager,
        href: vacancyHref(vacancy?.id, onboarding[0]?.id),
      },
      select: {
        detail:
          counts.interviewing > 0
            ? `${counts.interviewing} candidate(s) in interview`
            : "Nobody in interview",
        owner: vacancy?.hiringManager,
        href: vacancyHref(vacancy?.id, onboarding[0]?.id),
      },
      "pre-employment": {
        detail:
          counts.offer > 0
            ? `${counts.offer} offer(s) out`
            : counts.hired > 0
              ? `${counts.hired} hire(s) accepted`
              : "No offers yet",
        // No dedicated page for this stage — Hire Tracker is where every
        // hiring effort, including this one, is actually tracked.
        href: "/talent/hire-tracker",
      },
      onboard: {
        detail:
          onboarding.length > 0
            ? `${onboarding.length} record(s) onboarding`
            : "Nobody onboarding yet",
        href: onboarding[0]
          ? `/talent/onboarding/${onboarding[0].id}`
          : "/talent/onboarding",
      },
    };

  /**
   * Did this stage actually happen? Position in the list is not evidence - a
   * manually created onboarding record sits at stage 6 having never had a
   * workforce request, a requisition or a vacancy, and marking those "done"
   * because their number is lower is simply untrue.
   */
  const happened: Record<HiringStageId, boolean> = {
    "workforce-planning": Boolean(workforceRequest),
    requisition: Boolean(requisition),
    attract: Boolean(vacancy),
    select: candidates.some(
      (c) => c.stage !== "applicants",
    ),
    "pre-employment": counts.offer + counts.hired > 0 || onboarding.length > 0,
    onboard: onboarding.length > 0,
  };

  return HIRING_STAGES.map((stage) => {
    const state =
      stage.step === row.step
        ? ("current" as const)
        : stage.step > row.step
          ? ("upcoming" as const)
          : happened[stage.id]
            ? ("done" as const)
            : ("skipped" as const);
    const base = facts[stage.id];
    return {
      id: stage.id,
      step: stage.step,
      label: stage.label,
      state,
      ...base,
      // A skipped stage should say it was bypassed, not report an absence as
      // though someone were still waiting on it.
      detail: state === "skipped" ? SKIPPED_DETAIL[stage.id] : base.detail,
      owner: state === "skipped" ? undefined : base.owner,
      href: state === "skipped" ? undefined : base.href,
    };
  });
}

/** What to say when a stage was bypassed entirely. */
const SKIPPED_DETAIL: Record<HiringStageId, string> = {
  "workforce-planning": "No workforce request - this hire started further down",
  requisition: "No requisition raised for this hire",
  attract: "Never advertised",
  select: "No interview pipeline for this hire",
  "pre-employment": "No offer recorded in the system",
  onboard: "Not onboarded through this chain",
};
