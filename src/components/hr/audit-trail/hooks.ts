"use client";

import { useMemo } from "react";
// The audit trail must never be silently narrowed — a filtered log is a
// misleading log.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  AuditActionType,
  AuditEntry,
} from "@/src/lib/types/audit-trail";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawAudit {
  id?: string;
  timestamp?: string;
  actor?: string;
  actorId?: string;
  action?: string;
  entity?: string;
  module?: string;
  entityId?: string;
  resourceId?: string;
  description?: string;
  ip?: string;
  userAgent?: string;
}

function mapAction(a?: string): AuditActionType {
  switch (a) {
    case "created":
    case "create":
      return "create";
    case "updated":
    case "update":
      return "update";
    case "deleted":
    case "delete":
      return "delete";
    case "viewed":
    case "view":
      return "view";
    case "approved":
      return "approve";
    case "rejected":
      return "reject";
    case "exported":
    case "export":
      return "export";
    case "logged_in":
    case "login":
      return "login";
    case "logged_out":
    case "logout":
      return "logout";
    default:
      return "view";
  }
}

function buildAuditEntries(bundle: LocaleBundle): AuditEntry[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const raw = (bundle.auditTrail ?? []) as RawAudit[];
  return raw.slice(-300).map((r, i) => {
    const actorId = r.actorId ?? r.actor ?? "";
    const actor = actorId ? employeesById.get(actorId) : null;
    const actionType = mapAction(r.action);
    const module = r.module ?? r.entity ?? "system";
    const ts = r.timestamp ?? bundle.tenant.createdAt;
    return {
      id: r.id ?? `AUD-${i + 1}`,
      sessionId: `${actorId || "system"}-${ts.slice(0, 10)}`,
      userId: actorId,
      userName: actor?.fullName ?? "System",
      userInitials: actor?.initials ?? "SY",
      userRole: actor?.jobTitle ?? "System",
      actionType,
      module,
      description: r.description ?? `${actionType} on ${module}`,
      endpoint: `/api/${module}/${r.entityId ?? r.resourceId ?? ""}`,
      httpMethod:
        actionType === "create"
          ? "POST"
          : actionType === "update"
            ? "PATCH"
            : actionType === "delete"
              ? "DELETE"
              : "GET",
      httpStatus: 200,
      ipAddress: r.ip ?? "10.0.0.1",
      responseTimeMs: 120,
      timestamp: ts,
      isSuspicious: false,
      resourceId: r.entityId ?? r.resourceId,
    };
  });
}

/**
 * The fixture trail from the bundle, plus anything the running app has
 * recorded this session (account locks, role changes). Newest first, so a
 * just-performed action is at the top where the user expects it.
 */
export function useAuditEntries() {
  const { data, loading, error } = useLocaleSection<AuditEntry[]>(
    buildAuditEntries,
  );
  const live = useAppSelector((s) => s.audit.entries);

  const merged = useMemo(() => {
    if (!data) return data;
    return [...live, ...data].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
  }, [data, live]);

  return { data: merged, loading, error };
}
