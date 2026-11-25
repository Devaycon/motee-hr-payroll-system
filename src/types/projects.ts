import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface AllocationRequest {
  employeeId: string;
  projectRole?: string | null;
  allocationPercent: number;
  startOn?: string | null;
  endOn?: string | null;
  hourlyRate?: number | null;
}

export interface CriticalPathAlert {
  taskCount: number;
  blockerTaskId: string;
  blockerTaskName: string;
  impactMilestoneId?: string | null;
  impactMilestoneName?: string | null;
  ownerEmployeeId?: string | null;
  dueOn: string;
}

export type GoLiveCategory =
  "people" | "data" | "systems" | "compliance" | "support";

export interface GoLiveCategoryTally {
  done: number;
  total: number;
  percent: number;
}

export interface GoLiveCheckDto {
  key: string;
  category: GoLiveCategory;
  label: string;
  isDone: boolean;
  notes?: string | null;
  updatedByUserId?: string | null;
  updatedAt?: string | null;
}

export interface GoLiveChecklistDto {
  projectId: string;
  items: GoLiveCheckDto[];
  readiness: GoLiveReadiness;
}

export interface GoLiveReadiness {
  overallPercent: number;
  byCategory: Record<string, GoLiveCategoryTally>;
}

export interface GoLiveTickRequest {
  isDone: boolean;
  notes?: string | null;
}

export type HealthStatus =
  "unknown" | "green" | "amber" | "red";

export interface MilestoneApprovalRequest {
  approved: boolean;
}

export interface MilestoneRequest {
  name: string;
  description?: string | null;
  targetOn: string;
  actualOn?: string | null;
  status?: MilestoneStatus;
  percentComplete?: number;
  responsibleEmployeeId?: string | null;
  taskIds?: string[] | null;
  riskIds?: string[] | null;
}

export type MilestoneStatus =
  "notStarted" | "inProgress" | "atRisk" | "completed";

export interface NextAction {
  bucket: NextActionBucket;
  kind: NextActionKind;
  id: string;
  label: string;
  ownerEmployeeId?: string | null;
  dueOn: string;
  priority?: ProjectPriority;
  status: string;
}

export type NextActionBucket =
  "overdue" | "today" | "thisWeek";

export type NextActionKind =
  "task" | "milestone";

export interface OverAllocation {
  employeeId: string;
  employeeName: string;
  totalPercent: number;
  projects: OverAllocationProject[];
}

export interface OverAllocationProject {
  projectId: string;
  projectName: string;
  allocationPercent: number;
}

export interface ProjectAllocationDto {
  employeeId: string;
  employeeName?: string | null;
  jobTitle?: string | null;
  departmentName?: string | null;
  projectRole: string;
  allocationPercent: number;
  startOn: string;
  endOn?: string | null;
  hourlyRate?: number | null;
  taskCount: number;
  approvedHours: number;
  committedPercentEverywhere: number;
}

export type ProjectDocumentCategory =
  "charter" | "businessRequirements" | "processMaps" | "dataMigrationPlan" | "payrollIntegrationSpec" | "uatPlan" | "trainingPlan" | "goLiveChecklist" | "riskRegister" | "statusReport" | "vendorContract" | "changeRequest" | "other";

export interface ProjectDocumentDto {
  id: string;
  projectId: string;
  name: string;
  category: ProjectDocumentCategory;
  description?: string | null;
  storedFileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedByUserId?: string | null;
  uploadedAt: string;
}

export interface ProjectDto {
  project: ProjectRowDto;
  description?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  tasks: ProjectTaskDto[];
  milestones: ProjectMilestoneDto[];
  allocations: ProjectAllocationDto[];
  riskCount: number;
  openRiskCount: number;
  criticalPathProgressPercent: number;
  criticalPathTaskIds: string[];
  scheduleConflicts: ScheduleConflict[];
  health: ProjectHealth;
  alert?: CriticalPathAlert;
  nextActions: NextAction[];
  approvedHours: number;
  committedSpend: number;
  forecastFinalCost: number;
  remainingBudget: number;
  budgetUtilisationPercent: number;
}

export interface ProjectHealth {
  overall: HealthStatus;
  schedule: HealthStatus;
  budget: HealthStatus;
  resources: HealthStatus;
  criticalPath: HealthStatus;
  scope: HealthStatus;
}

export interface ProjectMilestoneDto {
  id: string;
  name: string;
  description?: string | null;
  targetOn: string;
  actualOn?: string | null;
  status: MilestoneStatus;
  percentComplete: number;
  isReached: boolean;
  isOverdue: boolean;
  responsibleEmployeeId?: string | null;
  responsibleName?: string | null;
  taskIds: string[];
  riskIds: string[];
  isApproved: boolean;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
}

export type ProjectPriority =
  "low" | "medium" | "high" | "critical";

