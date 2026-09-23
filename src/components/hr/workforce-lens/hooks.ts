"use client";

import { useMemo } from "react";
import { useEmployees } from "@/src/components/hr/employees/hooks";
import { useDiversityReport } from "@/src/components/hr/headcount/use-diversity";
import {
  aggregateGroups,
  filterLensEmployees,
  groupEmployees,
  type LensDimension,
  type LensFilters,
  type LensGroup,
} from "@/src/lib/workforce-lens/group";
import type { SuppressedBreakdown } from "@/src/lib/types/diversity";

export interface WorkforceLensData {
  loading: boolean;
  /** People left after the filters — the denominator for every percentage. */
  total: number;
  groups: LensGroup[];
  /**
   * Whether this tenant collects ethnicity at all. Nigeria deliberately does
   * not (see lib/types/diversity), so the Ethnicity tab is hidden there.
   */
  ethnicityAvailable: boolean;
  /** The suppression detail behind the ethnicity columns, for the footnote. */
  ethnicity: SuppressedBreakdown | null;
}

/**
 * Employees → filtered → grouped. Rides on `useEmployees`, so the navbar
 * branch switcher and the viewer's data scope are already applied.
 */
export function useWorkforceLens(
  filters: LensFilters,
  dimension: LensDimension,
): WorkforceLensData {
  const { data, loading } = useEmployees();

  const filtered = useMemo(
    () => filterLensEmployees(data ?? [], filters),
    [data, filters],
  );

  // Ids only: declarations are counted, never paired with a name.
  const ids = useMemo(() => filtered.map((e) => e.id), [filtered]);
  const diversity = useDiversityReport(ids, ids.length);
  const ethnicity =
    diversity.breakdowns.find((b) => b.category.key === "ethnicity")
      ?.breakdown ?? null;

  const groups = useMemo(() => {
    if (dimension === "ethnicity") {
      return ethnicity ? aggregateGroups(ethnicity) : [];
    }
    return groupEmployees(filtered, dimension);
  }, [dimension, filtered, ethnicity]);

  return {
    loading: loading && !data,
    total: filtered.length,
    groups,
    ethnicityAvailable: ethnicity !== null,
    ethnicity,
  };
}
