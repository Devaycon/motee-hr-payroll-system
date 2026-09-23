/**
 * Giving every vacancy the records that should sit behind it.
 *
 * The three hiring modules seed themselves independently and lazily, from
 * unrelated demo files, so a seeded vacancy had no requisition behind it and
 * no workforce request behind that. The tracker then had to render four of the
 * six stages as "skipped", which is accurate but useless: it made every demo
 * recruitment look like it had bypassed the process.
 *
 * This back-fills the ancestors from the vacancy itself. It is additive - a
 * vacancy that already names a source requisition is left alone, and the
 * hand-written approval-chain demos keep their own records.
 */
import type { Candidate, JobRequisition } from "@/src/lib/types/recruitment";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";
import type { Requisition } from "@/src/lib/stores/requisitions-slice";
import type {
  WorkforceRequest,
  WorkforceUrgency,
} from "@/src/lib/stores/workforce-requests-slice";

export interface HiringChainSeed {
  workforceRequests: WorkforceRequest[];
  requisitions: Requisition[];
  /** Vacancies patched to point at the requisition minted for them. */
  vacancies: JobRequisition[];
}

/** Ids are derived from the vacancy so a reseed produces the same chain. */
export function requisitionIdFor(vacancyId: string): string {
  return `REQ-FOR-${vacancyId}`;
}

export function workforceRequestIdFor(vacancyId: string): string {
  return `WFR-FOR-${vacancyId}`;
}

/** Days before the target start date that each ancestor was raised. */
const REQUISITION_LEAD_DAYS = 14;
const WORKFORCE_LEAD_DAYS = 28;

