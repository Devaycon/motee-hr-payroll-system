"use client";

import { useMemo } from "react";
import type { UserAccount } from "@/src/lib/types/users";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetUsersQuery } from "@/src/store/services/users";
import type { TenantUser } from "@/src/types/users";

function toAccount(user: TenantUser): UserAccount {
  const levelIds = user.accessLevels.map((level) => level.id);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleName: user.isOwner
      ? "Owner"
      : (user.accessLevels[0]?.name ?? "No role"),
    accessLevelId: levelIds[0] ?? "",
    accessLevelIds: levelIds,
    employeeId: user.employeeId ?? "",
    initials: user.initials,
    jobTitle: user.jobTitle ?? "",
    departmentName: user.departmentName ?? "—",
    state: user.state,
    lastLoginAt: user.lastLoginAt ?? undefined,
  };
}

/** §4.14 — user accounts, as the server holds them. */
export function useUserAccounts() {
  const { data, isLoading, error } = useGetUsersQuery();
  const accounts = useMemo<UserAccount[]>(
    () => data?.data?.map(toAccount) ?? [],
    [data],
  );
  return {
    accounts,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}
