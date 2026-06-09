import type {
  LocaleDepartment,
  LocaleEmployee,
  LocaleRole,
} from "@/src/lib/types/locale";
import type {
  WorkflowAssignee,
  WorkflowReviewer,
  WorkflowSchedule,
  WorkflowScope,
} from "@/src/lib/types/workflows";
import { TRIGGER_EVENT_LABELS } from "@/src/lib/types/workflows";

export function roleLabel(roleId: string, roles: LocaleRole[]): string {
  return roles.find((r) => r.id === roleId)?.name ?? roleId;
}

export function employeeLabel(
  employeeId: string,
  employees: LocaleEmployee[],
): string {
  return employees.find((e) => e.id === employeeId)?.fullName ?? employeeId;
}

export function departmentLabel(
  departmentId: string,
  departments: LocaleDepartment[],
): string {
  return departments.find((d) => d.id === departmentId)?.name ?? departmentId;
}

export function scopeLabel(
  scope: WorkflowScope,
  departments: LocaleDepartment[],
): string {
  return scope.kind === "all"
    ? "All departments"
    : departmentLabel(scope.departmentId, departments);
}

export function assigneeLabel(
  assignee: WorkflowAssignee,
  roles: LocaleRole[],
  employees: LocaleEmployee[],
): string {
  return assignee.kind === "role"
    ? roleLabel(assignee.roleId, roles)
    : employeeLabel(assignee.employeeId, employees);
}

export function reviewerLabel(
  reviewer: WorkflowReviewer | null,
  roles: LocaleRole[],
): string | null {
  return reviewer ? roleLabel(reviewer.roleId, roles) : null;
}

/** Human-readable summary of an automatic workflow's schedule. */
export function scheduleLabel(
  schedule: WorkflowSchedule | null | undefined,
): string | null {
  if (!schedule) return null;
  if (schedule.kind === "fixed") {
    if (!schedule.date) return null;
    const when = schedule.time ? `${schedule.date} ${schedule.time}` : schedule.date;
    return `On ${when}`;
  }
  const event = TRIGGER_EVENT_LABELS[schedule.event];
  if (schedule.offsetValue <= 0) return `As soon as ${event}`;
  return `${schedule.offsetValue} ${schedule.offsetUnit} after ${event}`;
}

/** Employees available for the given workflow scope. */
export function employeesForScope(
  scope: WorkflowScope,
  employees: LocaleEmployee[],
): LocaleEmployee[] {
  if (scope.kind === "all") return employees;
  return employees.filter((e) => e.departmentId === scope.departmentId);
}
