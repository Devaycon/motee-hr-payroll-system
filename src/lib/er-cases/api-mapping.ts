import type {
  CaseActivityDto,
  CaseComplaintType as ApiComplaint,
  CaseDto,
  CaseMeetingKind as ApiMeetingKind,
  CaseOutcome as ApiOutcome,
  CaseRequest,
  CaseRowDto,
  CaseStage as ApiStage,
  ConfidentialityLevel as ApiConfidentiality,
  MeetingRequest,
  NoteVisibility as ApiVisibility,
} from "@/src/types/er-cases";
import type {
  CaseComplaintType,
  CaseMeeting,
  CaseMeetingKind,
  CaseOutcome,
  CaseStage,
  ConfidentialityLevel,
  ERCase,
  NoteVisibility,
} from "@/src/lib/types/grievance";
import { initials } from "@/src/lib/helpdesk/api-mapping";

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export const complaintFromApi = (t: ApiComplaint) => snake(t) as CaseComplaintType;
export const complaintToApi = (t: CaseComplaintType) => camel(t) as ApiComplaint;
export const stageFromApi = (s: ApiStage) => snake(s) as CaseStage;
export const stageToApi = (s: CaseStage) => camel(s) as ApiStage;
export const confidentialityFromApi = (c: ApiConfidentiality) => snake(c) as ConfidentialityLevel;
export const confidentialityToApi = (c: ConfidentialityLevel) => camel(c) as ApiConfidentiality;
export const outcomeFromApi = (o: ApiOutcome) => snake(o) as CaseOutcome;
export const meetingKindFromApi = (k: ApiMeetingKind) => snake(k) as CaseMeetingKind;
export const meetingKindToApi = (k: CaseMeetingKind) => camel(k) as ApiMeetingKind;
export const visibilityFromApi = (v: ApiVisibility) => snake(v) as NoteVisibility;
export const visibilityToApi = (v: NoteVisibility) => camel(v) as ApiVisibility;

const OUTCOMES = new Set<string>([
  "verbal_warning", "written_warning", "final_written_warning", "suspension", "demotion",
  "termination", "no_action", "upheld", "partially_upheld", "not_upheld", "resolved",
  "no_case_to_answer", "informal_resolution", "mediation", "training_required", "policy_update",
]);

const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : undefined);

/** A case from the register (row only: notes, meetings and evidence come with the detail). */
export function caseFromRow(row: CaseRowDto): ERCase {
  const subject = row.subjectName ?? row.raisedByName ?? "Employee";
  return {
    id: row.id,
    caseNumber: row.caseNumber,
    complaintType: complaintFromApi(row.complaintType),
    employeeName: subject,
    employeeInitials: initials(subject),
    employeeDept: row.subjectDepartmentName ?? "",
    employeeId: row.subjectEmployeeId ?? undefined,
    dateRaised: day(row.raisedOn) ?? "",
    incidentDate: day(row.incidentOn),
    description: "",
    stage: stageFromApi(row.stage),
    priority: row.priority,
    confidentialityLevel: confidentialityFromApi(row.confidentialityLevel),
    assignedTo: row.investigatorName ?? undefined,
    assignedInitials: row.investigatorName ? initials(row.investigatorName) : undefined,
    assignedToId: row.investigatorEmployeeId ?? undefined,
    caseOwner: row.caseOwnerName ?? undefined,
    targetResolutionDate: day(row.targetResolutionOn),
    witnesses: [],
    evidence: [],
    hearingPanel: [],
    outcome: row.outcome ? outcomeFromApi(row.outcome) : undefined,
    outcomeDate: day(row.outcomeOn),
    hasAppeal: row.hasAppeal,
    closureDate: day(row.closedOn),
    notes: [],
    meetings: [],
    activity: [],
    createdAt: day(row.raisedOn) ?? "",
    updatedAt: day(row.updatedAt) ?? "",
  };
}

