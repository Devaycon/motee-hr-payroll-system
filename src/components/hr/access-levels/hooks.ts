"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";

export function useAccessLevels() {
  return useAppSelector((s) => s.accessLevels.levels);
}

/** Role assignment audit trail, newest first (client feedback §1.6). */
export function useRoleAssignments() {
  return useAppSelector((s) => s.accessLevels.assignments);
}
