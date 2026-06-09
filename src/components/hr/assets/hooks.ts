"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  Asset,
  AssetCondition,
  AssetStatus,
  AssetType,
} from "@/src/lib/types/assets";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawAsset {
  id?: string;
  assetTag?: string;
  name?: string;
  category?: string;
  type?: string;
  serial?: string;
  serialNumber?: string;
  condition?: string;
  status?: string;
  assignedTo?: string;
  assignedDate?: string;
  returnDate?: string;
  purchaseDate?: string;
  value?: number;
  purchaseValue?: number;
}

function mapType(s?: string): AssetType {
  if (!s) return "other";
  const lower = s.toLowerCase();
  if (lower.includes("laptop")) return "laptop";
  if (lower.includes("desktop")) return "desktop";
  if (lower.includes("monitor")) return "monitor";
  if (lower.includes("phone")) return "phone";
  if (lower.includes("tablet")) return "tablet";
  if (lower.includes("printer")) return "printer";
  if (lower.includes("keyboard")) return "keyboard";
  if (lower.includes("mouse")) return "mouse";
  if (lower.includes("headset")) return "headset";
  if (lower.includes("camera")) return "camera";
  return "other";
}

function mapStatus(s?: string): AssetStatus {
  if (s === "in-use" || s === "in_use" || s === "assigned") return "assigned";
  if (s === "maintenance" || s === "under_maintenance") return "under_maintenance";
  if (s === "retired" || s === "decommissioned") return "decommissioned";
  return "available";
}

function mapCondition(s?: string): AssetCondition {
  if (s === "new" || s === "good" || s === "fair" || s === "damaged" || s === "decommissioned") return s;
  return "good";
}

function buildAssets(bundle: LocaleBundle): Asset[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return ((bundle.assets ?? []) as RawAsset[]).map((raw, i) => {
    const id = raw.id ?? raw.assetTag ?? `AST-${String(i + 1).padStart(3, "0")}`;
    const emp = raw.assignedTo ? employeesById.get(raw.assignedTo) : null;
    const status = mapStatus(raw.status);
    return {
      id,
      name: raw.name ?? `Asset ${i + 1}`,
      assetType: mapType(raw.category ?? raw.type),
      serialNumber: raw.serialNumber ?? raw.serial ?? `SN-${i + 1}`,
      condition: mapCondition(raw.condition),
      status,
      assignedTo: emp?.fullName,
      assignedToInitials: emp?.initials,
      assignedToDepartment: emp?.departmentName,
      assignedDate: raw.assignedDate,
      purchaseDate: raw.purchaseDate,
      purchaseValue: raw.purchaseValue ?? raw.value,
      history: [
        {
          id: `H-${id}-1`,
          action: "created",
          date: raw.purchaseDate ?? bundle.tenant.createdAt.slice(0, 10),
          description: "Asset added to inventory.",
          performedBy: "IT Admin",
        },
      ],
    } satisfies Asset;
  });
}

export function useAssets() {
  return useLocaleSection<Asset[]>(buildAssets);
}
