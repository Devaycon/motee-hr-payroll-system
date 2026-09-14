import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ClearanceItem, OffboardingRecord } from "@/src/lib/types/offboarding";

/**
 * Offboarding pipeline state (client feedback §2).
 *
 * Previously the pipeline lived in local `useState` on the Offboarding page,
 * so a record vanished on navigation and the Employees table had no way to see
 * who was serving notice. It now lives here, seeded once from the locale
 * bundle and persisted, so both tables read the same records.
 */
interface OffboardingState {
  records: OffboardingRecord[];
  /** True once the locale bundle has seeded the list, so it isn't reseeded. */
  seeded: boolean;
}

const initialState: OffboardingState = {
  records: [],
  seeded: false,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function find(state: OffboardingState, id: string) {
  return state.records.find((r) => r.id === id);
}

function isExitInterviewClearanceItem(item: ClearanceItem): boolean {
  return item.label.toLowerCase().includes("exit interview");
}

/**
 * An approved exit moves into `in_progress` as soon as clearance starts, and
 * to `completed` once every checklist step plus the exit interview are done.
 * Shared by `toggleClearanceItem` and `updateExitInterview` so both entry
 * points into "is the exit interview done" resolve status the same way.
 */
function recomputeOffboardingStatus(record: OffboardingRecord) {
  const allDone = record.clearanceItems.every((c) => c.completed);
  if (allDone && record.exitInterviewCompleted) {
    record.status = "completed";
  } else if (record.status === "approved") {
    record.status = "in_progress";
  }
}

const offboardingSlice = createSlice({
  name: "offboarding",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partial<OffboardingState>>) {
      if (Array.isArray(action.payload.records)) {
        state.records = action.payload.records;
      }
      if (typeof action.payload.seeded === "boolean") {
        state.seeded = action.payload.seeded;
      }
    },

    /** One-time seed from the locale bundle. */
    seed(state, action: PayloadAction<OffboardingRecord[]>) {
      if (state.seeded) return;
      state.records = action.payload;
      state.seeded = true;
    },

    /** Re-seed on tenant/locale switch, discarding local edits. */
    reseed(state, action: PayloadAction<OffboardingRecord[]>) {
      state.records = action.payload;
      state.seeded = true;
    },

    addRecord(state, action: PayloadAction<OffboardingRecord>) {
      state.records.unshift(action.payload);
    },

    updateRecord(
      state,
      action: PayloadAction<{ id: string; changes: Partial<OffboardingRecord> }>,
    ) {
      const record = find(state, action.payload.id);
      if (!record) return;
      Object.assign(record, action.payload.changes);
    },

    removeRecord(state, action: PayloadAction<string>) {
      state.records = state.records.filter((r) => r.id !== action.payload);
    },

    approveRecord(
      state,
      action: PayloadAction<{ id: string; actor: string }>,
    ) {
      const record = find(state, action.payload.id);
      if (!record) return;
      record.status = "approved";
      record.approvedAt = today();
      record.approvedBy = action.payload.actor;
      record.disapprovedAt = undefined;
      record.disapprovalReason = undefined;
    },

    disapproveRecord(
      state,
      action: PayloadAction<{ id: string; actor: string; reason: string }>,
    ) {
      const record = find(state, action.payload.id);
      if (!record) return;
      record.status = "disapproved";
      record.disapprovedAt = today();
      record.disapprovedBy = action.payload.actor;
      record.disapprovalReason = action.payload.reason;
    },

    reactivateRecord(
      state,
      action: PayloadAction<{ id: string; actor: string }>,
    ) {
      const record = find(state, action.payload.id);
      if (!record) return;
      record.status = "reactivated";
      record.reactivatedAt = today();
      record.reactivatedBy = action.payload.actor;
    },

    revokeSystemAccess(state, action: PayloadAction<string>) {
      const record = find(state, action.payload);
      if (!record) return;
      record.systemAccessRevokedAt = today();
      // Keep the matching clearance step in step with the action.
      const step = record.clearanceItems.find((c) =>
        c.label.toLowerCase().includes("revoke system access"),
      );
      if (step && !step.completed) {
        step.completed = true;
        step.completedAt = today();
      }
    },

    scheduleExitInterview(
      state,
      action: PayloadAction<{ id: string; date: string }>,
    ) {
      const record = find(state, action.payload.id);
      if (!record) return;
      record.exitInterviewScheduledAt = action.payload.date;
    },

    generateExitDocuments(state, action: PayloadAction<string>) {
      const record = find(state, action.payload);
      if (!record) return;
      record.exitDocumentsGeneratedAt = today();
    },

    toggleClearanceItem(
      state,
      action: PayloadAction<{ id: string; itemId: string }>,
    ) {
      const record = find(state, action.payload.id);
      if (!record) return;
      const item = record.clearanceItems.find(
        (c) => c.id === action.payload.itemId,
      );
      if (!item) return;
      item.completed = !item.completed;
      item.completedAt = item.completed ? today() : undefined;

      // The exit-interview checklist row and `exitInterviewCompleted` used to
      // be two independent flags that could disagree — toggling this one and
      // the Exit Interview tab's own toggle now keep each other in sync.
      if (isExitInterviewClearanceItem(item)) {
        record.exitInterviewCompleted = item.completed;
      }

      recomputeOffboardingStatus(record);
    },

    updateExitInterview(
      state,
      action: PayloadAction<{ id: string; notes: string; completed: boolean }>,
    ) {
      const record = find(state, action.payload.id);
      if (!record) return;
      record.exitInterviewNotes = action.payload.notes;
      record.exitInterviewCompleted = action.payload.completed;

      const step = record.clearanceItems.find(isExitInterviewClearanceItem);
      if (step && step.completed !== action.payload.completed) {
        step.completed = action.payload.completed;
        step.completedAt = action.payload.completed ? today() : undefined;
      }

      recomputeOffboardingStatus(record);
    },

    completeRecord(state, action: PayloadAction<string>) {
      const record = find(state, action.payload);
      if (!record) return;
      record.status = "completed";
    },
  },
});

export const {
  hydrate,
  seed,
  reseed,
  addRecord,
  updateRecord,
  removeRecord,
  approveRecord,
  disapproveRecord,
  reactivateRecord,
  revokeSystemAccess,
  scheduleExitInterview,
  generateExitDocuments,
  toggleClearanceItem,
  updateExitInterview,
  completeRecord,
} = offboardingSlice.actions;
export default offboardingSlice.reducer;
export type { OffboardingState };