function shiftDate(iso: string | undefined, days: number): string {
  const base = new Date(`${iso ?? ""}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return iso ?? new Date().toISOString().slice(0, 10);
  base.setUTCDate(base.getUTCDate() - days);
  return base.toISOString().slice(0, 10);
}

function urgencyFor(vacancy: JobRequisition): WorkforceUrgency {
  switch (vacancy.hiringPriority) {
    case "urgent":
      return "critical";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "medium";
  }
}

/**
 * A rough budget when the vacancy carries no figure of its own: the top of the
 * band times the number of openings. Better than zero, and clearly derived.
 */
function budgetFor(vacancy: JobRequisition): number {
  const top = vacancy.salaryMax || vacancy.salaryMin || 0;
  return top * Math.max(1, vacancy.openings);
}

export function buildHiringChain(vacancies: JobRequisition[]): HiringChainSeed {
  const workforceRequests: WorkforceRequest[] = [];
  const requisitions: Requisition[] = [];
  const patched: JobRequisition[] = [];

  for (const vacancy of vacancies) {
    // Part of a real chain - leave it exactly as it is. A vacancy already
    // pointing at *its own derived* id is one we minted earlier, and must be
    // rebuilt rather than skipped: this runs once to patch the vacancies and
    // again to put the ancestors into their own modules, and both passes have
    // to produce the same records.
    const derivedId = requisitionIdFor(vacancy.id);
    if (vacancy.sourceRequisitionId && vacancy.sourceRequisitionId !== derivedId) {
      patched.push(vacancy);
      continue;
    }

    const reqId = derivedId;
    const wfrId = workforceRequestIdFor(vacancy.id);
    const owner = vacancy.hiringManager || "HR Admin";
    const budget = budgetFor(vacancy);
    const requestedAt = shiftDate(vacancy.createdAt, WORKFORCE_LEAD_DAYS);
    const requisitionedAt = shiftDate(vacancy.createdAt, REQUISITION_LEAD_DAYS);

    workforceRequests.push({
      id: wfrId,
      department: vacancy.department,
      numberOfHires: vacancy.openings,
      reason: `Headcount approved for ${vacancy.positionTitle}.`,
      budgetEstimate: budget,
      urgency: urgencyFor(vacancy),
      expectedStartDate: vacancy.targetStartDate,
      // Converted: it became the requisition below, which became the vacancy.
      status: "converted",
      requisitionId: reqId,
      createdById: vacancy.hiringManagerId ?? "system",
      createdByName: owner,
      createdAt: requestedAt,
      position: vacancy.positionTitle,
      hiringReason: "new_position",
    });

    requisitions.push({
      id: reqId,
      workforceRequestId: wfrId,
      workforceLabel: `${vacancy.department} — ${vacancy.openings} hire(s)`,
      title: vacancy.positionTitle,
      jobDescription: vacancy.jobDescription,
      department: vacancy.department,
      location: vacancy.location,
      numberOfPositions: vacancy.openings,
      salaryMin: vacancy.salaryMin,
      salaryMax: vacancy.salaryMax,
      salaryCurrency: vacancy.advert?.salaryCurrency,
      qualifications: vacancy.qualifications ?? "",
      startDate: vacancy.targetStartDate,
      reportingManager: owner,
      budgetAllocation: budget,
      hiringManager: vacancy.hiringManager,
      recruiter: vacancy.recruiter,
      hrBusinessPartner: vacancy.hrBusinessPartner,
      interviewPanel: vacancy.interviewPanelNames,
      status: "converted",
      lifecycleStatus: "active",
      recruitmentId: vacancy.id,
      createdById: vacancy.hiringManagerId ?? "system",
      createdByName: owner,
      createdAt: requisitionedAt,
    });

    patched.push({ ...vacancy, sourceRequisitionId: reqId, workforceRequestId: wfrId });
  }

  return { workforceRequests, requisitions, vacancies: patched };
}

/**
 * The same idea, run backwards from an onboarding record.
 *
 * Some hires exist only as an onboarding record: the demo fixtures are keyed
 * `onb-001` rather than `onb-<candidateId>`, and three of them claim
 * `mode: "invited"` - that they came from recruitment - while linking to no
 * candidate at all. Rather than render four stages as "Skipped", this gives
 * them the provenance they claim: the vacancy they were hired into and the
 * candidate record they were hired as.
 *
 * The vacancy and candidate are returned for the tracker to read, NOT
 * dispatched into the recruitment slice. A hire typed straight into Onboarding
 * should not make a vacancy appear in Recruitment that nobody ever advertised.
 */
export interface OnboardingChainSeed extends HiringChainSeed {
  candidates: Candidate[];
}

/**
 * The id namespace for vacancies minted from an onboarding record.
 *
 * These exist only inside the Hire Tracker's own source set - they are never
 * dispatched into the recruitment slice, because Recruitment should not gain a
 * vacancy nobody advertised. Anything that builds a link therefore has to be
 * able to ask whether a vacancy is real, and this module owns both halves of
 * that question so the prefix is never guessed at from the outside.
 */
const SYNTHETIC_VACANCY_PREFIX = "REC-FOR-";

export function syntheticVacancyIdFor(recordId: string): string {
  return `${SYNTHETIC_VACANCY_PREFIX}${recordId}`;
}

/** True when this vacancy is a back-fill and has no page of its own. */
export function isSyntheticVacancyId(id: string | undefined): boolean {
  return Boolean(id?.startsWith(SYNTHETIC_VACANCY_PREFIX));
}

/** Candidate ids mirror the record key, so `onb-<id>` links the two back up. */
export function candidateIdForRecord(recordId: string): string {
  return recordId.startsWith("onb-") ? recordId.slice(4) : recordId;
}

export function buildChainForOnboarding(
  records: OnboardingRecord[],
  linkedCandidateIds: Set<string>,
): OnboardingChainSeed {
  const vacancies: JobRequisition[] = [];
  const candidates: Candidate[] = [];

  for (const record of records) {
    const candidateId = candidateIdForRecord(record.id);
    // Already came through a real pipeline.
    if (linkedCandidateIds.has(candidateId)) continue;

    const vacancyId = syntheticVacancyIdFor(record.id);
    const hiredAt = shiftDate(record.startDate, 7);

    vacancies.push({
      id: vacancyId,
      positionTitle: record.jobTitle,
      department: record.department,
      hiringManager: record.joinerData?.manager ?? "HR Admin",
      employmentType: "full_time",
      // One opening, filled by the person this record is about.
      status: "filled",
      hiringPriority: "medium",
      location: "—",
      openings: 1,
      salaryMin: Number(record.joinerData?.salary) || 0,
      salaryMax: Number(record.joinerData?.salary) || 0,
      jobDescription: `${record.jobTitle} in ${record.department}.`,
      requiredSkills: [],
      targetStartDate: record.startDate,
      createdAt: shiftDate(record.startDate, 30),
    } as JobRequisition);

    candidates.push({
      id: candidateId,
      requisitionId: vacancyId,
      requisitionTitle: record.jobTitle,
      name: record.employeeName,
      initials: record.employeeInitials,
      email: record.email ?? "",
      source: "careers_page",
      stage: "hired",
      status: "active",
      appliedAt: shiftDate(record.startDate, 45),
      updatedAt: hiredAt,
      skills: [],
      scorecards: [],
      communications: [],
      // An accepted offer is what makes `hired` legitimate; without it the
      // pipeline's own gate would say this candidate could not be here.
      offers: [
        {
          id: `OFF-${candidateId}`,
          at: hiredAt,
          status: "accepted",
          startDate: record.startDate,
          respondedAt: hiredAt,
        },
      ],
      attachments: [],
      score: null,
      onboardingInvitedAt: record.initiatedAt,
    } as Candidate);
  }

  const chain = buildHiringChain(vacancies);
  return { ...chain, candidates };
}

/**
 * A workforce request for any requisition whose own link does not resolve.
 *
 * The requisition demo points at `WFR-DEMO-5` / `WFR-DEMO-6`, which only exist
 * once the Workforce Requests page has seeded itself. Until then the link
 * dangles and stage 1 has nothing behind it, so the timeline would call the
 * stage skipped when really it is just not loaded.
 */
export function backfillWorkforceRequests(
  requisitions: Requisition[],
  existing: WorkforceRequest[],
): WorkforceRequest[] {
  const known = new Set(existing.map((w) => w.id));
  const out: WorkforceRequest[] = [];
  const seen = new Set<string>();

  for (const requisition of requisitions) {
    const wfrId = requisition.workforceRequestId;
    if (!wfrId || known.has(wfrId) || seen.has(wfrId)) continue;
    seen.add(wfrId);
    out.push({
      id: wfrId,
      department: requisition.department,
      numberOfHires: requisition.numberOfPositions,
      reason: `Headcount approved for ${requisition.title}.`,
      budgetEstimate: requisition.budgetAllocation,
      urgency: "medium",
      expectedStartDate: requisition.startDate,
      status: "converted",
      requisitionId: requisition.id,
      createdById: requisition.createdById,
      createdByName: requisition.createdByName,
      createdAt: shiftDate(requisition.createdAt, WORKFORCE_LEAD_DAYS),
      position: requisition.title,
      hiringReason: "new_position",
    });
  }
  return out;
}
