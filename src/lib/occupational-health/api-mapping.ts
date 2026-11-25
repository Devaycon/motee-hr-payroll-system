import type {
  AdjustmentDto,
  AdjustmentRequest,
  OhCaseDto,
  OhFitness,
  OhHistoryDto,
  OhReferralRequest,
  OhStage,
} from "@/src/types/occupational-health";
import type {
  AdjustmentRecord,
  OHFitnessStatus,
  OHReferral,
  OHStatus,
} from "@/src/lib/types/occupational-health";
import { initials } from "@/src/lib/helpdesk/api-mapping";

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export const stageFromApi = (s: OhStage) => snake(s) as OHStatus;
export const stageToApi = (s: OHStatus) => camel(s) as OhStage;
export const fitnessFromApi = (f: OhFitness) => snake(f) as OHFitnessStatus;
export const fitnessToApi = (f: OHFitnessStatus) => camel(f) as OhFitness;

const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : undefined);

export function adjustmentFromApi(a: AdjustmentDto): AdjustmentRecord {
  return {
    id: a.id,
    linkedSicknessId: a.sicknessRecordId ?? undefined,
    description: a.description,
    dateRecommended: day(a.recommendedOn) ?? "",
    agreedBy: a.agreedByName ?? undefined,
    implementationOwner: a.implementationOwnerName ?? undefined,
    effectiveDate: day(a.effectiveDate),
    reviewDate: day(a.reviewDate),
    status: a.stage,
  };
}

type IdOf = (name: string | null | undefined) => string | undefined;

export function adjustmentToRequest(a: AdjustmentRecord, idOf: IdOf): AdjustmentRequest {
  return {
    description: a.description,
    recommendedOn: a.dateRecommended || null,
    sicknessRecordId: a.linkedSicknessId ?? null,
    agreedByEmployeeId: idOf(a.agreedBy) ?? null,
    implementationOwnerEmployeeId: idOf(a.implementationOwner) ?? null,
    effectiveDate: a.effectiveDate || null,
    reviewDate: a.reviewDate || null,
  };
}

export function ohCaseFromApi(dto: OhCaseDto, history: OhHistoryDto[] = []): OHReferral {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
    employeeInitials: dto.initials ?? initials(dto.employeeName),
    department: dto.department ?? "",
    absenceStartDate: day(dto.absenceStartDate) ?? "",
    referralDate: day(dto.referralDate),
    assessmentDate: day(dto.assessmentDate),
    status: stageFromApi(dto.stage),
    fitnessStatus: fitnessFromApi(dto.fitness),
    adjustments: dto.adjustments.map(adjustmentFromApi),
    equalityActConsidered: dto.reasonableAdjustmentsConsidered,
    expectedReturnDate: day(dto.expectedReturnDate),
    caseNotes: dto.caseNotes ?? undefined,
    caseOwner: dto.caseOwnerName ?? "",
    nextAction: dto.nextAction
      ? { label: dto.nextAction.label, owner: dto.nextAction.owner, due: day(dto.nextAction.due) ?? "" }
      : undefined,
    reviewDate: day(dto.reviewDate),
    history: history.map((h, i) => ({
      id: `${dto.id}-h${i}`,
      at: h.at,
      actorName: h.actorName ?? "System",
      note: h.note,
    })),
  };
}

export function ohCaseToRequest(
  r: OHReferral,
  idOf: IdOf,
  sicknessRecordId?: string | null,
): OhReferralRequest {
  return {
    employeeId: r.employeeId,
    sicknessRecordId: sicknessRecordId ?? null,
    absenceStartDate: r.absenceStartDate || null,
    referralDate: r.referralDate || null,
    assessmentDate: r.assessmentDate || null,
    fitness: fitnessToApi(r.fitnessStatus),
    reasonableAdjustmentsConsidered: r.equalityActConsidered,
    expectedReturnDate: r.expectedReturnDate || null,
    caseNotes: r.caseNotes || null,
    caseOwnerEmployeeId: idOf(r.caseOwner) ?? null,
    reviewDate: r.reviewDate || null,
  };
}
