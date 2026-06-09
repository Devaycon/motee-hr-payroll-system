import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";
import type { EmployeeRow } from "@/src/lib/types/employees";
import { ONBOARDING_RECORDS } from "@/src/data/onboarding-demo";
import { onboardingRecordToEmployee } from "@/src/lib/demo/pending-employees";

interface OnboardingRecordsState {
  records: OnboardingRecord[];
  /** Hires whose workflow completed — picked up by the Employees module. */
  cleared: EmployeeRow[];
}

const initialState: OnboardingRecordsState = {
  records: ONBOARDING_RECORDS,
  cleared: [],
};

function recompute(record: OnboardingRecord): OnboardingRecord {
  const completedTasks = record.tasks.filter(
    (t) => t.status === "completed",
  ).length;
  const allRequiredDone = record.tasks
    .filter((t) => t.isRequired)
    .every((t) => t.status === "completed");
  const status: OnboardingRecord["status"] = allRequiredDone
    ? "completed"
    : completedTasks > 0
      ? "in_progress"
      : record.status === "overdue"
        ? "overdue"
        : "not_started";
  return {
    ...record,
    completedTasks,
    totalTasks: record.tasks.length,
    status,
    stage: allRequiredDone ? "completed" : record.stage,
  };
}

const onboardingRecordsSlice = createSlice({
  name: "onboardingRecords",
  initialState,
  reducers: {
    addRecord(state, action: PayloadAction<OnboardingRecord>) {
      state.records.unshift(recompute(action.payload));
    },
    addRecords(state, action: PayloadAction<OnboardingRecord[]>) {
      state.records.unshift(...action.payload.map(recompute));
    },
    removeRecord(state, action: PayloadAction<string>) {
      state.records = state.records.filter((r) => r.id !== action.payload);
    },
    sendWelcomeEmail(state, action: PayloadAction<string>) {
      const r = state.records.find((x) => x.id === action.payload);
      if (r) r.welcomeEmailSent = true;
    },
    advancePhase(state, action: PayloadAction<string>) {
      const r = state.records.find((x) => x.id === action.payload);
      if (r) r.phase = "onboarding";
    },
    /** A reviewer approves a workflow task. */
    approveTask(
      state,
      action: PayloadAction<{
        recordId: string;
        taskId: string;
        actorName: string;
        note?: string;
      }>,
    ) {
      const { recordId, taskId, actorName, note } = action.payload;
      const idx = state.records.findIndex((r) => r.id === recordId);
      if (idx < 0) return;
      const record = state.records[idx];
      const task = record.tasks.find((t) => t.id === taskId);
      if (!task || task.status === "completed") return;
      task.status = "completed";
      task.approvedAt = new Date().toISOString();
      task.note = note;
      const history = record.history ?? [];
      history.push({
        id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        at: task.approvedAt,
        actorName,
        type: "approved",
        taskName: task.taskName,
        note,
      });
      record.history = history;
      const next = recompute(record);
      if (next.status === "completed") {
        history.push({
          id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          at: task.approvedAt,
          actorName,
          type: "completed",
        });
        next.history = history;
        // Workflow done → clear the hire into the Employees module.
        state.cleared.unshift(onboardingRecordToEmployee(next));
        state.records.splice(idx, 1);
      } else {
        state.records[idx] = next;
      }
    },
  },
});

export const {
  addRecord,
  addRecords,
  removeRecord,
  sendWelcomeEmail,
  advancePhase,
  approveTask,
} = onboardingRecordsSlice.actions;

export default onboardingRecordsSlice.reducer;
