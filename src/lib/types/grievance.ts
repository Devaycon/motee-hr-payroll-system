export type GrievanceCategory =
  | "harassment"
  | "unfair_treatment"
  | "pay_dispute"
  | "working_conditions"
  | "discrimination"
  | "other";

export type DisciplinaryCategory =
  | "misconduct"
  | "poor_performance"
  | "attendance"
  | "insubordination"
  | "policy_violation"
  | "other";

export type GrievanceStatus =
  | "raised"
  | "under_review"
  | "under_investigation"
  | "hearing_scheduled"
  | "mediation"
  | "resolved"
  | "closed"
  | "appealed";

export type DisciplinaryStatus =
  | "reported"
  | "investigation"
  | "hearing_scheduled"
  | "outcome_issued"
  | "appealed"
  | "closed";

export type DisciplinaryOutcome =
  | "verbal_warning"
  | "written_warning"
  | "final_written_warning"
  | "suspension"
  | "demotion"
  | "termination"
  | "no_action";

export type CasePriority = "low" | "medium" | "high" | "urgent";

export type CaseType = "grievance" | "disciplinary";

export interface CaseNote {
  id: string;
  authorName: string;
  authorInitials: string;
  message?: string;
  content: string;
  createdAt: string;
  isPrivate?: boolean;
  isInternal?: boolean;
}

export interface GrievanceCase {
  id: string;
  type: "grievance";
  caseNumber: string;
  employeeName: string;
  employeeInitials: string;
  employeeDept: string;
  dateRaised: string;
  incidentDate?: string;
  description: string;
  category: GrievanceCategory;
  status: GrievanceStatus;
  priority: CasePriority;
  assignedTo?: string;
  assignedInitials?: string;
  hasAppeal: boolean;
  appealCaseId?: string;
  hearingDate?: string;
  outcome?: string;
  outcomeDate?: string;
  notes: CaseNote[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface DisciplinaryCase {
  id: string;
  type: "disciplinary";
  caseNumber: string;
  employeeName: string;
  employeeInitials: string;
  employeeDept: string;
  incidentDate: string;
  dateRaised: string;
  description: string;
  category: DisciplinaryCategory;
  status: DisciplinaryStatus;
  priority: CasePriority;
  assignedTo?: string;
  assignedInitials?: string;
  outcome?: DisciplinaryOutcome;
  hasAppeal: boolean;
  appealCaseId?: string;
  hearingDate?: string;
  outcomeDate?: string;
  notes: CaseNote[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type AnyCase = GrievanceCase | DisciplinaryCase;

export interface NewGrievanceCase {
  type: "grievance";
  employeeName: string;
  employeeDept: string;
  incidentDate?: string;
  description: string;
  category: string;
  priority: string;
  assignedTo?: string;
}

export interface NewDisciplinaryCase {
  type: "disciplinary";
  employeeName: string;
  employeeDept: string;
  incidentDate: string;
  description: string;
  category: string;
  priority: string;
  assignedTo?: string;
}


