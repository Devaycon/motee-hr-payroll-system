import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type WorkforceUrgency = "low" | "medium" | "high" | "critical";

export interface WorkforceRequest {
  id: string;
  department: string;
  numberOfHires: number;
  reason: string;
  budgetEstimate: number;
  urgency: WorkforceUrgency;
  expectedStartDate: string;
  /** Base record status; pending/approved/rejected are derived from the approval request. */
  status: "draft" | "converted";
  approvalRequestId?: string;
  requisitionId?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

interface WorkforceRequestsState {
  byCountry: Record<string, WorkforceRequest[]>;
  status: "idle" | "ready";
}

const initialState: WorkforceRequestsState = { byCountry: {}, status: "idle" };

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Seed a couple of demo drafts so the module isn't empty on first load. */
export function seedWorkforceRequests(): WorkforceRequest[] {
  return [
    {
      id: "WFR-SEED-1",
      department: "Engineering",
      numberOfHires: 3,
      reason: "Scale the platform team for the Q3 product roadmap.",
      budgetEstimate: 24000000,
      urgency: "high",
      expectedStartDate: "2026-09-01",
      status: "draft",
      createdById: "",
      createdByName: "Line Manager",
      createdAt: "2026-06-01",
    },
    {
      id: "WFR-SEED-2",
      department: "Sales",
      numberOfHires: 2,
      reason: "Backfill two reps who exited and cover new territory.",
      budgetEstimate: 9000000,
      urgency: "medium",
      expectedStartDate: "2026-08-15",
      status: "draft",
      createdById: "",
      createdByName: "Line Manager",
      createdAt: "2026-06-01",
    },
  ];
}

const slice = createSlice({
  name: "workforceRequests",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{ byCountry: Record<string, WorkforceRequest[]> }>,
    ) {
      if (action.payload.byCountry) state.byCountry = action.payload.byCountry;
      state.status = "ready";
    },
    seedCountry(
      state,
      action: PayloadAction<{ country: string; requests: WorkforceRequest[] }>,
    ) {
      if (!state.byCountry[action.payload.country]) {
        state.byCountry[action.payload.country] = action.payload.requests;
      }
      state.status = "ready";
    },
    addRequest(
      state,
      action: PayloadAction<{ country: string; request: WorkforceRequest }>,
    ) {
      state.byCountry[action.payload.country]?.unshift(action.payload.request);
    },
    updateRequest(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        patch: Partial<WorkforceRequest>;
      }>,
    ) {
      const list = state.byCountry[action.payload.country];
      const r = list?.find((x) => x.id === action.payload.id);
      if (r) Object.assign(r, action.payload.patch);
    },
    setApproval(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        approvalRequestId: string;
      }>,
    ) {
      const list = state.byCountry[action.payload.country];
      const r = list?.find((x) => x.id === action.payload.id);
      if (r) r.approvalRequestId = action.payload.approvalRequestId;
    },
    markConverted(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        requisitionId: string;
      }>,
    ) {
      const list = state.byCountry[action.payload.country];
      const r = list?.find((x) => x.id === action.payload.id);
      if (r) {
        r.status = "converted";
        r.requisitionId = action.payload.requisitionId;
      }
    },
  },
});

export const {
  hydrate,
  seedCountry,
  addRequest,
  updateRequest,
  setApproval,
  markConverted,
} = slice.actions;

export default slice.reducer;
