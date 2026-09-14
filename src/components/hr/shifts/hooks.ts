"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { NewShiftTemplate } from "@/src/lib/types/shifts";
import {
  addTemplate as addTemplateAction,
  updateTemplate as updateTemplateAction,
  deleteTemplate as deleteTemplateAction,
  setAssignment as setAssignmentAction,
  clearAssignment as clearAssignmentAction,
} from "@/src/lib/stores/shifts-slice";

export function useShiftTemplates() {
  return useAppSelector((s) => s.shifts.templates);
}

export function useShiftAssignments() {
  return useAppSelector((s) => s.shifts.assignments);
}

/** Employees for the current branch scope, to build the roster grid rows. */
export function useRosterEmployees() {
  return useLocaleSection<LocaleEmployee[]>((bundle) =>
    bundle.employees.filter((e) => e.status !== "terminated"),
  );
}

export function useShiftTemplateWriter() {
  const dispatch = useAppDispatch();
  return {
    addTemplate: (data: NewShiftTemplate) => dispatch(addTemplateAction(data)),
    updateTemplate: (id: string, patch: NewShiftTemplate) =>
      dispatch(updateTemplateAction({ id, patch })),
    deleteTemplate: (id: string) => dispatch(deleteTemplateAction(id)),
  };
}

export function useShiftAssignmentWriter() {
  const dispatch = useAppDispatch();
  return {
    setAssignment: (
      employeeId: string,
      date: string,
      templateId: string,
      note?: string,
    ) => dispatch(setAssignmentAction({ employeeId, date, templateId, note })),
    clearAssignment: (employeeId: string, date: string) =>
      dispatch(clearAssignmentAction({ employeeId, date })),
  };
}
