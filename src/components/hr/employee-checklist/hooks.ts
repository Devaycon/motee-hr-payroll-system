"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  checklistHireFromApi,
  checklistItemFromApi,
  checklistItemToApi,
} from "@/src/lib/employee-checklist/api-mapping";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  ChecklistItem,
  NewChecklistItem,
  NewHire,
} from "@/src/lib/types/employee-checklist";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetAllChecklistHiresQuery } from "@/src/store/services/collections";
import {
  useCompleteChecklistTaskMutation,
  useCreateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useGetChecklistItemsQuery,
  useGetEmployeeChecklistQuery,
  useGetMyChecklistQuery,
  useMoveChecklistItemMutation,
  useRestoreChecklistItemMutation,
  useRetireChecklistItemMutation,
  useUncompleteChecklistTaskMutation,
  useUpdateChecklistItemMutation,
} from "@/src/store/services/employee-checklist";
import type { ChecklistItemDto } from "@/src/types/employee-checklist";

interface ChecklistData {
  items: ChecklistItem[];
  hires: NewHire[];
}

export function useEmployeeChecklist() {
  const items = useGetChecklistItemsQuery({ includeRetired: false });
  const hires = useGetAllChecklistHiresQuery();
  const data = useMemo<ChecklistData | null>(() => {
    if (!items.data?.data) return null;
    return {
      items: [...items.data.data]
        .sort((a, b) => a.sequence - b.sequence)
        .map(checklistItemFromApi),
      hires: (hires.data ?? []).map((h) => checklistHireFromApi(h)),
    };
  }, [items.data, hires.data]);
  return {
    data,
    loading: items.isLoading || hires.isLoading,
    error: items.error ? getApiErrorMessage(items.error) : null,
  };
}

/**
 * One employee's checklist with each task's state. The signed-in employee
 * reads their own through `/employee-checklist/me`.
 */
export function useEmployeeChecklistFor(employeeId: string | undefined) {
  const myId = useAppSelector((s) => s.auth.user?.employeeId);
  const self = !!employeeId && employeeId === myId;
  const mine = useGetMyChecklistQuery(undefined, { skip: !self });
  const theirs = useGetEmployeeChecklistQuery(employeeId ?? "", {
    skip: !employeeId || self,
  });
  const query = self ? mine : theirs;
  return useMemo(() => {
    const dto = query.data?.data;
    if (!dto) return null;
    return {
      hire: checklistHireFromApi(dto.hire, dto.tasks),
      tasks: dto.tasks,
    };
  }, [query.data]);
}

export function useChecklistActions(items: ChecklistItem[]) {
  const raw = useGetChecklistItemsQuery({ includeRetired: false }).data?.data;
  const byId = useMemo(
    () => new Map<string, ChecklistItemDto>((raw ?? []).map((d) => [d.id, d])),
    [raw],
  );
  const [createItem] = useCreateChecklistItemMutation();
  const [updateItem] = useUpdateChecklistItemMutation();
  const [deleteItem] = useDeleteChecklistItemMutation();
  const [retireItem] = useRetireChecklistItemMutation();
  const [restoreItem] = useRestoreChecklistItemMutation();
  const [moveItem] = useMoveChecklistItemMutation();
  const [complete] = useCompleteChecklistTaskMutation();
  const [uncomplete] = useUncompleteChecklistTaskMutation();

  const fail = (err: unknown, fallback: string) =>
    toast.error(getApiErrorMessage(err, fallback));

  const save = useCallback(
    async (item: NewChecklistItem | ChecklistItem) => {
      const existing = "id" in item ? items.find((i) => i.id === item.id) : undefined;
      try {
        if (existing) {
          await updateItem({ id: existing.id, body: checklistItemToApi(item) }).unwrap();
          toast.success("Checklist item updated");
        } else {
          await createItem(checklistItemToApi(item)).unwrap();
          toast.success("Checklist item added");
        }
      } catch (err) {
        fail(err, "Could not save the checklist item.");
      }
    },
    [items, createItem, updateItem],
  );

  /**
   * A task new hires have already ticked off cannot be deleted without losing
   * their history, so the server only lets it be retired from the template.
   */
  const remove = useCallback(
    async (id: string) => {
      const dto = byId.get(id);
      try {
        if (dto && !dto.canDelete) {
          await retireItem(id).unwrap();
          toast.success("Checklist item retired", {
            description: `It is kept on the ${dto.completions} record${dto.completions === 1 ? "" : "s"} that already completed it.`,
          });
        } else {
          await deleteItem(id).unwrap();
          toast.success("Checklist item deleted");
        }
      } catch (err) {
        fail(err, "Could not remove the checklist item.");
      }
    },
    [byId, retireItem, deleteItem],
  );

  const move = useCallback(
    async (id: string, up: boolean) => {
      try {
        await moveItem({ id, body: { up } }).unwrap();
      } catch (err) {
        fail(err, "Could not reorder the checklist.");
      }
    },
    [moveItem],
  );

  /** Ticks a task off (or back on) for one new hire. */
  const setTaskDone = useCallback(
    async (employeeId: string, itemId: string, done: boolean, note?: string) => {
      try {
        if (done) {
          await complete({
            employeeId,
            itemId,
            body: { completedOn: new Date().toISOString().slice(0, 10), note: note ?? null },
          }).unwrap();
        } else {
          await uncomplete({ employeeId, itemId }).unwrap();
        }
        return true;
      } catch (err) {
        fail(err, "Could not update the task.");
        return false;
      }
    },
    [complete, uncomplete],
  );

  /** Not on the approved screen yet; kept for when it is. */
  const restore = useCallback((id: string) => restoreItem(id).unwrap(), [restoreItem]);

  return { save, remove, move, setTaskDone, restore };
}
