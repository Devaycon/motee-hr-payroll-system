"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";

/**
 * The company's departments from the live bundle: names for the approved
 * forms and filters (which pick a department by name), and the ids the API
 * stores. Falls back to the given names until the bundle has loaded.
 */
export function useLiveDepartments(fallback: readonly string[] = []) {
  const departments = useAppSelector((s) => s.locale.data?.departments);
  return useMemo(() => {
    const idByName = new Map(
      (departments ?? []).map((d) => [d.name, d.id] as const),
    );
    const nameById = new Map(
      (departments ?? []).map((d) => [d.id, d.name] as const),
    );
    const names = idByName.size
      ? [...idByName.keys()].sort((a, b) => a.localeCompare(b))
      : [...fallback];
    return { names, idByName, nameById };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);
}
