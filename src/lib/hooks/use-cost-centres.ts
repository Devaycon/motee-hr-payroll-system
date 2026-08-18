"use client";

import { useLocaleSection } from "./use-locale-data";
import {
  DEFAULT_COST_CENTRES,
  type CostCentre,
} from "@/src/lib/types/cost-centres";
import type { LocaleBundle } from "@/src/lib/types/locale";

/**
 * Cost centres for the active tenant (client feedback §7.4).
 *
 * Built from each department's `costCenter` code — the locale bundles have
 * carried that field all along but nothing surfaced it. Departments without a
 * code fall back to the client's §7.3 mapping so the dropdown is never empty.
 */
function buildCostCentres(bundle: LocaleBundle): CostCentre[] {
  const fromDepartments: CostCentre[] = bundle.departments
    .filter((d) => d.costCenter)
    .map((d) => ({
      id: `cc-${d.id}`,
      code: d.costCenter,
      name: d.name,
      // No business-unit field on the bundle yet; the department's parent is
      // the closest honest stand-in.
      businessUnit:
        bundle.departments.find((p) => p.id === d.parentDepartmentId)?.name ??
        "Corporate Services",
      status: "active" as const,
      departmentId: d.id,
    }));

  if (fromDepartments.length > 0) {
    // Keep any seeded centre whose code isn't already covered.
    const codes = new Set(fromDepartments.map((c) => c.code));
    return [
      ...fromDepartments,
      ...DEFAULT_COST_CENTRES.filter((c) => !codes.has(c.code)),
    ];
  }
  return DEFAULT_COST_CENTRES;
}

export function useCostCentres(): CostCentre[] {
  const { data } = useLocaleSection<CostCentre[]>(buildCostCentres);
  return data ?? DEFAULT_COST_CENTRES;
}
