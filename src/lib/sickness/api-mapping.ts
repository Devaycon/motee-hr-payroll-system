import type { SicknessReasonCategory } from "@/src/lib/constants/sickness";
import { getInitials } from "@/src/lib/types/dashboard";
import type {
  BradfordAction,
  FitNoteStatus,
  ProtectedCategory,
  RtwStatus,
  SicknessApprovalStatus,
  SicknessDocumentKind,
  SicknessKind,
  SicknessRecord,
  SicknessSource,
} from "@/src/lib/types/sickness";
import type {
  BradfordAction as ApiBradfordAction,
  FitNoteStatus as ApiFitNoteStatus,
  ProtectedCategory as ApiProtectedCategory,
  RtwStatus as ApiRtwStatus,
  SicknessApprovalStatus as ApiApprovalStatus,
  SicknessDocumentKind as ApiDocumentKind,
  SicknessKind as ApiKind,
  SicknessReason,
  SicknessRecordDto,
  SicknessRequest,
  SicknessSource as ApiSource,
} from "@/src/types/sickness";

/** Two-way lookup between the screens' codes and the API's camelCase ones. */
function pair<U extends string, A extends string>(m: Record<U, A>) {
  const back = Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k])) as Record<A, U>;
  return { toApi: (u: U) => m[u], fromApi: (a: A) => back[a] };
}

export const reason = pair<SicknessReasonCategory, SicknessReason>({
  "Cold / Flu": "coldOrFlu",
  Migraine: "migraine",
  Musculoskeletal: "musculoskeletal",
  "Mental Health": "mentalHealth",
  "Medical Appointment": "medicalAppointment",
  "Surgery Recovery": "surgeryRecovery",
  Other: "other",
});

export const kind = pair<SicknessKind, ApiKind>({
  sickness: "sickness",
  medical_procedure: "medicalProcedure",
});

export const source = pair<SicknessSource, ApiSource>({
  self: "self",
  manager: "manager",
  hr: "hr",
  time_attendance: "timeAndAttendance",
});

export const fitNote = pair<FitNoteStatus, ApiFitNoteStatus>({
  not_required: "notRequired",
  self_certified: "selfCertified",
  awaiting: "awaiting",
  received: "received",
  expired: "expired",
});

export const documentKind = pair<SicknessDocumentKind, ApiDocumentKind>({
  fit_note: "fitNote",
  self_certificate: "selfCertificate",
  hospital_letter: "hospitalLetter",
  other: "other",
});

export const protectedCategory = pair<ProtectedCategory, ApiProtectedCategory>({
  disability: "disability",
  pregnancy: "pregnancy",
  industrial_injury: "industrialInjury",
  adjustment_related: "adjustmentRelated",
  other: "other",
});

export const bradfordAction = pair<BradfordAction, ApiBradfordAction>({
  monitor: "monitor",
  manager_review: "managerReview",
  formal_review: "formalReview",
  senior_hr_review: "seniorHrReview",
});

const rtwStatus = pair<RtwStatus, ApiRtwStatus>({
  not_due: "notDue",
  pending: "pending",
  completed: "completed",
});

