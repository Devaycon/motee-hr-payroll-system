import type {
  WorkflowCondition,
  WorkflowDto,
  WorkflowRequest,
  WorkflowTriggerEvent as ApiTrigger,
} from "@/src/types/workflows";
import type {
  RunDto,
  RunSubjectKind as ApiSubjectKind,
  RunTaskStatus,
} from "@/src/types/workflow-runs";
import type {
  Workflow,
  WorkflowConditionKey,
  WorkflowSchedule,
  WorkflowTask,
  WorkflowTaskStatus,
  WorkflowTriggerEvent,
} from "@/src/lib/types/workflows";
import type { RunSubjectKind, RunTask, WorkflowRun } from "@/src/lib/types/workflow-runs";

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : undefined);

export const triggerFromApi = (t: ApiTrigger) => snake(t) as WorkflowTriggerEvent;
export const triggerToApi = (t: WorkflowTriggerEvent) => camel(t) as ApiTrigger;
export const conditionFromApi = (c: WorkflowCondition) => snake(c) as WorkflowConditionKey;
export const conditionToApi = (c: WorkflowConditionKey) => camel(c) as WorkflowCondition;

export function workflowFromApi(dto: WorkflowDto): Workflow {
  const w = dto.workflow;
  const tasks = [...dto.tasks].sort((a, b) => a.sequence - b.sequence);
  let schedule: WorkflowSchedule | null = null;
  if (w.triggerMode === "automatic") {
    schedule =
      w.scheduleKind === "fixed"
        ? { kind: "fixed", date: day(w.scheduleOn) ?? "", time: (w.scheduleAt ?? "09:00").slice(0, 5) }
        : {
            kind: "relative",
            event: w.triggerEvent ? triggerFromApi(w.triggerEvent) : "onboarding_initiated",
            offsetValue: w.offsetValue ?? 0,
            offsetUnit: w.offsetUnit ?? "days",
          };
  }
  return {
    id: w.id,
    title: w.title,
    description: w.description ?? undefined,
    triggerMode: w.triggerMode,
    schedule,
    scope:
      w.scopeKind === "department" && w.scopeDepartmentId
        ? { kind: "department", departmentId: w.scopeDepartmentId }
        : { kind: "all" },
    kind: w.workflowKind,
    tasks: tasks.map(
      (t, i): WorkflowTask => ({
        id: t.id,
        order: i + 1,
        title: t.title,
        description: t.description ?? undefined,
        assignee:
          t.assigneeKind === "employee" && t.assigneeEmployeeId
            ? { kind: "employee", employeeId: t.assigneeEmployeeId }
            : { kind: "role", roleId: t.assigneeAccessLevelId ?? "" },
        reviewer: t.hasReviewer && t.reviewerAccessLevelId ? { kind: "role", roleId: t.reviewerAccessLevelId } : null,
        dueDayOffset: t.dueDayOffset ?? undefined,
        expectedDurationDays: t.expectedDurationDays ?? undefined,
        priority: t.priority,
        escalateAfterDays: t.escalateAfterDays ?? undefined,
        dependsOn: t.dependsOn,
        parallelGroup: t.parallelGroup ?? undefined,
        condition: t.condition ? conditionFromApi(t.condition) : undefined,
      }),
    ),
    lastModifiedBy: w.ownerName ?? "",
    lastModifiedAt: day(w.updatedAt) ?? "",
    status: w.status,
    version: w.version,
    effectiveDate: day(w.effectiveFrom),
    ownerId: w.ownerEmployeeId ?? undefined,
    owner: w.ownerName ?? undefined,
    employmentType: w.employmentType ?? undefined,
  };
}

