import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DEFAULT_DEDUCTION_POLICY,
  type DeductionPolicy,
} from "@/src/lib/types/attendance";

/**
 * Demo-scoped attendance deduction policy — a single tenant-wide config, not
 * per-country like `workforce-requests-slice.ts`, since a grace period and a
 * late/absence/early-departure deduction model apply the same way regardless
 * of locale. See `DeductionPolicy` in `lib/types/attendance.ts` for the shape
 * and the "not wired to a real payroll run" caveat.
 */
interface AttendanceDeductionPolicyState {
  policy: DeductionPolicy;
  status: "idle" | "ready";
}

const initialState: AttendanceDeductionPolicyState = {
  policy: DEFAULT_DEDUCTION_POLICY,
  status: "idle",
};

const slice = createSlice({
  name: "attendanceDeductionPolicy",
  initialState,
  reducers: {
    /** Restores a persisted snapshot. Missing fields fall back to the default. */
    hydrate(state, action: PayloadAction<{ policy?: Partial<DeductionPolicy> }>) {
      if (action.payload.policy) {
        state.policy = { ...DEFAULT_DEDUCTION_POLICY, ...action.payload.policy };
      }
      state.status = "ready";
    },

    updatePolicy(
      state,
      action: PayloadAction<Partial<DeductionPolicy> & { updatedBy: string }>,
    ) {
      const { updatedBy, ...changes } = action.payload;
      state.policy = {
        ...state.policy,
        ...changes,
        updatedAt: new Date().toISOString(),
        updatedBy,
      };
      state.status = "ready";
    },
  },
});

export const { hydrate, updatePolicy } = slice.actions;
export default slice.reducer;
export type { AttendanceDeductionPolicyState };
