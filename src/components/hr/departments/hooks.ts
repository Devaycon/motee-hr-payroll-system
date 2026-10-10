"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { Department } from "@/src/lib/types/departments";
import { getApiErrorMessage } from "@/src/lib/utils";
import { departmentSchema } from "@/src/lib/validations/departments";
import {
  useCreateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentsQuery,
  useUpdateDepartmentMutation,
} from "@/src/store/services/departments";
import type { DepartmentDto, DepartmentRequest } from "@/src/types/departments";

export function toDepartment(dept: DepartmentDto): Department {
  return {
    id: dept.id,
    name: dept.name,
    code: dept.code,
    head: dept.headName ?? null,
    headInitials: dept.headInitials ?? undefined,
    headEmployeeId: dept.headEmployeeId ?? null,
    businessUnitId: dept.businessUnitId ?? null,
    description: dept.description ?? "",
    employeeCount: dept.employeeCount,
    // Vacancies are not tracked per department on the API.
    openPositions: 0,
    budgetMonthly: dept.budgetMonthly ?? undefined,
    status: dept.status,
    createdAt: dept.createdAt,
  };
}

export function useDepartments() {
  const { data, isLoading, error } = useGetDepartmentsQuery();
  const departments = useMemo(
    () => data?.data?.map(toDepartment) ?? null,
    [data],
  );
  return {
    data: departments,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/**
 * Create, edit and delete against the API. The forms collect the head as a
 * typed name, so it is matched to an employee here; an unchanged name keeps
 * whoever was already assigned.
 */
export function useDepartmentActions(departments: Department[]) {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartment] = useUpdateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const toRequest = useCallback(
    (dept: Department, existing?: Department): DepartmentRequest | null => {
      const headName = dept.head?.trim() ?? "";
      let headEmployeeId = existing?.headEmployeeId ?? null;
      if (!headName) {
        headEmployeeId = null;
      } else if (headName !== (existing?.head ?? "")) {
        const match = employees?.find(
          (e) => e.fullName.toLowerCase() === headName.toLowerCase(),
        );
        if (!match) {
          toast.error(`No employee named "${headName}"`, {
            description: "Enter the head's name as it appears on their record.",
          });
          return null;
        }
        headEmployeeId = match.id;
      }

      const parsed = departmentSchema.safeParse({
        name: dept.name,
        code: dept.code,
        description: dept.description || null,
        headEmployeeId,
        businessUnitId: existing?.businessUnitId ?? null,
        budgetMonthly: dept.budgetMonthly ?? null,
        status: dept.status,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return null;
      }
      return parsed.data;
    },
    [employees],
  );

  const save = useCallback(
    async (dept: Department) => {
      const existing = departments.find((d) => d.id === dept.id);
      const body = toRequest(dept, existing);
      if (!body) return;
      try {
        if (existing) {
          await updateDepartment({ id: existing.id, body }).unwrap();
          toast.success(`${dept.name} updated`);
        } else {
          await createDepartment(body).unwrap();
          toast.success(`${dept.name} created`);
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not save the department."));
      }
    },
    [departments, toRequest, createDepartment, updateDepartment],
  );

  const bulkSave = useCallback(
    async (rows: Department[]) => {
      let created = 0;
      const failures: string[] = [];
      for (const row of rows) {
        const body = toRequest(row);
        if (!body) {
          failures.push(row.name);
          continue;
        }
        try {
          await createDepartment(body).unwrap();
          created++;
        } catch (err) {
          failures.push(`${row.name}: ${getApiErrorMessage(err, "failed")}`);
        }
      }
      if (created) toast.success(`${created} department(s) created`);
      if (failures.length) {
        toast.error(`${failures.length} could not be created`, {
          description: failures.slice(0, 3).join(" · "),
        });
      }
    },
    [toRequest, createDepartment],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteDepartment(id).unwrap();
        toast.success("Department deleted");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not delete the department."));
      }
    },
    [deleteDepartment],
  );

  return { save, bulkSave, remove };
}