/** A case with everything the detail page shows. */
export function caseFromApi(dto: CaseDto, activity: CaseActivityDto[] = []): ERCase {
  const base = caseFromRow(dto.case);
  return {
    ...base,
    description: dto.description,
    investigationDueDate: day(dto.investigationDueOn),
    outcomeDueDate: day(dto.outcomeDueOn),
    witnesses: dto.witnesses.map((w) => ({ name: w.name, statement: w.statement ?? undefined })),
    hearingDate: day(dto.hearingOn),
    hearingPanelIds: dto.hearingPanel.map((p) => p.employeeId),
    hearingPanel: dto.hearingPanel.map((p) => p.name ?? p.employeeId),
    suspensionDays: dto.suspensionDays ?? undefined,
    appealReviewer: dto.appealReviewerName ?? undefined,
    appealReviewerId: dto.appealReviewerEmployeeId ?? undefined,
    appealGrounds: dto.appealGrounds ?? undefined,
    retentionPeriod: dto.retentionPeriod ?? undefined,
    evidence: dto.evidence.map((e) => ({ name: e.name || e.fileName, url: `evidence:${e.id}`, uploadedAt: day(e.uploadedAt) ?? "" })),
    notes: dto.notes.map((n) => {
      const author = n.authorName ?? "HR";
      const visibility = visibilityFromApi(n.visibility);
      return {
        id: n.id,
        authorName: author,
        authorInitials: initials(author),
        content: n.content,
        createdAt: day(n.createdAt) ?? "",
        visibility,
        isInternal: visibility !== "employee_visible",
      };
    }),
    meetings: dto.meetings.map((m) => ({
      id: m.id,
      kind: meetingKindFromApi(m.meetingKind),
      date: day(m.heldOn) ?? "",
      time: m.heldAt ?? undefined,
      attendees: m.attendees,
      notes: m.notes ?? undefined,
      outcome: m.meetingOutcome ?? undefined,
      createdAt: m.createdAt,
    })),
    activity: activity.map((a, i) => ({
      id: `${dto.case.id}-a${i}`,
      at: a.at,
      actorName: a.actorName ?? "System",
      action: a.action,
      detail: a.detail ?? undefined,
    })),
  };
}

type IdOf = (name: string | null | undefined) => string | undefined;

/** The editable fields of a case. Names picked from the directory resolve to ids. */
export function caseToRequest(c: ERCase, idOf: IdOf): CaseRequest {
  const outcome = c.outcome && OUTCOMES.has(c.outcome) ? (camel(c.outcome) as ApiOutcome) : undefined;
  return {
    complaintType: complaintToApi(c.complaintType),
    subjectEmployeeId: c.employeeId ?? idOf(c.employeeName) ?? null,
    incidentOn: c.incidentDate || null,
    description: c.description,
    priority: c.priority,
    confidentialityLevel: confidentialityToApi(c.confidentialityLevel),
    investigatorEmployeeId: c.assignedToId ?? idOf(c.assignedTo) ?? null,
    caseOwnerEmployeeId: idOf(c.caseOwner) ?? null,
    targetResolutionOn: c.targetResolutionDate || null,
    investigationDueOn: c.investigationDueDate || null,
    outcomeDueOn: c.outcomeDueDate || null,
    witnesses: c.witnesses.map((w) => ({ name: w.name, statement: w.statement ?? null })),
    hearingOn: c.hearingDate || null,
    hearingPanelEmployeeIds:
      c.hearingPanelIds ?? c.hearingPanel.map((n) => idOf(n)).filter((x): x is string => !!x),
    ...(outcome ? { outcome } : {}),
    outcomeOn: c.outcomeDate || null,
    suspensionDays: c.suspensionDays ?? null,
    appealReviewerEmployeeId: c.appealReviewerId ?? idOf(c.appealReviewer) ?? null,
    appealGrounds: c.appealGrounds || null,
    retentionPeriod: c.retentionPeriod || null,
  };
}

export function meetingToRequest(m: CaseMeeting): MeetingRequest {
  return {
    meetingKind: meetingKindToApi(m.kind),
    heldOn: m.date,
    heldAt: m.time || null,
    attendees: m.attendees,
    notes: m.notes || null,
    meetingOutcome: m.outcome || null,
  };
}