/** The workflow as stored in the builder (task dependencies by position). */
export function workflowToRequest(w: Workflow): WorkflowRequest {
  const position = new Map(w.tasks.map((t, i) => [t.id, i + 1]));
  const s = w.schedule;
  return {
    title: w.title,
    description: w.description || null,
    triggerMode: w.triggerMode,
    ...(s?.kind === "fixed"
      ? { scheduleKind: "fixed" as const, scheduleOn: s.date || null, scheduleAt: s.time || null }
      : s?.kind === "relative"
        ? {
            scheduleKind: "relative" as const,
            triggerEvent: triggerToApi(s.event),
            offsetValue: s.offsetValue,
            offsetUnit: s.offsetUnit,
          }
        : {}),
    scopeKind: w.scope.kind,
    scopeDepartmentId: w.scope.kind === "department" ? w.scope.departmentId : null,
    ...(w.status ? { status: w.status } : {}),
    effectiveFrom: w.effectiveDate || null,
    ownerEmployeeId: w.ownerId || null,
    employmentType: w.employmentType || null,
    tasks: w.tasks.map((t) => ({
      title: t.title,
      description: t.description || null,
      assigneeKind: t.assignee.kind === "employee" ? "employee" : "accessLevel",
      assigneeAccessLevelId: t.assignee.kind === "role" ? t.assignee.roleId || null : null,
      assigneeEmployeeId: t.assignee.kind === "employee" ? t.assignee.employeeId : null,
      hasReviewer: !!t.reviewer,
      reviewerAccessLevelId: t.reviewer?.roleId ?? null,
      dueDayOffset: t.dueDayOffset ?? null,
      expectedDurationDays: t.expectedDurationDays ?? null,
      priority: t.priority ?? "normal",
      escalateAfterDays: t.escalateAfterDays ?? null,
      dependsOnPositions: (t.dependsOn ?? [])
        .map((id) => position.get(id))
        .filter((n): n is number => typeof n === "number"),
      parallelGroup: t.parallelGroup || null,
      ...(t.condition ? { condition: conditionToApi(t.condition) } : {}),
    })),
  };
}

const SUBJECT_FROM_API: Record<ApiSubjectKind, RunSubjectKind> = {
  requisition: "requisition",
  candidate: "candidate",
  onboardingRecord: "onboarding_record",
  employee: "onboarding_record",
};

function subjectHref(kind: ApiSubjectKind, id: string): string {
  if (kind === "requisition") return `/talent/requisition?id=${id}`;
  if (kind === "candidate") return `/talent/recruitment?candidate=${id}`;
  if (kind === "employee") return `/organization/employees/${id}`;
  return `/talent/onboarding?id=${id}`;
}

export const taskStatusFromApi = (s: RunTaskStatus) => snake(s) as WorkflowTaskStatus;

export function runFromApi(dto: RunDto): WorkflowRun {
  const r = dto.run;
  return {
    id: r.id,
    workflowId: r.workflowId,
    workflowTitle: r.workflowTitle,
    workflowVersion: r.workflowVersion,
    trigger: r.trigger ? triggerFromApi(r.trigger) : "manual",
    subject: {
      kind: SUBJECT_FROM_API[r.subjectKind] ?? "onboarding_record",
      id: r.subjectId,
      name: r.subjectName,
      href: subjectHref(r.subjectKind, r.subjectId),
    },
    anchorDate: day(r.anchorOn) ?? "",
    context: Object.fromEntries(r.context.map((c) => [conditionFromApi(c), true])),
    status: r.state,
    startedAt: r.startedAt,
    startedBy: r.startedByUserId ?? "",
    completedAt: undefined,
    tasks: [...dto.tasks]
      .sort((a, b) => a.sequence - b.sequence)
      .map(
        (t, i): RunTask => ({
          id: t.id,
          templateTaskId: t.templateTaskId,
          order: i + 1,
          title: t.title,
          description: t.description ?? undefined,
          priority: t.priority,
          // "overdue" and "blocked" are worked out on the screen from dates
          // and dependencies, so the stored state is what is kept.
          status: taskStatusFromApi(t.state),
          assignee:
            t.assigneeKind === "employee" && t.assigneeEmployeeId
              ? { kind: "employee", employeeId: t.assigneeEmployeeId }
              : { kind: "role", roleId: t.assigneeAccessLevelId ?? "" },
          assigneeEmployeeId: t.assigneeEmployeeId ?? null,
          assigneeName: t.assigneeName,
          reviewer: t.hasReviewer ? { kind: "role", roleId: "" } : null,
          reviewerEmployeeId: t.reviewerEmployeeId ?? null,
          reviewerName: t.reviewerName ?? null,
          dueDate: day(t.dueOn) ?? "",
          expectedDurationDays: t.expectedDurationDays ?? undefined,
          escalateAfterDays: t.escalateAfterDays ?? undefined,
          dependsOn: t.dependsOn,
          parallelGroup: t.parallelGroup ?? undefined,
          condition: t.condition ? conditionFromApi(t.condition) : undefined,
          startedAt: t.startedAt ?? undefined,
          submittedAt: t.submittedAt ?? undefined,
          completedAt: t.completedAt ?? undefined,
          completedBy: t.completedByUserId ?? undefined,
          note: t.note ?? undefined,
          reassignedFrom: t.reassignedFrom ?? undefined,
        }),
      ),
  };
}
