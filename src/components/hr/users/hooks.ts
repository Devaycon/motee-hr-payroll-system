"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
// User accounts and their roles are a tenant-wide administrative concern, not
// a per-branch one.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { UserAccount } from "@/src/lib/types/users";

/**
 * §4.14 — user accounts, built the same way `buildAuthUser` builds the signed-in
 * user: a locale role joined to its linked employee. The overrides slice is
 * layered on top, exactly as `useEmployees` layers lifecycle state.
 */
function buildAccounts(bundle: LocaleBundle) {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return bundle.roles.map((role) => {
    const employee = employeesById.get(role.linkedEmployeeId);
    return {
      id: role.id,
      name: employee?.fullName ?? role.name,
      email: role.credentials.email,
      roleName: role.name,
      accessLevelId: role.linkedAccessLevelId,
      accessLevelIds: [
        ...new Set(
          [
            role.linkedAccessLevelId,
            ...(role.additionalAccessLevelIds ?? []),
          ].filter(Boolean),
        ),
      ],
      employeeId: role.linkedEmployeeId,
      initials: employee?.initials ?? role.name.slice(0, 2).toUpperCase(),
      jobTitle: employee?.jobTitle ?? role.name,
      departmentName: employee?.departmentName ?? "—",
    };
  });
}

export function useUserAccounts() {
  const { data, loading, error } = useLocaleSection(buildAccounts);
  const overrides = useAppSelector((s) => s.users.overrides);

  const accounts = useMemo<UserAccount[]>(() => {
    if (!data) return [];
    return data.map((base) => {
      const override = overrides[base.id];
      return {
        ...base,
        // An account nobody has acted on is active — the absence of an
        // override is meaningful, not a gap to be filled in.
        state: override?.state ?? "active",
        reason: override?.reason,
        changedAt: override?.changedAt,
        changedBy: override?.changedBy,
        passwordResetAt: override?.passwordResetAt,
        mustChangePassword: override?.mustChangePassword,
        accessLevelIds: override?.accessLevelIds ?? base.accessLevelIds,
        accessLevelId:
          override?.accessLevelIds?.[0] ?? base.accessLevelId,
      };
    });
  }, [data, overrides]);

  return { accounts, loading, error };
}
