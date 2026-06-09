import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type RequisitionLifecycle = "active" | "closed" | "on_hold";

export interface Requisition {
  id: string;
  /** Source approved workforce request. */
  workforceRequestId: string;
  /** Denormalised label of the source workforce (for display). */
  workforceLabel: string;
  title: string;
  jobDescription: string;
  department: string;
  location: string;
  numberOfPositions: number;
  salaryMin: number;
  salaryMax: number;
  qualifications: string;
  startDate: string;
  /** Duration in months for contract roles (optional). */
  durationMonths?: number;
  reportingManager: string;
  budgetAllocation: number;
  /** Base record status; pending/approved/rejected are derived from the approval request. */
  status: "draft" | "converted";
  /** Post-approval lifecycle shown on the Approved tab. */
  lifecycleStatus: RequisitionLifecycle;
  approvalRequestId?: string;
  /** Set when a recruitment is created from this requisition (Phase 2). */
  recruitmentId?: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

interface RequisitionsState {
  byCountry: Record<string, Requisition[]>;
  status: "idle" | "ready";
}

const initialState: RequisitionsState = { byCountry: {}, status: "idle" };

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const slice = createSlice({
  name: "requisitions",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{ byCountry: Record<string, Requisition[]> }>,
    ) {
      if (action.payload.byCountry) state.byCountry = action.payload.byCountry;
      state.status = "ready";
    },
    seedCountry(
      state,
      action: PayloadAction<{ country: string; requisitions: Requisition[] }>,
    ) {
      if (!state.byCountry[action.payload.country]) {
        state.byCountry[action.payload.country] = action.payload.requisitions;
      }
      state.status = "ready";
    },
    addRequest(
      state,
      action: PayloadAction<{ country: string; requisition: Requisition }>,
    ) {
      state.byCountry[action.payload.country]?.unshift(action.payload.requisition);
    },
    updateRequest(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        patch: Partial<Requisition>;
      }>,
    ) {
      const list = state.byCountry[action.payload.country];
      const r = list?.find((x) => x.id === action.payload.id);
      if (r) Object.assign(r, action.payload.patch);
    },
    removeRequest(
      state,
      action: PayloadAction<{ country: string; id: string }>,
    ) {
      const list = state.byCountry[action.payload.country];
      if (list) {
        state.byCountry[action.payload.country] = list.filter(
          (x) => x.id !== action.payload.id,
        );
      }
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
    setLifecycleStatus(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        lifecycleStatus: RequisitionLifecycle;
      }>,
    ) {
      const list = state.byCountry[action.payload.country];
      const r = list?.find((x) => x.id === action.payload.id);
      if (r) r.lifecycleStatus = action.payload.lifecycleStatus;
    },
    markConverted(
      state,
      action: PayloadAction<{
        country: string;
        id: string;
        recruitmentId: string;
      }>,
    ) {
      const list = state.byCountry[action.payload.country];
      const r = list?.find((x) => x.id === action.payload.id);
      if (r) {
        r.status = "converted";
        r.recruitmentId = action.payload.recruitmentId;
      }
    },
  },
});

export const {
  hydrate,
  seedCountry,
  addRequest,
  updateRequest,
  removeRequest,
  setApproval,
  setLifecycleStatus,
  markConverted,
} = slice.actions;

export default slice.reducer;
