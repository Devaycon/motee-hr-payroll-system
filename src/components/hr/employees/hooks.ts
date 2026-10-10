"use client";

import { useMemo } from "react";
import { listItemToEmployeeRow } from "@/src/lib/employees/api-mapping";
import type { EmployeeRow } from "@/src/lib/types/employees";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetDepartmentsQuery } from "@/src/store/services/departments";
import { useGetEmployeeDirectoryQuery } from "@/src/store/services/employee-directory";

/**
 * The full employee list, straight from the API. Lifecycle state (pending,
 * probation, on leave, offboarding, inactive, deleted) is whatever the server
 * says — there are no local overrides layered on top any more.
 */
export function useEmployees() {
  const { data, isLoading, error } = useGetEmployeeDirectoryQuery();
  const rows = useMemo<EmployeeRow[] | null>(
    () => data?.map(listItemToEmployeeRow) ?? null,
    [data],
  );
  return {
    data: rows,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

export function useDepartmentOptions() {
  const { data, isLoading, error } = useGetDepartmentsQuery();
  const options = useMemo(
    () => (data?.data ? ["all", ...data.data.map((d) => d.name)] : null),
    [data],
  );
  return {
    data: options,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}
