export type ResponsibleParty = "hr" | "manager" | "it" | "employee" | "finance";

export type DueDateRule =
  | "on_start"
  | "same_day"
  | "day_1"
  | "day_3"
  | "day_7"
  | "day_14"
  | "day_30"
  | "day_60"
  | "day_90";

export interface ChecklistItem {
  id: string;
  title: string;
  taskName: string;
  description: string;
  category: string;
  responsibleParty: ResponsibleParty;
  dueDateRule: DueDateRule;
  dueDateOffset: number;
  isRequired: boolean;
  isActive: boolean;
  order: number;
}

export interface NewChecklistItem {
  title: string;
  taskName: string;
  description: string;
  category: string;
  responsibleParty: ResponsibleParty;
  dueDateRule: DueDateRule;
  dueDateOffset: number;
  isRequired: boolean;
}

export type NewHireStatus = "pending" | "in_progress" | "completed" | "overdue";

export interface NewHireChecklistProgress {
  itemId: string;
  completed: boolean;
  completedAt?: string;
}

export interface NewHire {
  id: string;
  name: string;
  initials: string;
  jobTitle: string;
  department: string;
  startDate: string;
  status: NewHireStatus;
  progress: NewHireChecklistProgress[];
  completedItems: number;
  totalItems: number;
}

