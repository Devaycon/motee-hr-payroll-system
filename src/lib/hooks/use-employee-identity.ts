"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleEmployee } from "@/src/lib/types/locale";

export interface EmployeeIdentity {
  /** Internal record key, e.g. "NG-EMP-0001". Labelled "System ID" in the UI. */
  systemId: string;
  /** HR-facing staff number, e.g. "NG1001". Labelled "Employee ID" in the UI. */
  employeeId: string;
  name: string;
}

export interface EmployeeIdentityIndex {
  bySystemId: Map<string, EmployeeIdentity>;
  /** Keyed by lowercased full name. */
  byName: Map<string, EmployeeIdentity>;
  /** Resolves a system id first, then falls back to a display-name match. */
  resolve: (idOrName?: string | null) => EmployeeIdentity | null;
  loading: boolean;
}

const EMPTY: LocaleEmployee[] = [];

/**
 * Both identifiers for every employee, addressable by system id *or* by name.
 *
 * Most module records (attendance, performance, learning, contracts, …) carry
 * only an `employeeName`, and the ones that do carry an id carry the *system*
 * id — none of them carry the employee number. Rather than thread a new field
 * through a dozen hooks, lists resolve identifiers at render time through this
 * index. It reads the same locale bundle as `useEmployees()` but skips the
 * manager / direct-report / offboarding joins, so it is cheap enough to call
 * from leaf tables.
 */
export function useEmployeeIdentity(): EmployeeIdentityIndex {
  const { data, loading } = useLocaleSection<LocaleEmployee[]>(
    (b) => b.employees,
  );

  return useMemo(() => {
    const bySystemId = new Map<string, EmployeeIdentity>();
    const byName = new Map<string, EmployeeIdentity>();

    for (const e of data ?? EMPTY) {
      const identity: EmployeeIdentity = {
        systemId: e.id,
        employeeId: e.employeeNumber,
        name: e.fullName,
      };
      bySystemId.set(e.id, identity);
      // Duplicate names keep the first match — an ambiguous name is exactly why
      // these lists are getting ID columns in the first place.
      const key = e.fullName.trim().toLowerCase();
      if (!byName.has(key)) byName.set(key, identity);
    }

    const resolve = (idOrName?: string | null): EmployeeIdentity | null => {
      if (!idOrName) return null;
      return (
        bySystemId.get(idOrName) ??
        byName.get(idOrName.trim().toLowerCase()) ??
        null
      );
    };

    return { bySystemId, byName, resolve, loading };
  }, [data, loading]);
}
