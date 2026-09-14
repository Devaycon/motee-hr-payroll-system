/**
 * Shift scheduling.
 *
 * A `ShiftTemplate` is the reusable definition of a shift (its name, time
 * range, break and color). A `ShiftAssignment` puts one employee on one
 * template on one calendar date — HR's explicit roster entries.
 *
 * When no explicit assignment exists for a working day, the roster and "My
 * Shifts" screens fall back to a deterministic default (see
 * `defaultTemplateForEmployee` in the hooks) so the schedule always reads as
 * populated instead of empty, without needing seed data tied to one specific
 * locale's employee ids.
 */

import type { WorkDay } from "@/src/lib/types/attendance";

export type ShiftAssignmentStatus = "scheduled" | "completed" | "cancelled";

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  /** Tailwind-safe hex used for calendar dots and roster cell accents. */
  color: string;
  workDays: WorkDay[];
  createdAt: string;
}

export interface NewShiftTemplate {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  color: string;
  workDays: WorkDay[];
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  templateId: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  status: ShiftAssignmentStatus;
  note?: string;
}

export function shiftDurationHours(template: ShiftTemplate): number {
  const [sh, sm] = template.startTime.split(":").map(Number);
  const [eh, em] = template.endTime.split(":").map(Number);
  let span = eh * 60 + em - (sh * 60 + sm);
  if (span <= 0) span += 24 * 60; // overnight shift (e.g. Night: 22:00 - 06:00)
  const minutes = Math.max(0, span - template.breakMinutes);
  return Math.round((minutes / 60) * 10) / 10;
}
