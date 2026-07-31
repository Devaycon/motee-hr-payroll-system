import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChangeRequest } from "@/src/lib/types/profile-edits";
import type { OverridesMap } from "@/src/lib/profile/overrides";

interface ProfileEditsState {
  overrides: OverridesMap; // employeeId -> { path: value }
  requests: ChangeRequest[];
  status: "idle" | "ready";
}

const initialState: ProfileEditsState = {
  overrides: {},
  requests: [],
  status: "ready",
};

function nowIso(): string {
  return new Date().toISOString();
}
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function setOverride(
  state: ProfileEditsState,
  employeeId: string,
  field: string,
  value: string,
) {
  if (!state.overrides[employeeId]) state.overrides[employeeId] = {};
  state.overrides[employeeId][field] = value;
}

interface ApplyEditPayload {
  employeeId: string;
  field: string;
  value: string;
}
interface RequestEditPayload {
  employeeId: string;
  field: string;
  label: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  requestedBy: string;
  /** Requester's system id, so the change log can link to their profile. */
  requestedById?: string;
}

/** Who decided a request. `actorId` links the log entry to a real profile. */
interface DecisionPayload {
  id: string;
  actorName: string;
  actorId?: string;
}

const profileEditsSlice = createSlice({
  name: "profileEdits",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{ overrides?: OverridesMap; requests?: ChangeRequest[] }>,
    ) {
      const { overrides, requests } = action.payload;
      if (overrides) state.overrides = overrides;
      if (Array.isArray(requests)) state.requests = requests;
      state.status = "ready";
    },

    // HR direct edit — applies immediately.
    applyEdit(state, action: PayloadAction<ApplyEditPayload>) {
      const { employeeId, field, value } = action.payload;
      setOverride(state, employeeId, field, value);
    },

    /**
     * Adds demo history for an employee who has none. Keyed on the employee
     * rather than a global flag, so seeding one profile can't suppress another,
     * and re-seeding an employee who already has entries is a no-op.
     */
    seedRequests(state, action: PayloadAction<ChangeRequest[]>) {
      const incoming = action.payload;
      if (incoming.length === 0) return;
      const employeeId = incoming[0].employeeId;
      if (state.requests.some((r) => r.employeeId === employeeId)) return;
      state.requests.push(...incoming);
    },

    // Employee-submitted change request — pending HR review.
    requestEdit(state, action: PayloadAction<RequestEditPayload>) {
      state.requests.unshift({
        id: uid("CR"),
        status: "pending",
        requestedAt: nowIso(),
        ...action.payload,
      });
    },

    approveRequest(state, action: PayloadAction<DecisionPayload>) {
      const req = state.requests.find((r) => r.id === action.payload.id);
      if (!req || req.status !== "pending") return;
      req.status = "approved";
      req.decidedBy = action.payload.actorName;
      req.decidedById = action.payload.actorId;
      req.decidedAt = nowIso();
      setOverride(state, req.employeeId, req.field, req.requestedValue);
    },

    rejectRequest(
      state,
      action: PayloadAction<DecisionPayload & { note?: string }>,
    ) {
      const req = state.requests.find((r) => r.id === action.payload.id);
      if (!req || req.status !== "pending") return;
      req.status = "rejected";
      req.decidedBy = action.payload.actorName;
      req.decidedById = action.payload.actorId;
      req.decidedAt = nowIso();
      req.decisionNote = action.payload.note;
    },

    cancelRequest(state, action: PayloadAction<string>) {
      state.requests = state.requests.filter((r) => r.id !== action.payload);
    },
  },
});

export const {
  hydrate,
  seedRequests,
  applyEdit,
  requestEdit,
  approveRequest,
  rejectRequest,
  cancelRequest,
} = profileEditsSlice.actions;
export default profileEditsSlice.reducer;
