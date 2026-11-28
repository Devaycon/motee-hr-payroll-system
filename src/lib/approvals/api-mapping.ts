/**
 * Server approvals (ApprovalDto) in the shape the Submissions screens use
 * (ApprovalRequest), so the approved demo screens can show live data
 * unchanged. Decisions go back out through `approvals-api-listener.ts`.
 */
import type {
  ApprovalDto,
  ApprovalEventDto,
  ApprovalStatus as ApiStatus,
  ApprovalStepDto,
} from "@/src/types/common";
import {
  DOCUMENT_TYPE_LABELS,
  type ApprovalEventType,
  type ApprovalRequest,
  type ApprovalStatus,
  type ApprovalStepInstance,
  type ApproverResolver,
} from "@/src/lib/types/approvals";

interface DirectoryEntry {
  id: string;
  fullName: string;
  departmentName?: string;
  email?: string;
}

const STATUS: Record<ApiStatus, ApprovalStatus> = {
  draft: "draft",
  inProgress: "in_progress",
  approved: "approved",
  rejected: "rejected",
  returned: "returned",
  cancelled: "cancelled",
};

/**
 * The server's document types are free strings (not in the spec). They are
 * matched onto the screen's keys where the meaning is clear; anything else is
 * kept as snake_case and labelled from its words.
 */
const DOCUMENT_ALIASES: Record<string, string> = {
  leave: "leave_request",
  leave_request: "leave_request",
  expense: "expense_claim",
  expense_claim: "expense_claim",
  loan: "loan_request",
  loan_request: "loan_request",
  sickness: "sickness_absence",
  sickness_record: "sickness_absence",
  sickness_absence: "sickness_absence",
  onboarding: "onboarding",
  onboarding_record: "onboarding",
  offboarding: "offboarding_clearance",
  offboarding_clearance: "offboarding_clearance",
  requisition: "job_requisition",
  job_requisition: "job_requisition",
  workforce_request: "workforce_request",
  contract: "contract",
  promotion: "promotion_request",
  promotion_request: "promotion_request",
  training: "training_request",
  training_request: "training_request",
  asset: "asset_request",
  asset_request: "asset_request",
};

const snake = (s: string) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();

export function documentTypeFromApi(type: string): string {
  const key = snake(type);
  return DOCUMENT_ALIASES[key] ?? key;
}

