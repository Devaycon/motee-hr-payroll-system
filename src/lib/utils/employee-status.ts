/**
 * Employee lifecycle status → label/tone, covering both the values the real
 * locale data actually returns (`active`, `on_leave`, `terminated`) and the
 * richer vocabulary used by the Employees list (`probation`, `offboarding`,
 * `pending`, `onboarded`, `inactive`, `deleted`) so one badge works wherever
 * a `LocaleEmployee.status` shows up.
 */

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  on_leave: "On Leave",
  probation: "Probation",
  offboarding: "Offboarding Notice",
  pending: "Pending",
  onboarded: "Onboarded",
  inactive: "Inactive",
  terminated: "Terminated",
  deleted: "Deleted",
};

export const EMPLOYEE_STATUS_TONES: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  on_leave: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  probation: "border-sky-500/30 bg-sky-500/10 text-sky-600",
  offboarding: "border-orange-500/30 bg-orange-500/10 text-orange-600",
  pending: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  onboarded: "border-teal-500/30 bg-teal-500/10 text-teal-600",
  inactive: "border-slate-400/30 bg-slate-400/10 text-slate-500",
  terminated: "border-red-500/30 bg-red-500/10 text-red-600",
  deleted: "border-rose-500/30 bg-rose-500/10 text-rose-600",
};

function titleCase(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function employeeStatusLabel(status: string): string {
  return EMPLOYEE_STATUS_LABELS[status] ?? titleCase(status);
}

export function employeeStatusTone(status: string): string {
  return (
    EMPLOYEE_STATUS_TONES[status] ??
    "border-border bg-muted text-muted-foreground"
  );
}
