"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  Asset,
  AssetCondition,
  AssetHistoryEntry,
  AssetStatus,
  AssetType,
  NewAsset,
} from "@/src/lib/types/assets";
import { getApiErrorMessage } from "@/src/lib/utils";
import { assetSchema } from "@/src/lib/validations/assets";
import {
  useAssignAssetMutation,
  useChangeAssetStatusMutation,
  useCreateAssetMutation,
  useGetAssetHistoryQuery,
  useGetAssetQuery,
  useReturnAssetMutation,
  useUpdateAssetMutation,
} from "@/src/store/services/assets";
import { useGetAssetInventoryQuery } from "@/src/store/services/collections";
import type {
  AssetAssignmentDto,
  AssetDto,
  AssetStatus as ApiAssetStatus,
} from "@/src/types/assets";

function mapType(category?: string | null): AssetType {
  const lower = (category ?? "").toLowerCase();
  const known: AssetType[] = [
    "laptop",
    "desktop",
    "monitor",
    "phone",
    "tablet",
    "printer",
    "keyboard",
    "mouse",
    "headset",
    "camera",
  ];
  return known.find((type) => lower.includes(type)) ?? "other";
}

// The API tracks a lost asset where the screens had "under maintenance", and
// calls a decommissioned one "retired".
const STATUS_FROM_API: Record<ApiAssetStatus, AssetStatus> = {
  available: "available",
  assigned: "assigned",
  lost: "under_maintenance",
  retired: "decommissioned",
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const today = () => new Date().toISOString().slice(0, 10);

export function useAssets() {
  const { data, isLoading, error } = useGetAssetInventoryQuery();
  const employees = useAppSelector((s) => s.locale.data?.employees);

  const assets = useMemo<Asset[] | null>(() => {
    if (!data) return null;
    const departmentById = new Map(
      (employees ?? []).map((e) => [e.id, e.departmentName]),
    );
    return data.map((asset) => ({
      id: asset.id,
      name: asset.name,
      assetType: mapType(asset.category),
      serialNumber: asset.serialNumber ?? asset.tag,
      // Condition is recorded per assignment on the API, not on the asset.
      condition: asset.status === "retired" ? "decommissioned" : "good",
      conditionNotes: asset.notes ?? undefined,
      status: STATUS_FROM_API[asset.status],
      assignedToId: asset.assignedToEmployeeId ?? undefined,
      assignedTo: asset.assignedToName ?? undefined,
      assignedToInitials: asset.assignedToName
        ? initialsOf(asset.assignedToName)
        : undefined,
      assignedToDepartment: asset.assignedToEmployeeId
        ? departmentById.get(asset.assignedToEmployeeId)
        : undefined,
      assignedDate: asset.assignedDate ?? undefined,
      history: [
        {
          id: `H-${asset.id}-created`,
          action: "created",
          date: asset.createdAt.slice(0, 10),
          description: "Asset added to inventory.",
          performedBy: "—",
        },
      ],
    }));
  }, [data, employees]);

  return {
    data: assets,
    /** The raw records, for the fields the screens do not carry (the tag). */
    records: data ?? [],
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

function toHistory(entry: AssetAssignmentDto): AssetHistoryEntry[] {
  const assigned: AssetHistoryEntry = {
    id: `${entry.id}-assigned`,
    action: "assigned",
    date: entry.assignedOn,
    description: `Assigned to ${entry.employeeName}${
      entry.conditionOnAssign ? ` (${entry.conditionOnAssign})` : ""
    }.`,
    performedBy: "—",
  };
  if (!entry.returnedOn) return [assigned];
  return [
    assigned,
    {
      id: `${entry.id}-returned`,
      action: "returned",
      date: entry.returnedOn,
      description: `Returned by ${entry.employeeName}${
        entry.returnReason ? `. ${entry.returnReason}` : "."
      }`,
      performedBy: "—",
      newValue: entry.conditionOnReturn ?? undefined,
    },
  ];
}

/** An asset with its assignment history joined on, for the detail view. */
export function useAssetWithHistory(asset: Asset | null): Asset | null {
  const { data } = useGetAssetHistoryQuery(asset?.id ?? "", { skip: !asset });
  // Read on open, so a change made elsewhere since the list loaded shows.
  const { data: fresh } = useGetAssetQuery(asset?.id ?? "", { skip: !asset });
  return useMemo(() => {
    if (!asset) return null;
    const latest = fresh?.data;
    const entries = (data?.data ?? []).flatMap(toHistory);
    return {
      ...asset,
      ...(latest
        ? {
            name: latest.name,
            status: STATUS_FROM_API[latest.status],
            conditionNotes: latest.notes ?? undefined,
            assignedTo: latest.assignedToName ?? undefined,
            assignedDate: latest.assignedDate ?? undefined,
          }
        : {}),
      history: [...asset.history, ...entries].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    };
  }, [asset, data, fresh]);
}

export function useAssetActions(records: AssetDto[]) {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  const [createAsset] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const [assignAsset] = useAssignAssetMutation();
  const [returnAsset] = useReturnAssetMutation();
  const [changeStatus] = useChangeAssetStatusMutation();

  const report = (err: unknown, fallback: string) =>
    toast.error(getApiErrorMessage(err, fallback));

  const findEmployeeId = useCallback(
    (name?: string) =>
      name
        ? employees?.find(
            (e) => e.fullName.toLowerCase() === name.trim().toLowerCase(),
          )?.id
        : undefined,
    [employees],
  );

  /** Create or edit. Returns true when saved. */
  const save = useCallback(
    async (data: NewAsset, editingId?: string): Promise<boolean> => {
      const existing = records.find((r) => r.id === editingId);
      const parsed = assetSchema.safeParse({
        // The screens have no tag field; a new asset is tagged by its serial.
        tag: existing?.tag ?? (data.serialNumber || `AST-${Date.now()}`),
        name: data.name,
        category: data.assetType,
        serialNumber: data.serialNumber || null,
        notes: data.conditionNotes || null,
        assignedDate: data.assignedDate || null,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return false;
      }
      try {
        if (existing) {
          await updateAsset({ id: existing.id, body: parsed.data }).unwrap();
          toast.success(`${data.name} updated`);
          return true;
        }
        const created = (await createAsset(parsed.data).unwrap()).data;
        const employeeId = data.assignedToId ?? findEmployeeId(data.assignedTo);
        if (data.status === "assigned" && employeeId) {
          await assignAsset({
            id: created.id,
            body: {
              employeeId,
              assignedDate: data.assignedDate || null,
              condition: data.condition,
            },
          }).unwrap();
        }
        toast.success(`${data.name} added to inventory`);
        return true;
      } catch (err) {
        report(err, "Could not save the asset.");
        return false;
      }
    },
    [records, createAsset, updateAsset, assignAsset, findEmployeeId],
  );

  const assign = useCallback(
    async (id: string, employeeName: string, assignedDate: string) => {
      const employeeId = findEmployeeId(employeeName);
      if (!employeeId) {
        toast.error(`No employee named "${employeeName}"`);
        return false;
      }
      try {
        await assignAsset({
          id,
          body: { employeeId, assignedDate: assignedDate || today() },
        }).unwrap();
        toast.success(`Assigned to ${employeeName}`);
        return true;
      } catch (err) {
        report(err, "Could not assign the asset.");
        return false;
      }
    },
    [assignAsset, findEmployeeId],
  );

  const giveBack = useCallback(
    async (id: string, condition?: AssetCondition, notes?: string) => {
      try {
        await returnAsset({
          id,
          body: {
            returnedOn: today(),
            reason: notes || null,
            condition: condition ?? null,
          },
        }).unwrap();
        toast.success("Asset returned");
        return true;
      } catch (err) {
        report(err, "Could not record the return.");
        return false;
      }
    },
    [returnAsset],
  );

  const setStatus = useCallback(
    async (id: string, status: ApiAssetStatus, done: string) => {
      try {
        await changeStatus({ id, body: { status } }).unwrap();
        toast.success(done);
      } catch (err) {
        report(err, "Could not change the asset status.");
      }
    },
    [changeStatus],
  );

  return { save, assign, giveBack, setStatus };
}