const approval = pair<Exclude<SicknessApprovalStatus, "draft">, ApiApprovalStatus>({
  awaiting_approval: "awaitingApproval",
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Server records carry UUIDs; records made on this device do not. */
export const isServerId = (id: string) => UUID.test(id);

export function sicknessRecordFromApi(
  dto: SicknessRecordDto,
  ctx: { tenantId: string; branchId?: string; initials?: string },
): SicknessRecord {
  const rtw = dto.returnToWork;
  return {
    id: dto.id,
    tenantId: ctx.tenantId,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
    employeeInitials: ctx.initials ?? getInitials(dto.employeeName),
    department: dto.departmentName ?? "—",
    branchId: ctx.branchId,
    managerId: dto.managerId ?? null,
    kind: kind.fromApi(dto.kind) ?? "sickness",
    startDate: dto.startDate,
    startPortion: dto.startPortion,
    leftWorkAt: dto.leftWorkAt ?? undefined,
    endDate: dto.endDate ?? null,
    endPortion: dto.endPortion,
    overnightShift: dto.overnightShift,
    expectedReturnDate: dto.expectedReturnDate ?? undefined,
    reasonCategory: (dto.reason && reason.fromApi(dto.reason)) || "Other",
    // Withheld by the server for viewers without medical access.
    reasonDetail: dto.medicalDetailWithheld ? undefined : (dto.reasonDetail ?? undefined),
    notifiedAt: dto.notifiedAt,
    hospitalised: dto.hospitalised,
    source: source.fromApi(dto.source) ?? "hr",
    reportedBy: { name: dto.reportedByName ?? "—" },
    reportedAt: dto.reportedAt,
    approvalStatus: approval.fromApi(dto.approvalStatus) ?? "awaiting_approval",
    absenceState: dto.absenceState,
    fitNoteStatus: fitNote.fromApi(dto.fitNoteStatus) ?? "not_required",
    documents: dto.documents.map((d) => ({
      id: d.id,
      kind: documentKind.fromApi(d.kind) ?? "other",
      name: d.name,
      validFrom: d.validFrom ?? undefined,
      validTo: d.validTo ?? undefined,
      uploadedAt: d.uploadedAt,
      uploadedBy: "—",
      fileId: d.fileId ?? undefined,
    })),
    exclusion: dto.exclusionCategory
      ? {
          category: protectedCategory.fromApi(dto.exclusionCategory) ?? "other",
          reason: dto.exclusionReason ?? "",
          approvedBy: "HR",
          approvedAt: dto.updatedAt,
        }
      : undefined,
    rtw: {
      status: rtwStatus.fromApi(rtw.status) ?? "not_due",
      returnDate: rtw.returnDate ?? undefined,
      lastSickDay: rtw.lastSickDay ?? undefined,
      interviewRequired: rtw.interviewRequired,
      interviewHeld: rtw.interviewHeld,
      interviewDate: rtw.interviewDate ?? undefined,
      interviewer: rtw.interviewerName ?? undefined,
      safeToReturn: rtw.safeToReturn,
      notes: rtw.notes ?? undefined,
      adjustmentsRecommended: rtw.adjustmentsRecommended,
      ohReferralRecommended: rtw.ohReferralRecommended,
      completedAt: rtw.completedAt ?? undefined,
    },
    createdAt: dto.reportedAt,
    updatedAt: dto.updatedAt,
  };
}

export function sicknessRecordToApi(record: SicknessRecord): SicknessRequest {
  return {
    employeeId: record.employeeId,
    kind: kind.toApi(record.kind),
    startDate: record.startDate,
    startPortion: record.startPortion,
    leftWorkAt: record.leftWorkAt ?? null,
    endDate: record.endDate ?? null,
    endPortion: record.endPortion,
    overnightShift: !!record.overnightShift,
    expectedReturnDate: record.expectedReturnDate ?? null,
    reason: reason.toApi(record.reasonCategory) ?? "other",
    reasonDetail: record.reasonDetail ?? null,
    hospitalised: record.hospitalised,
    notifiedAt: record.notifiedAt || null,
    source: source.toApi(record.source),
    // Only a server record can be linked to; a local draft id cannot.
    linkedRecordId:
      record.linkedRecordId && isServerId(record.linkedRecordId)
        ? record.linkedRecordId
        : null,
  };
}

/** A data URL as an uploadable file, so a document picked on a form reaches the server. */
export function fileFromDataUrl(dataUrl: string, name: string): File | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl);
  if (!match) return null;
  const [, type, base64, payload] = match;
  const text = base64 ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return new File([bytes], name, { type: type || "application/octet-stream" });
}
