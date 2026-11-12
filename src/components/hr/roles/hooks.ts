"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useLiveDepartments } from "@/src/lib/hooks/use-live-departments";
import type { NewPosition, Position, PositionStatus } from "@/src/lib/types/roles";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useAssignPositionMutation,
  useCreatePositionMutation,
  useDeletePositionMutation,
  useGetPositionQuery,
  useGetPositionsQuery,
  useGetPositionsSummaryQuery,
  useRestorePositionMutation,
  useRetirePositionMutation,
  useUnassignPositionMutation,
  useUpdatePositionMutation,
} from "@/src/store/services/positions";
import type {
  PositionDto,
  PositionRequest,
  PositionStatus as ApiPositionStatus,
} from "@/src/types/positions";

/**
 * The API works a position's status out from its holders. A position that is
 * recruiting is still unfilled, so it stays on the vacancy report.
 */
const STATUS_FROM_API: Record<ApiPositionStatus, PositionStatus> = {
  filled: "filled",
  recruiting: "vacant",
  vacant: "vacant",
  inactive: "inactive",
};

export interface LivePosition extends Position {
  headcount: number;
  holders: PositionDto["holders"];
}

export function positionFromApi(dto: PositionDto): LivePosition {
  return {
    id: dto.id,
    title: dto.title,
    department: dto.departmentName ?? "—",
    grade: dto.grade ?? "",
    status: dto.isActive ? STATUS_FROM_API[dto.status] : "inactive",
    description: dto.description ?? undefined,
    createdAt: dto.updatedAt.slice(0, 10),
    headcount: dto.headcount,
    holders: dto.holders,
  };
}

export function usePositions() {
  const { data, isLoading, error } = useGetPositionsQuery({
    IncludeInactive: true,
  });
  const positions = useMemo(
    () => data?.data?.map(positionFromApi) ?? [],
    [data],
  );
  return {
    positions,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/** Company-wide counts for the KPI cards, straight from the server. */
export function usePositionsSummary() {
  const { data } = useGetPositionsSummaryQuery();
  return data?.data ?? null;
}

/** The detail view re-reads the position for its latest holders. */
export function usePositionDetail(listed: Position | null) {
  const { data } = useGetPositionQuery(listed?.id ?? "", { skip: !listed });
  return useMemo(
    () => (data?.data ? positionFromApi(data.data) : listed),
    [data, listed],
  );
}

export function usePositionActions(positions: Position[]) {
  const { idByName } = useLiveDepartments();
  const [createPosition] = useCreatePositionMutation();
  const [updatePosition] = useUpdatePositionMutation();
  const [deletePosition] = useDeletePositionMutation();
  const [retirePosition] = useRetirePositionMutation();
  const [restorePosition] = useRestorePositionMutation();
  const [assignPosition] = useAssignPositionMutation();
  const [unassignPosition] = useUnassignPositionMutation();

  const toRequest = useCallback(
    (form: NewPosition, existing?: LivePosition): PositionRequest => ({
      title: form.title.trim(),
      departmentId: idByName.get(form.department) ?? null,
      grade: form.grade || null,
      description: form.description?.trim() || null,
      // The form has no headcount field: keep what the server holds.
      headcount: existing?.headcount ?? 1,
    }),
    [idByName],
  );

  const save = useCallback(
    async (form: NewPosition | Position) => {
      const existing =
        "id" in form
          ? (positions.find((p) => p.id === form.id) as LivePosition | undefined)
          : undefined;
      try {
        if (existing) {
          await updatePosition({
            id: existing.id,
            body: toRequest(form, existing),
          }).unwrap();
          // An inactive position put back to filled or vacant is restored.
          if (existing.status === "inactive" && form.status !== "inactive") {
            await restorePosition(existing.id).unwrap();
          }
          toast.success("Position updated");
        } else {
          await createPosition(toRequest(form)).unwrap();
          toast.success("Position added");
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not save the position."));
      }
    },
    [positions, toRequest, createPosition, updatePosition, restorePosition],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deletePosition(id).unwrap();
        toast.success("Position deleted");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not delete the position."));
      }
    },
    [deletePosition],
  );

  /** Not on the approved screen yet; kept for when they are. */
  const retire = useCallback(
    (id: string) => retirePosition(id).unwrap(),
    [retirePosition],
  );
  const assign = useCallback(
    (id: string, employeeId: string) =>
      assignPosition({ id, body: { employeeId } }).unwrap(),
    [assignPosition],
  );
  const unassign = useCallback(
    (employeeId: string) => unassignPosition({ employeeId }).unwrap(),
    [unassignPosition],
  );

  return { save, remove, retire, assign, unassign };
}
