import type {
  AllocationRequest,
  GoLiveChecklistDto,
  MilestoneRequest,
  MilestoneStatus as ApiMilestoneStatus,
  ProjectDocumentDto,
  ProjectDto,
  ProjectRequest,
  ProjectRiskDto,
  ProjectStatus as ApiProjectStatus,
  ProjectTaskRequest,
  ProjectTaskStatus as ApiTaskStatus,
  RiskRequest,
  TimeEntryDto,
  TimeEntryRequest,
} from "@/src/types/projects";
import type {
  Milestone,
  MilestoneStatus,
  NewProject,
  Project,
  ProjectAllocation,
  ProjectStatus,
  ProjectTask,
  ProjectTaskStatus,
  TimesheetEntry,
} from "@/src/lib/types/projects";
import type { ProjectRisk } from "@/src/lib/types/project-risks";
import type { ProjectDocument, ProjectDocumentCategory } from "@/src/lib/types/project-documents";
import type { GoLiveChecklist } from "@/src/lib/types/go-live-readiness";

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : undefined);

export const projectStatusFromApi = (s: ApiProjectStatus) => snake(s) as ProjectStatus;
export const projectStatusToApi = (s: ProjectStatus) => camel(s) as ApiProjectStatus;
export const taskStatusFromApi = (s: ApiTaskStatus) => snake(s) as ProjectTaskStatus;
export const taskStatusToApi = (s: ProjectTaskStatus) => camel(s) as ApiTaskStatus;
export const milestoneStatusFromApi = (s: ApiMilestoneStatus) => snake(s) as MilestoneStatus;
export const milestoneStatusToApi = (s: MilestoneStatus) => camel(s) as ApiMilestoneStatus;

/** A project with its tasks, milestones and team. */
export function projectFromApi(dto: ProjectDto): Project {
  const p = dto.project;
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: dto.description ?? undefined,
    status: projectStatusFromApi(p.status),
    priority: p.priority,
    client: p.client ?? undefined,
    ownerId: p.ownerEmployeeId ?? undefined,
    ownerName: p.ownerName ?? undefined,
    departmentId: p.departmentId ?? undefined,
    startDate: day(p.startOn) ?? "",
    endDate: day(p.endOn) ?? "",
    budget: p.budget ?? undefined,
    costCentreId: p.costCentreCode ?? undefined,
    tasks: dto.tasks.map(
      (t): ProjectTask => ({
        id: t.id,
        name: t.name,
        description: t.description ?? undefined,
        status: taskStatusFromApi(t.status),
        priority: t.priority,
        startDate: day(t.startOn) ?? "",
        endDate: day(t.endOn) ?? "",
        percentComplete: t.percentComplete,
        assigneeId: t.assigneeEmployeeId ?? undefined,
        assigneeName: t.assigneeName ?? undefined,
        dependsOn: t.dependsOn,
        estimatedHours: t.estimatedHours ?? undefined,
        phase: t.phase ?? undefined,
      }),
    ),
    milestones: dto.milestones.map(
      (m): Milestone => ({
        id: m.id,
        name: m.name,
        date: day(m.targetOn) ?? "",
        actualDate: day(m.actualOn),
        status: milestoneStatusFromApi(m.status),
        percentComplete: m.percentComplete,
        description: m.description ?? undefined,
        reached: m.isReached,
        taskIds: m.taskIds,
        responsibleId: m.responsibleEmployeeId ?? undefined,
        responsibleName: m.responsibleName ?? undefined,
        riskIds: m.riskIds,
        approved: m.isApproved,
        approvedAt: day(m.approvedAt),
      }),
    ),
    allocations: dto.allocations.map(
      (a): ProjectAllocation => ({
        employeeId: a.employeeId,
        employeeName: a.employeeName ?? "",
        projectRole: a.projectRole,
        allocationPercent: a.allocationPercent,
        startDate: day(a.startOn) ?? "",
        endDate: day(a.endOn),
        hourlyRate: a.hourlyRate ?? undefined,
      }),
    ),
    createdAt: day(dto.createdAt) ?? "",
    createdBy: dto.createdByUserId ?? "",
  };
}