export function documentTypeLabel(type: string): string {
  return (
    DOCUMENT_TYPE_LABELS[type] ??
    type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

/**
 * The server's event types: a fixed lowercase set (backend answer, 27 Nov):
 * submitted, approved, rejected, returned, resubmitted, cancelled, skipped,
 * reresolved; "commented" is queued with the comments endpoint.
 */
const EVENT_TYPES: ApprovalEventType[] = [
  "submitted",
  "approved",
  "rejected",
  "returned",
  "resubmitted",
  "cancelled",
  "skipped",
  "reresolved",
  "commented",
];

function eventTypeFromApi(type: string): ApprovalEventType {
  const t = type.toLowerCase() as ApprovalEventType;
  return EVENT_TYPES.includes(t) ? t : "commented";
}

function approverFromStep(step: ApprovalStepDto): ApproverResolver {
  if (step.resolvedEmployeeId) return `EMP:${step.resolvedEmployeeId}`;
  if (step.approver === "role" && step.resolvedRoleId) return `ROLE:${step.resolvedRoleId}`;
  return step.approver === "departmentHead" ? "DEPARTMENT_HEAD" : "LINE_MANAGER";
}

function stepFromApi(step: ApprovalStepDto): ApprovalStepInstance {
  return {
    id: step.id,
    order: step.sequence,
    templateStepId: step.id,
    label: step.label,
    approver: approverFromStep(step),
    resolvedEmployeeId: step.resolvedEmployeeId ?? null,
    resolvedEmployeeName: step.resolvedName ?? null,
    status: step.status,
    decidedAt: step.decidedAt ?? undefined,
    // A skipped reason is a sentence written for people (not a fixed set), so
    // it is shown as the step's note.
    note: step.note ?? step.skippedReason ?? undefined,
    signatureId: step.signatureUrl ? `SIG-${step.id}` : undefined,
    skippedReason: step.skippedReason ? "manual" : undefined,
    reassignedFromEmployeeId: step.delegation?.fromEmployeeId,
    reassignedFromName: step.delegation?.fromName,
    delegationReason: step.delegation?.reason ?? undefined,
    delegationPeriod: step.delegation
      ? { start: step.delegation.periodStart, end: step.delegation.periodEnd }
      : undefined,
  };
}

/**
 * `history[].actorName` currently holds the actor's email (backend defect,
 * 28 Nov); show the person's name from the directory instead.
 */
function actorFromApi(name: string | null | undefined, byEmail: Map<string, DirectoryEntry>) {
  if (!name) return { name: "System", id: "" };
  const hit = name.includes("@") ? byEmail.get(name.trim().toLowerCase()) : undefined;
  return hit ? { name: hit.fullName, id: hit.id } : { name, id: "" };
}

function eventFromApi(e: ApprovalEventDto, byEmail: Map<string, DirectoryEntry>) {
  const actor = actorFromApi(e.actorName, byEmail);
  return {
    id: e.id,
    at: e.at,
    actorEmployeeId: actor.id,
    actorName: actor.name,
    type: eventTypeFromApi(e.type),
    stepOrder: e.stepOrder ?? undefined,
    note: e.note ?? undefined,
  };
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

export function approvalRequestFromApi(
  dto: ApprovalDto,
  directory: DirectoryEntry[] = [],
): ApprovalRequest {
  const byId = new Map(directory.map((e) => [e.id, e]));
  const byEmail = new Map(
    directory.filter((e) => e.email).map((e) => [e.email!.toLowerCase(), e] as const),
  );
  const steps = [...dto.steps].sort((a, b) => a.sequence - b.sequence).map(stepFromApi);
  const status = STATUS[dto.status] ?? "in_progress";
  const currentIndex = dto.currentStep
    ? steps.findIndex((s) => s.id === dto.currentStep!.id)
    : -1;

  const submitterId = dto.submittedByEmployeeId ?? "";
  const submitterEntry = submitterId ? byId.get(submitterId) : undefined;
  const submitterName = dto.submittedByName ?? submitterEntry?.fullName ?? "Unknown";
  const subject = dto.subjectEmployeeId ? byId.get(dto.subjectEmployeeId) : undefined;
  const documentType = documentTypeFromApi(dto.documentType);
  const label = documentTypeLabel(documentType);

  // A request raised through POST /approvals carries its form; the answers
  // are shown under the form's own labels, in the form's order.
  const labels = new Map((dto.fieldSchema ?? []).map((f) => [f.key, f.label] as const));
  const answers: Record<string, unknown> = {};
  for (const f of dto.fieldSchema ?? []) {
    const v = dto.fields?.[f.key];
    if (v != null && v !== "") answers[f.label] = v;
  }
  for (const [k, v] of Object.entries(dto.fields ?? {})) {
    if (!labels.has(k) && v !== "") answers[k] = v;
  }

  const snapshot: Record<string, unknown> = {
    ...answers,
    "Raised by": submitterName,
    ...(subject && subject.id !== submitterId ? { Employee: subject.fullName } : {}),
    Round: dto.round,
    ...(dto.isBlocked && dto.blockedReason ? { Blocked: dto.blockedReason } : {}),
  };

  return {
    id: dto.id,
    documentType,
    documentId: dto.subjectId,
    documentTitle:
      dto.title || (subject ? `${label} — ${subject.fullName}` : label),
    documentSummary:
      dto.isBlocked && dto.blockedReason
        ? dto.blockedReason
        : dto.summary || `${label} raised by ${submitterName}`,
    payloadSnapshot: snapshot,
    submittedBy: {
      employeeId: submitterId,
      name: submitterName,
      initials: initialsOf(submitterName),
      departmentName: submitterEntry?.departmentName ?? "",
    },
    submittedAt: dto.submittedAt ?? dto.history[0]?.at ?? new Date(0).toISOString(),
    // The server holds the chain; no local template applies.
    chainTemplateId: "",
    currentStepIndex:
      currentIndex >= 0 ? currentIndex : status === "in_progress" ? 0 : steps.length,
    status,
    steps,
    history: dto.history.map((e) => eventFromApi(e, byEmail)),
    attachments: dto.attachments.map((a) => ({
      id: a.id,
      name: a.fileName,
      mimeType: a.contentType,
      sizeBytes: a.sizeBytes,
      dataUrl: a.url ?? "",
      uploadedAt: a.uploadedAt,
      uploadedByEmployeeId: "",
    })),
    // Approvers who signed their decision.
    signatures: dto.steps
      .filter((st) => st.signatureUrl)
      .map((st) => ({
        id: `SIG-${st.id}`,
        signerEmployeeId: st.resolvedEmployeeId ?? "",
        signerName: st.resolvedName ?? st.label,
        dataUrl: st.signatureUrl!,
        placement: null,
        signedAt: st.decidedAt ?? dto.decidedAt ?? "",
        role: "reviewer" as const,
        stepId: st.id,
      })),
    serverActions: dto.availableActions,
  };
}