export interface ProjectRequest {
  code: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  client?: string | null;
  ownerEmployeeId?: string | null;
  departmentId?: string | null;
  startOn: string;
  endOn: string;
  budget?: number | null;
  costCentreCode?: string | null;
}

export interface ProjectRiskDto {
  id: string;
  projectId: string;
  riskKind: RiskKind;
  title: string;
  description?: string | null;
  ownerEmployeeId?: string | null;
  ownerName?: string | null;
  impact: RiskImpact;
  status: RiskStatus;
  dueOn?: string | null;
  isOverdue: boolean;
  relatedTaskIds: string[];
  relatedMilestoneIds: string[];
  createdAt: string;
}

export interface ProjectRowDto {
  id: string;
  code: string;
  name: string;
  client?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerEmployeeId?: string | null;
  ownerName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  startOn: string;
  endOn: string;
  budget?: number | null;
  costCentreCode?: string | null;
  progressPercent: number;
  taskCount: number;
  completedTaskCount: number;
  milestoneCount: number;
  teamSize: number;
  totalAllocationFte: number;
  spend: number;
}

export type ProjectStatus =
  "planning" | "active" | "onHold" | "completed" | "cancelled";

export interface ProjectSummaryDto {
  totalProjects: number;
  openProjects: number;
  staffedProjects: number;
  budgetedProjects: number;
  peopleAssigned: number;
  totalBudget: number;
  totalSpend: number;
  averageProgressPercent: number;
  overAllocations: OverAllocation[];
}

export interface ProjectTaskDto {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectTaskStatus;
  priority?: ProjectPriority;
  startOn: string;
  endOn: string;
  percentComplete: number;
  assigneeEmployeeId?: string | null;
  assigneeName?: string | null;
  dependsOn: string[];
  estimatedHours?: number | null;
  phase?: string | null;
  isBlocked: boolean;
  waitingOn: string[];
  isOnCriticalPath: boolean;
  isOverdue: boolean;
  approvedHours: number;
}

export interface ProjectTaskRequest {
  name: string;
  description?: string | null;
  status?: ProjectTaskStatus;
  priority?: ProjectPriority;
  startOn: string;
  endOn: string;
  percentComplete?: number;
  assigneeEmployeeId?: string | null;
  dependsOn?: string[] | null;
  estimatedHours?: number | null;
  phase?: string | null;
}

export type ProjectTaskStatus =
  "notStarted" | "inProgress" | "atRisk" | "blocked" | "completed" | "cancelled";

export type RiskImpact =
  "low" | "medium" | "high";

export type RiskKind =
  "risk" | "issue";

export interface RiskRequest {
  riskKind?: RiskKind;
  title: string;
  description?: string | null;
  ownerEmployeeId?: string | null;
  impact?: RiskImpact;
  status?: RiskStatus;
  dueOn?: string | null;
  relatedTaskIds?: string[] | null;
  relatedMilestoneIds?: string[] | null;
}

export type RiskStatus =
  "open" | "monitoring" | "closed";

export interface RiskTally {
  total: number;
  open: number;
  issues: number;
  highImpactOpen: number;
}

export interface ScheduleConflict {
  taskId: string;
  taskName: string;
  blockerId: string;
  blockerName: string;
  overlapDays: number;
}

export interface TaskProgressRequest {
  percentComplete: number;
}

export interface TaskStatusRequest {
  status: ProjectTaskStatus;
}

