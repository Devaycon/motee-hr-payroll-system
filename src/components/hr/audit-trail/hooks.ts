"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { AuditEntry } from "@/src/lib/types/audit-trail";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetRecentAuditEntriesQuery } from "@/src/store/services/collections";
import type { AuditEntryDto } from "@/src/types/audit-trail";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toAuditEntry(
  entry: AuditEntryDto,
  roleByEmployeeName: Map<string, string>,
): AuditEntry {
  const userName = entry.actorName ?? "System";
  const status = entry.httpStatus ?? 200;
  return {
    id: entry.id,
    sessionId: entry.correlationId ?? `${entry.actorUserId ?? "system"}-${entry.createdAt.slice(0, 10)}`,
    userId: entry.actorUserId ?? "",
    userName,
    userInitials: entry.actorName ? initialsOf(entry.actorName) : "SY",
    userRole: roleByEmployeeName.get(userName) ?? (entry.actorName ? "" : "System"),
    actionType: entry.action,
    module: entry.module,
    description: entry.description,
    endpoint: entry.endpoint ?? "",
    httpMethod:
      METHODS.find((m) => m === entry.httpMethod?.toUpperCase()) ?? "GET",
    httpStatus: status,
    ipAddress: entry.ipAddress ?? "",
    responseTimeMs: entry.durationMs ?? 0,
    timestamp: entry.createdAt,
    // A refused or failed request is what the log is there to surface.
    isSuspicious: status === 401 || status === 403,
    resourceId: entry.entityId ?? undefined,
  };
}

/** The organisation's recent audit trail, newest first. */
export function useAuditEntries() {
  const { data, isLoading, error } = useGetRecentAuditEntriesQuery();
  const employees = useAppSelector((s) => s.locale.data?.employees);

  const entries = useMemo(() => {
    if (!data) return null;
    const roleByEmployeeName = new Map(
      (employees ?? []).map((e) => [e.fullName, e.jobTitle]),
    );
    return data
      .map((entry) => toAuditEntry(entry, roleByEmployeeName))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [data, employees]);

  return {
    data: entries,
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}
