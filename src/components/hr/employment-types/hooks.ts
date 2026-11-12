"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  employmentTypeFromApi,
  employmentTypeToApi,
} from "@/src/lib/employment-types/api-mapping";
import type {
  EmploymentTypeRow,
  NewEmploymentType,
} from "@/src/lib/types/employment-types";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useCreateEmploymentTypeMutation,
  useDeactivateEmploymentTypeMutation,
  useDeleteEmploymentTypeMutation,
  useGetEmploymentTypeQuery,
  useGetEmploymentTypesQuery,
  useReactivateEmploymentTypeMutation,
  useUpdateEmploymentTypeMutation,
} from "@/src/store/services/employment-types";

/** Every employment type the company has set up, active or not. */
export function useEmploymentTypes() {
  const { data, isLoading, error } = useGetEmploymentTypesQuery({
    activeOnly: false,
  });
  const rows = useMemo(
    () => data?.data?.map(employmentTypeFromApi) ?? null,
    [data],
  );
  return {
    data: rows,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/** The detail view re-reads the type so it shows the server's latest copy. */
export function useEmploymentTypeDetail(row: EmploymentTypeRow | null) {
  const { data } = useGetEmploymentTypeQuery(row?.id ?? "", { skip: !row });
  return useMemo(
    () => (data?.data ? employmentTypeFromApi(data.data) : row),
    [data, row],
  );
}

export function useEmploymentTypeActions(types: EmploymentTypeRow[]) {
  const [createType] = useCreateEmploymentTypeMutation();
  const [updateType] = useUpdateEmploymentTypeMutation();
  const [deactivate] = useDeactivateEmploymentTypeMutation();
  const [reactivate] = useReactivateEmploymentTypeMutation();
  const [deleteType] = useDeleteEmploymentTypeMutation();

  const save = useCallback(
    async (row: NewEmploymentType | EmploymentTypeRow) => {
      const existing =
        "id" in row ? types.find((t) => t.id === row.id) : undefined;
      try {
        if (existing) {
          await updateType({
            id: existing.id,
            body: employmentTypeToApi(row, existing),
          }).unwrap();
          toast.success(`${row.name} updated`);
        } else {
          await createType(employmentTypeToApi(row)).unwrap();
          toast.success(`${row.name} created`);
        }
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, "Could not save the employment type."),
        );
      }
    },
    [types, createType, updateType],
  );

  const bulkSave = useCallback(
    async (rows: EmploymentTypeRow[]) => {
      let created = 0;
      const failures: string[] = [];
      for (const row of rows) {
        try {
          await createType(employmentTypeToApi(row)).unwrap();
          created++;
        } catch (err) {
          failures.push(`${row.name}: ${getApiErrorMessage(err, "failed")}`);
        }
      }
      if (created) {
        toast.success(
          `Imported ${created} employment type${created === 1 ? "" : "s"}`,
        );
      }
      if (failures.length) {
        toast.error(`${failures.length} could not be imported`, {
          description: failures.slice(0, 3).join(" · "),
        });
      }
    },
    [createType],
  );

  const toggleStatus = useCallback(
    async (id: string) => {
      const type = types.find((t) => t.id === id);
      if (!type) return;
      try {
        await (type.isActive ? deactivate(id) : reactivate(id)).unwrap();
        toast.success(
          `${type.name} ${type.isActive ? "deactivated" : "activated"}`,
        );
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not change the status."));
      }
    },
    [types, deactivate, reactivate],
  );

  /** Not offered by the approved screen yet; kept for when it is. */
  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteType(id).unwrap();
        toast.success("Employment type deleted");
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, "Could not delete the employment type."),
        );
      }
    },
    [deleteType],
  );

  return { save, bulkSave, toggleStatus, remove };
}