export function projectToRequest(p: NewProject): ProjectRequest {
  return {
    code: p.code,
    name: p.name,
    description: p.description || null,
    status: projectStatusToApi(p.status),
    priority: p.priority,
    client: p.client || null,
    ownerEmployeeId: p.ownerId || null,
    departmentId: p.departmentId || null,
    startOn: p.startDate,
    endOn: p.endDate,
    budget: p.budget ?? null,
    costCentreCode: p.costCentreId || null,
  };
}

export function taskToRequest(t: Omit<ProjectTask, "id">): ProjectTaskRequest {
  return {
    name: t.name,
    description: t.description || null,
    status: taskStatusToApi(t.status),
    priority: t.priority,
    startOn: t.startDate,
    endOn: t.endDate,
    percentComplete: t.percentComplete,
    assigneeEmployeeId: t.assigneeId || null,
    dependsOn: t.dependsOn ?? null,
    estimatedHours: t.estimatedHours ?? null,
    phase: t.phase || null,
  };
}

export function milestoneToRequest(m: Omit<Milestone, "id">): MilestoneRequest {
  return {
    name: m.name,
    description: m.description || null,
    targetOn: m.date,
    actualOn: m.actualDate || null,
    ...(m.status ? { status: milestoneStatusToApi(m.status) } : {}),
    percentComplete: m.percentComplete ?? 0,
    responsibleEmployeeId: m.responsibleId || null,
    taskIds: m.taskIds ?? null,
    riskIds: m.riskIds ?? null,
  };
}

export function allocationToRequest(a: ProjectAllocation): AllocationRequest {
  return {
    employeeId: a.employeeId,
    projectRole: a.projectRole || null,
    allocationPercent: a.allocationPercent,
    startOn: a.startDate || null,
    endOn: a.endDate || null,
    hourlyRate: a.hourlyRate ?? null,
  };
}

export function riskFromApi(r: ProjectRiskDto): ProjectRisk {
  return {
    id: r.id,
    projectId: r.projectId,
    type: r.riskKind,
    title: r.title,
    description: r.description ?? undefined,
    ownerId: r.ownerEmployeeId ?? undefined,
    ownerName: r.ownerName ?? undefined,
    impact: r.impact,
    status: r.status,
    dueDate: day(r.dueOn),
    createdAt: day(r.createdAt) ?? "",
    relatedTaskIds: r.relatedTaskIds,
    relatedMilestoneIds: r.relatedMilestoneIds,
  };
}

export function riskToRequest(r: Omit<ProjectRisk, "id" | "projectId" | "createdAt">): RiskRequest {
  return {
    riskKind: r.type,
    title: r.title,
    description: r.description || null,
    ownerEmployeeId: r.ownerId || null,
    impact: r.impact,
    status: r.status,
    dueOn: r.dueDate || null,
    relatedTaskIds: r.relatedTaskIds ?? null,
    relatedMilestoneIds: r.relatedMilestoneIds ?? null,
  };
}

export function timeFromApi(t: TimeEntryDto): TimesheetEntry {
  return {
    id: t.id,
    projectId: t.projectId,
    taskId: t.taskId ?? undefined,
    employeeId: t.employeeId,
    employeeName: t.employeeName ?? "",
    date: day(t.workedOn) ?? "",
    hours: t.hours,
    notes: t.notes ?? undefined,
    status: t.status,
  };
}

export function timeToRequest(t: Omit<TimesheetEntry, "id">): TimeEntryRequest {
  return {
    employeeId: t.employeeId,
    taskId: t.taskId || null,
    workedOn: t.date,
    hours: t.hours,
    notes: t.notes || null,
    status: t.status,
  };
}

export function documentFromApi(d: ProjectDocumentDto): ProjectDocument {
  const ext = d.fileName.split(".").pop()?.toLowerCase() ?? "";
  return {
    id: d.id,
    projectId: d.projectId,
    name: d.name,
    fileType: ext as ProjectDocument["fileType"],
    category: snake(d.category) as ProjectDocumentCategory,
    description: d.description ?? undefined,
    fileSize: d.sizeBytes,
    uploadedAt: day(d.uploadedAt) ?? "",
    uploadedBy: d.uploadedByUserId ?? "",
  };
}

export function goLiveFromApi(c: GoLiveChecklistDto): GoLiveChecklist {
  return {
    projectId: c.projectId,
    items: c.items.map((i) => ({
      id: i.key,
      category: i.category,
      label: i.label,
      done: i.isDone,
      notes: i.notes ?? undefined,
    })),
  };
}
