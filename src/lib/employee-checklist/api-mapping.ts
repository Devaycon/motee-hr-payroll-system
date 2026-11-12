import { getInitials } from "@/src/lib/types/dashboard";
import type {
  ChecklistItem,
  DueDateRule,
  NewChecklistItem,
  NewHire,
  NewHireStatus,
} from "@/src/lib/types/employee-checklist";
import type {
  ChecklistHireDto,
  ChecklistItemDto,
  ChecklistItemRequest,
  ChecklistProgressState,
  EmployeeChecklistDto,
} from "@/src/types/employee-checklist";

/**
 * The form sets a due date as a rule (before, on or after the start date)
 * plus a number of days; the API stores one signed day offset from the start.
 */
function ruleFor(offset: number): DueDateRule {
  if (offset < 0) return "before_start" as DueDateRule;
  if (offset === 0) return "on_start";
  return "after_start" as DueDateRule;
}

function offsetFor(rule: string, days: number): number {
  const n = Math.abs(days || 0);
  if (rule === "before_start") return -n;
  if (rule === "on_start" || rule === "same_day") return 0;
  if (rule === "after_start") return n;
  // The older fixed rules ("day_7"…) carry their own day count.
  const fixed = /^day_(\d+)$/.exec(rule);
  return fixed ? Number(fixed[1]) : n;
}

export function checklistItemFromApi(dto: ChecklistItemDto): ChecklistItem {
  return {
    id: dto.id,
    title: dto.title,
    taskName: dto.title,
    description: dto.description ?? "",
    category: dto.category ?? "",
    responsibleParty: dto.responsibleParty,
    dueDateRule: ruleFor(dto.dueDayOffset),
    dueDateOffset: Math.abs(dto.dueDayOffset),
    isRequired: dto.isRequired,
    isActive: dto.isActive,
    order: dto.sequence,
  };
}

export function checklistItemToApi(
  item: NewChecklistItem | ChecklistItem,
): ChecklistItemRequest {
  return {
    title: (item.taskName || item.title).trim(),
    description: item.description?.trim() || null,
    category: item.category?.trim() || null,
    responsibleParty: item.responsibleParty,
    dueDayOffset: offsetFor(item.dueDateRule, item.dueDateOffset),
    isRequired: item.isRequired,
  };
}

const STATE_FROM_API: Record<ChecklistProgressState, NewHireStatus> = {
  notStarted: "pending",
  inProgress: "in_progress",
  completed: "completed",
  overdue: "overdue",
};

export function checklistHireFromApi(
  dto: ChecklistHireDto,
  tasks?: EmployeeChecklistDto["tasks"],
): NewHire {
  return {
    id: dto.employeeId,
    name: dto.employeeName,
    initials: getInitials(dto.employeeName),
    jobTitle: dto.jobTitle ?? "",
    department: dto.departmentName ?? "—",
    startDate: dto.startDate ?? "",
    status: STATE_FROM_API[dto.progress.state] ?? "pending",
    progress: (tasks ?? []).map((t) => ({
      itemId: t.item.id,
      completed: t.state === "done",
      completedAt: t.completedOn ?? undefined,
    })),
    completedItems: dto.progress.completed,
    totalItems: dto.progress.total,
  };
}
