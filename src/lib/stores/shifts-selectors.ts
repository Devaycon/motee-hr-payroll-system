/**
 * Shared "which shift is this employee on" logic, used by both the HR roster
 * and the employee-facing "My Shifts" screens so the two can never disagree.
 *
 * HR's explicit `ShiftAssignment` rows always win. When none exists for a
 * working day, a deterministic rotation over the available templates fills
 * the gap so the roster reads as a real schedule from day one, without
 * needing seed data hand-tied to one specific locale's employee ids.
 */

import type { LocaleWorkPattern } from "@/src/lib/types/locale";
import { parseIsoDate, scheduleForDay } from "@/src/lib/types/attendance";
import type { ShiftAssignment, ShiftTemplate } from "@/src/lib/types/shifts";

/** Simple, stable string hash — good enough to spread employees across shifts. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * The default template an employee would fall on for a given date, absent an
 * explicit assignment. Only templates whose `workDays` include that weekday
 * are candidates, so a Weekend-only template never lands on a Tuesday.
 */
export function defaultTemplateForEmployee(
  employeeId: string,
  date: string,
  templates: ShiftTemplate[],
): ShiftTemplate | null {
  const weekday = parseIsoDate(date).toLocaleDateString("en-US", {
    weekday: "short",
  }) as ShiftTemplate["workDays"][number];
  const eligible = templates.filter((t) => t.workDays.includes(weekday));
  if (!eligible.length) return null;
  const index = hashString(`${employeeId}:${date.slice(0, 7)}`) % eligible.length;
  return eligible[index];
}

export interface ResolvedShift {
  template: ShiftTemplate;
  assignment: ShiftAssignment | null;
  /** True when this came from the default rotation rather than an explicit assignment. */
  isDefault: boolean;
}

/**
 * The resolved shift for one employee on one date, or `null` when it is not a
 * working day for them at all (weekend on a Mon–Fri pattern, etc). Working-ness
 * is judged from their contracted `LocaleWorkPattern`, not from any template.
 */
export function resolveShiftForDate(
  employeeId: string,
  date: string,
  workPattern: LocaleWorkPattern | undefined,
  templates: ShiftTemplate[],
  assignments: ShiftAssignment[],
): ResolvedShift | null {
  const isWorkingDay = Boolean(scheduleForDay(workPattern, date));
  const explicit = assignments.find(
    (a) => a.employeeId === employeeId && a.date === date,
  );
  if (explicit) {
    const template = templates.find((t) => t.id === explicit.templateId);
    if (template) return { template, assignment: explicit, isDefault: false };
  }
  if (!isWorkingDay) return null;
  const template = defaultTemplateForEmployee(employeeId, date, templates);
  if (!template) return null;
  return { template, assignment: null, isDefault: true };
}