export interface TimeEntryDto {
  id: string;
  projectId: string;
  projectName?: string | null;
  taskId?: string | null;
  taskName?: string | null;
  employeeId: string;
  employeeName?: string | null;
  workedOn: string;
  hours: number;
  notes?: string | null;
  status: TimeEntryStatus;
  resolvedByUserId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface TimeEntryRequest {
  employeeId: string;
  taskId?: string | null;
  workedOn: string;
  hours: number;
  notes?: string | null;
  status?: TimeEntryStatus;
}

export type TimeEntryStatus =
  "draft" | "submitted" | "approved" | "rejected";

export interface TimeEntryStatusRequest {
  status: TimeEntryStatus;
}

export interface TimeTally {
  approvedHours: number;
  awaitingApprovalHours: number;
  totalHours: number;
  entries: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/projects/{projectId}/documents
export type GetProjectDocumentsResponse = ApiResponse<ProjectDocumentDto[]>;
export interface GetProjectDocumentsParams {
  category?: ProjectDocumentCategory;
}

// POST /api/v1/projects/{projectId}/documents
export type AddProjectDocumentResponse = ApiResponse<ProjectDocumentDto>;
export type AddProjectDocumentRequest = {
  ContentType?: string;
  ContentDisposition?: string;
  Headers?: Record<string, string[]>;
  Length?: number;
  Name?: string;
  FileName?: string;
} & {
  category?: ProjectDocumentCategory;
} & {
  name?: string;
} & {
  description?: string;
};

// GET /api/v1/projects/{projectId}/documents/{documentId}/download

// DELETE /api/v1/projects/{projectId}/documents/{documentId}
export type DeleteProjectDocumentResponse = ApiResponse<unknown | null>;

// GET /api/v1/projects/{projectId}/go-live
export type GetProjectGoLiveResponse = ApiResponse<GoLiveChecklistDto>;

// PUT /api/v1/projects/{projectId}/go-live/{itemKey}
export type UpdateProjectGoLiveItemResponse = ApiResponse<GoLiveChecklistDto>;

// GET /api/v1/projects/{projectId}/risks
export type GetProjectRisksResponse = ApiResponse<ProjectRiskDto[]>;

// POST /api/v1/projects/{projectId}/risks
export type AddProjectRiskResponse = ApiResponse<ProjectRiskDto>;

// GET /api/v1/projects/{projectId}/risks/tally
export type GetProjectRiskTallyResponse = ApiResponse<RiskTally>;

// PUT /api/v1/projects/{projectId}/risks/{riskId}
export type UpdateProjectRiskResponse = ApiResponse<ProjectRiskDto>;

// DELETE /api/v1/projects/{projectId}/risks/{riskId}
export type DeleteProjectRiskResponse = ApiResponse<unknown | null>;

// GET /api/v1/projects
export type GetProjectsResponse = ApiResponse<PagedResult<ProjectRowDto>>;
export interface GetProjectsParams {
  Status?: ProjectStatus;
  Priority?: ProjectPriority;
  OwnerEmployeeId?: string;
  DepartmentId?: string;
  OpenOnly?: boolean;
  ClosedOnly?: boolean;
  StaffedOnly?: boolean;
  BudgetedOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/projects
export type CreateProjectResponse = ApiResponse<ProjectDto>;

// GET /api/v1/projects/summary
export type GetProjectSummaryResponse = ApiResponse<ProjectSummaryDto>;

// GET /api/v1/projects/{id}
export type GetProjectResponse = ApiResponse<ProjectDto>;

// PUT /api/v1/projects/{id}
export type UpdateProjectResponse = ApiResponse<ProjectDto>;

// DELETE /api/v1/projects/{id}
export type DeleteProjectResponse = ApiResponse<unknown | null>;

// POST /api/v1/projects/{id}/tasks
export type AddProjectTaskResponse = ApiResponse<ProjectDto>;

// PUT /api/v1/projects/{id}/tasks/{taskId}
export type UpdateProjectTaskResponse = ApiResponse<ProjectDto>;

// DELETE /api/v1/projects/{id}/tasks/{taskId}
export type DeleteProjectTaskResponse = ApiResponse<ProjectDto>;

// PATCH /api/v1/projects/{id}/tasks/{taskId}/status
export type SetProjectTaskStatusResponse = ApiResponse<ProjectDto>;

// PATCH /api/v1/projects/{id}/tasks/{taskId}/progress
export type SetProjectTaskProgressResponse = ApiResponse<ProjectDto>;

// POST /api/v1/projects/{id}/milestones
export type AddProjectMilestoneResponse = ApiResponse<ProjectDto>;

// PUT /api/v1/projects/{id}/milestones/{milestoneId}
export type UpdateProjectMilestoneResponse = ApiResponse<ProjectDto>;

// DELETE /api/v1/projects/{id}/milestones/{milestoneId}
export type DeleteProjectMilestoneResponse = ApiResponse<ProjectDto>;

// POST /api/v1/projects/{id}/milestones/{milestoneId}/toggle
export type ToggleProjectMilestoneResponse = ApiResponse<ProjectDto>;

// PUT /api/v1/projects/{id}/milestones/{milestoneId}/approval
export type SetProjectMilestoneApprovalResponse = ApiResponse<ProjectDto>;

// PUT /api/v1/projects/{id}/allocations
export type SetProjectAllocationResponse = ApiResponse<ProjectDto>;

// DELETE /api/v1/projects/{id}/allocations/{employeeId}
export type RemoveProjectAllocationResponse = ApiResponse<ProjectDto>;

// GET /api/v1/projects/{projectId}/time
export type GetProjectTimeEntriesResponse = ApiResponse<PagedResult<TimeEntryDto>>;
export interface GetProjectTimeEntriesParams {
  ProjectId?: string;
  TaskId?: string;
  EmployeeId?: string;
  Status?: TimeEntryStatus;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/projects/{projectId}/time
export type LogProjectTimeResponse = ApiResponse<TimeEntryDto>;

// GET /api/v1/projects/{projectId}/time/tally
export type GetProjectTimeTallyResponse = ApiResponse<TimeTally>;

// PATCH /api/v1/projects/{projectId}/time/{entryId}/status
export type SetProjectTimeEntryStatusResponse = ApiResponse<TimeEntryDto>;

// DELETE /api/v1/projects/{projectId}/time/{entryId}
export type DeleteProjectTimeEntryResponse = ApiResponse<unknown | null>;

