import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  LeaveBalance,
  LeaveHistoryEntry,
  LeavePolicy,
  LeaveRequest,
  LeaveStatus,
} from "@/src/lib/types/leave";

/**
 * Leave requests used to live in component `useState`, so every approval,
 * rejection and stage transition was lost on refresh and the audit trail the
 * client asked for (§F3/F4) had nowhere durable to live. This slice mirrors the
 * profile-edits / approvals pattern: seeded from the locale bundle, then
 * mutated here and persisted by `leave-persistence`.
 */
interface LeaveState {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  policies: LeavePolicy[];
  /** True once seeded from the locale bundle, so we don't reseed over edits. */
  seeded: boolean;
  status: "idle" | "ready";
}

const initialState: LeaveState = {
  requests: [],
  balances: [],
  policies: [],
  seeded: false,
  status: "idle",
};

function nowIso(): string {
  return new Date().toISOString();
}
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function pushHistory(
  req: LeaveRequest,
  entry: Omit<LeaveHistoryEntry, "id" | "at"> & { at?: string },
) {
  if (!req.history) req.history = [];
  req.history.push({
    id: uid("LH"),
    at: entry.at ?? nowIso(),
    action: entry.action,
    actor: entry.actor,
    toStatus: entry.toStatus,
    comment: entry.comment,
  });
  req.updatedAt = nowIso();
}

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    /** Restores a persisted snapshot. */
    hydrate(state, action: PayloadAction<Partial<LeaveState>>) {
      const { requests, balances, policies, seeded } = action.payload;
      if (Array.isArray(requests)) state.requests = requests;
      if (Array.isArray(balances)) state.balances = balances;
      if (Array.isArray(policies)) state.policies = policies;
      if (typeof seeded === "boolean") state.seeded = seeded;
      state.status = "ready";
    },

    /** First-run seed from the locale bundle; ignored once the user has edited. */
    seed(
      state,
      action: PayloadAction<{
        requests: LeaveRequest[];
        balances: LeaveBalance[];
        policies: LeavePolicy[];
      }>,
    ) {
      if (state.seeded) return;
      state.requests = action.payload.requests;
      state.balances = action.payload.balances;
      state.policies = action.payload.policies;
      state.seeded = true;
      state.status = "ready";
    },

    /** Replaces seeded rows when the tenant/locale switches. */
    reseed(
      state,
      action: PayloadAction<{
        requests: LeaveRequest[];
        balances: LeaveBalance[];
        policies: LeavePolicy[];
      }>,
    ) {
      state.requests = action.payload.requests;
      state.balances = action.payload.balances;
      state.policies = action.payload.policies;
      state.seeded = true;
      state.status = "ready";
    },

    addRequest(
      state,
      action: PayloadAction<{ request: LeaveRequest; actor: string }>,
    ) {
      const { request, actor } = action.payload;
      const req: LeaveRequest = {
        ...request,
        createdAt: request.createdAt ?? nowIso(),
        updatedAt: nowIso(),
        history: request.history ?? [],
      };
      pushHistory(req, {
        action: "Submitted",
        actor,
        toStatus: req.status,
      });
      state.requests.unshift(req);
    },

    addRequests(
      state,
      action: PayloadAction<{ requests: LeaveRequest[]; actor: string; source?: string }>,
    ) {
      const { requests, actor, source } = action.payload;
      const stamped = requests.map((r) => {
        const req: LeaveRequest = {
          ...r,
          createdAt: r.createdAt ?? nowIso(),
          updatedAt: nowIso(),
          history: r.history ?? [],
        };
        pushHistory(req, {
          action: source ? `Imported (${source})` : "Imported",
          actor,
          toStatus: req.status,
        });
        return req;
      });
      state.requests.unshift(...stamped);
    },

    updateRequest(
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<LeaveRequest>;
        actor: string;
      }>,
    ) {
      const req = state.requests.find((r) => r.id === action.payload.id);
      if (!req) return;
      Object.assign(req, action.payload.changes);
      pushHistory(req, { action: "Edited", actor: action.payload.actor });
    },

    /**
     * Advances a request to the next stage. `toStatus` comes from the active
     * approval chain, so the slice stays agnostic about how many stages exist.
     */
    advanceRequest(
      state,
      action: PayloadAction<{
        id: string;
        toStatus: LeaveStatus;
        actor: string;
        stageLabel?: string;
        comment?: string;
      }>,
    ) {
      const { id, toStatus, actor, stageLabel, comment } = action.payload;
      const req = state.requests.find((r) => r.id === id);
      if (!req) return;
      req.status = toStatus;
      if (toStatus === "approved") {
        req.approvedAt = nowIso();
        req.approvedBy = actor;
      }
      pushHistory(req, {
        action:
          toStatus === "approved"
            ? "Approved"
            : stageLabel
              ? `${stageLabel} cleared`
              : "Advanced",
        actor,
        toStatus,
        comment,
      });
    },

    rejectRequest(
      state,
      action: PayloadAction<{ id: string; actor: string; reason: string }>,
    ) {
      const req = state.requests.find((r) => r.id === action.payload.id);
      if (!req) return;
      req.status = "rejected";
      req.rejectionReason = action.payload.reason;
      pushHistory(req, {
        action: "Rejected",
        actor: action.payload.actor,
        toStatus: "rejected",
        comment: action.payload.reason,
      });
    },

    cancelRequest(
      state,
      action: PayloadAction<{ id: string; actor: string; reason?: string }>,
    ) {
      const req = state.requests.find((r) => r.id === action.payload.id);
      if (!req) return;
      req.status = "cancelled";
      req.cancelledAt = nowIso();
      req.cancelledBy = action.payload.actor;
      pushHistory(req, {
        action: "Cancelled",
        actor: action.payload.actor,
        toStatus: "cancelled",
        comment: action.payload.reason,
      });
    },

    commentOnRequest(
      state,
      action: PayloadAction<{ id: string; actor: string; comment: string }>,
    ) {
      const req = state.requests.find((r) => r.id === action.payload.id);
      if (!req) return;
      pushHistory(req, {
        action: "Commented",
        actor: action.payload.actor,
        comment: action.payload.comment,
      });
    },

    // ── policies ────────────────────────────────────────────────────────────
    addPolicy(state, action: PayloadAction<LeavePolicy>) {
      state.policies.push(action.payload);
    },
    updatePolicy(
      state,
      action: PayloadAction<{ id: string; changes: Partial<LeavePolicy> }>,
    ) {
      const p = state.policies.find((x) => x.id === action.payload.id);
      if (p) Object.assign(p, action.payload.changes);
    },
    deletePolicy(state, action: PayloadAction<string>) {
      state.policies = state.policies.filter((p) => p.id !== action.payload);
    },

    // ── balances ────────────────────────────────────────────────────────────
    adjustBalance(
      state,
      action: PayloadAction<{ id: string; delta: number }>,
    ) {
      const b = state.balances.find((x) => x.id === action.payload.id);
      if (!b) return;
      b.adjustments = (b.adjustments ?? 0) + action.payload.delta;
      b.totalEntitlement += action.payload.delta;
    },
  },
});

export const {
  hydrate,
  seed,
  reseed,
  addRequest,
  addRequests,
  updateRequest,
  advanceRequest,
  rejectRequest,
  cancelRequest,
  commentOnRequest,
  addPolicy,
  updatePolicy,
  deletePolicy,
  adjustBalance,
} = leaveSlice.actions;

export default leaveSlice.reducer;
