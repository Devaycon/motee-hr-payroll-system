import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuditEntry, AuditActionType } from "@/src/lib/types/audit-trail";

/**
 * Audit entries raised by the running app, layered over the read-only trail in
 * the locale bundle.
 *
 * The Audit Trail page could previously only show fixture history: an action
 * taken in the app — locking an account, revoking access — left no trace,
 * which defeats the purpose of having the module. Administrative actions are
 * exactly the ones that need a record.
 */
interface AuditState {
  /** Newest first. */
  entries: AuditEntry[];
}

const initialState: AuditState = {
  entries: [],
};

export interface RecordAuditPayload {
  actorName: string;
  actorId?: string;
  actionType: AuditActionType;
  /** Permission module id, e.g. "admin.users". */
  module: string;
  description: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const METHOD_BY_ACTION: Partial<Record<AuditActionType, AuditEntry["httpMethod"]>> =
  {
    create: "POST",
    update: "PATCH",
    delete: "DELETE",
  };

const auditSlice = createSlice({
  name: "audit",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<AuditEntry[]>) {
      if (Array.isArray(action.payload)) state.entries = action.payload;
    },

    addAuditEntry(state, action: PayloadAction<RecordAuditPayload>) {
      const p = action.payload;
      const timestamp = new Date().toISOString();
      state.entries.unshift({
        id: `AUD-LIVE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sessionId: `${p.actorId ?? "session"}-${timestamp.slice(0, 10)}`,
        userId: p.actorId ?? "",
        userName: p.actorName,
        userInitials: initialsOf(p.actorName),
        userRole: "Administrator",
        actionType: p.actionType,
        module: p.module,
        description: p.description,
        endpoint: `/api/${p.module.replace(".", "/")}/${p.resourceId ?? ""}`,
        httpMethod: METHOD_BY_ACTION[p.actionType] ?? "GET",
        httpStatus: 200,
        ipAddress: "10.0.0.1",
        responseTimeMs: 0,
        timestamp,
        isSuspicious: false,
        resourceId: p.resourceId,
        metadata: p.metadata,
      });
      // The trail is a demo store, not a compliance archive — cap it so a long
      // session can't fill localStorage.
      if (state.entries.length > 500) state.entries.length = 500;
    },
  },
});

export const { hydrate, addAuditEntry } = auditSlice.actions;
export default auditSlice.reducer;
export type { AuditState };
