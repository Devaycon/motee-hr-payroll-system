import type {
  HiringReasonKind,
  VacancyType,
  WorkforceRequest,
} from "@/src/lib/stores/workforce-requests-slice";
import type {
  HiringReason as ApiHiringReason,
  VacancyType as ApiVacancyType,
  WorkforceRequestDto,
  WorkforceRequestRequest,
} from "@/src/types/workforce-requests";

const REASON_FROM_API: Record<ApiHiringReason, HiringReasonKind> = {
  newPosition: "new_position",
  replacement: "replacement",
  internalTransfer: "internal_transfer",
  seasonal: "seasonal",
};

const VACANCY_FROM_API: Record<ApiVacancyType, VacancyType> = {
  permanent: "permanent",
  fixedTerm: "fixed_term",
  contract: "contract",
  temporary: "temporary",
  apprentice: "apprentice",
  graduate: "graduate",
};

const invert = <K extends string, V extends string>(m: Record<K, V>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<V, K>;

const REASON_TO_API = invert(REASON_FROM_API);
const VACANCY_TO_API = invert(VACANCY_FROM_API);

export function workforceRequestFromApi(dto: WorkforceRequestDto): WorkforceRequest {
  return {
    id: dto.id,
    department: dto.departmentName ?? "—",
    numberOfHires: dto.numberOfHires,
    reason: dto.justification,
    budgetEstimate: dto.budgetEstimate ?? 0,
    urgency: dto.urgency,
    expectedStartDate: dto.expectedStartDate ?? "",
    status: dto.status === "converted" ? "converted" : "draft",
    approvalRequestId: dto.approvalInstanceId ?? undefined,
    requisitionId: dto.requisitionId ?? undefined,
    createdById: dto.requestedByEmployeeId ?? "",
    createdByName: dto.requestedByName ?? "—",
    createdAt: dto.createdAt.slice(0, 10),
    position: dto.position,
    grade: dto.grade ?? undefined,
    hiringReason: REASON_FROM_API[dto.hiringReason],
    vacancyType: VACANCY_FROM_API[dto.vacancyType],
    costCentreCode: dto.costCentreCode ?? undefined,
    serverStatus: dto.status,
    reference: dto.reference ?? undefined,
    waitingOn: dto.waitingOn ?? undefined,
  };
}

export interface WorkforceRequestForm {
  department: string;
  numberOfHires: number;
  reason: string;
  budgetEstimate: number;
  urgency: WorkforceRequest["urgency"];
  expectedStartDate: string;
  position: string;
  grade: string;
  hiringReason: HiringReasonKind;
  vacancyType: VacancyType;
  costCentreCode: string;
  businessUnit: string;
}

export function workforceRequestToApi(
  form: WorkforceRequestForm,
  ids: { departmentId?: string | null; businessUnitId?: string | null; currency?: string },
): WorkforceRequestRequest {
  return {
    departmentId: ids.departmentId ?? null,
    businessUnitId: ids.businessUnitId ?? null,
    // The approved form makes the position optional; the API does not.
    position: form.position.trim() || `${form.department} hire`,
    grade: form.grade.trim() || null,
    numberOfHires: form.numberOfHires,
    hiringReason: REASON_TO_API[form.hiringReason] ?? "newPosition",
    vacancyType: VACANCY_TO_API[form.vacancyType] ?? "permanent",
    urgency: form.urgency,
    justification: form.reason.trim(),
    budgetEstimate: form.budgetEstimate || null,
    currency: ids.currency ?? null,
    costCentreCode: form.costCentreCode || null,
    expectedStartDate: form.expectedStartDate || null,
  };
}
