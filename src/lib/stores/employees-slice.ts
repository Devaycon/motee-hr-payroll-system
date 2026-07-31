import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { EmployeeStatus } from "@/src/lib/types/employees";

/**
 * Employee lifecycle overrides layered on top of the locale bundle.
 *
 * The bundle is read-only fixture data, so every mutation the Employees table
 * offers (deactivate, exit, soft-delete, send credentials) is recorded here and
 * merged back in by `useEmployees()`. Persisted so the change survives a
 * refresh (client feedback §1.2/§1.3).
 */
interface EmployeesState {
  /** employeeId -> lifecycle status set by an HR action. */
  statusOverrides: Record<string, EmployeeStatus>;
  /** Soft-deleted employee ids — surfaced on the "Deleted" tab, recoverable. */
  deleted: string[];
  /** employeeId -> ISO timestamp of the last login-credentials send. */
  credentialsSentAt: Record<string, string>;
}

const initialState: EmployeesState = {
  statusOverrides: {},
  deleted: [],
  credentialsSentAt: {},
};

const employeesSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partial<EmployeesState>>) {
      const { statusOverrides, deleted, credentialsSentAt } = action.payload;
      if (statusOverrides) state.statusOverrides = statusOverrides;
      if (Array.isArray(deleted)) state.deleted = deleted;
      if (credentialsSentAt) state.credentialsSentAt = credentialsSentAt;
    },

    setEmployeeStatus(
      state,
      action: PayloadAction<{ employeeId: string; status: EmployeeStatus }>,
    ) {
      const { employeeId, status } = action.payload;
      state.statusOverrides[employeeId] = status;
      // Restoring to any live status also lifts a soft delete.
      if (status !== "deleted") {
        state.deleted = state.deleted.filter((id) => id !== employeeId);
      }
    },

    /** Drops the override so the employee falls back to their bundle status. */
    clearEmployeeStatus(state, action: PayloadAction<string>) {
      delete state.statusOverrides[action.payload];
    },

    softDeleteEmployee(state, action: PayloadAction<string>) {
      if (!state.deleted.includes(action.payload)) {
        state.deleted.push(action.payload);
      }
    },

    restoreEmployee(state, action: PayloadAction<string>) {
      state.deleted = state.deleted.filter((id) => id !== action.payload);
    },

    markCredentialsSent(state, action: PayloadAction<string>) {
      state.credentialsSentAt[action.payload] = new Date().toISOString();
    },
  },
});

export const {
  hydrate,
  setEmployeeStatus,
  clearEmployeeStatus,
  softDeleteEmployee,
  restoreEmployee,
  markCredentialsSent,
} = employeesSlice.actions;
export default employeesSlice.reducer;
export type { EmployeesState };
