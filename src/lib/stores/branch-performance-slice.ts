import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  DEFAULT_SCORE_KPIS,
  KPI_DEFS,
  type KpiId,
  type ReportFrequency,
} from "@/src/lib/branches/performance";

/**
 * Branch performance settings HR owns: organisational targets, which
 * indicators make up the headline score, and the scheduled email reports
 * (with a log of what each run sent).
 */

export type ReportFormat = "pdf" | "excel" | "both";
export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export interface ReportRecipient {
  /** Employee id when picked from the directory; absent for a typed address. */
  employeeId?: string;
  name: string;
  email: string;
}

export interface ReportSchedule {
  id: string;
  name: string;
  frequency: ReportFrequency;
  /** Weekly runs on this day; monthly/quarterly run on the first of the period. */
  weekday: Weekday;
  time: string;
  recipients: ReportRecipient[];
  /** Empty = every branch the recipient may see. */
  branchIds: string[];
  kpis: KpiId[];
  format: ReportFormat;
  active: boolean;
  createdBy: string;
  createdAt: string;
  lastSentAt?: string;
}

export interface ReportDelivery {
  id: string;
  scheduleId: string;
  scheduleName: string;
  sentAt: string;
  recipients: string[];
  periodLabel: string;
  branchCount: number;
  summary: string;
  /** "manual" when someone pressed Send now. */
  trigger: "scheduled" | "manual";
}

export interface BranchPerformanceState {
  targets: Record<KpiId, number>;
  scoreKpis: KpiId[];
  schedules: ReportSchedule[];
  deliveries: ReportDelivery[];
}

const DEFAULT_TARGETS = Object.fromEntries(
  KPI_DEFS.map((k) => [k.id, k.defaultTarget]),
) as Record<KpiId, number>;

const initialState: BranchPerformanceState = {
  targets: DEFAULT_TARGETS,
  scoreKpis: DEFAULT_SCORE_KPIS,
  schedules: [
    {
      id: "BPR-SCH-001",
      name: "Weekly Branch Performance Report",
      frequency: "weekly",
      weekday: "monday",
      time: "08:00",
      recipients: [{ name: "Regional Manager", email: "regional.manager@example.com" }],
      branchIds: [],
      kpis: ["taskCompletion", "compliance", "overdueTasks", "training", "issues"],
      format: "pdf",
      active: true,
      createdBy: "System",
      createdAt: "2026-01-01",
    },
  ],
  deliveries: [],
};

const slice = createSlice({
  name: "branchPerformance",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Partial<BranchPerformanceState>>) {
      const p = action.payload;
      if (p.targets) state.targets = { ...DEFAULT_TARGETS, ...p.targets };
      if (Array.isArray(p.scoreKpis) && p.scoreKpis.length) state.scoreKpis = p.scoreKpis;
      if (Array.isArray(p.schedules)) state.schedules = p.schedules;
      if (Array.isArray(p.deliveries)) state.deliveries = p.deliveries;
    },
    setTargets(state, action: PayloadAction<Record<KpiId, number>>) {
      state.targets = action.payload;
    },
    resetTargets(state) {
      state.targets = DEFAULT_TARGETS;
    },
    setScoreKpis(state, action: PayloadAction<KpiId[]>) {
      if (action.payload.length) state.scoreKpis = action.payload;
    },
    upsertSchedule(state, action: PayloadAction<ReportSchedule>) {
      const i = state.schedules.findIndex((s) => s.id === action.payload.id);
      if (i === -1) state.schedules.push(action.payload);
      else state.schedules[i] = action.payload;
    },
    toggleSchedule(state, action: PayloadAction<string>) {
      const s = state.schedules.find((x) => x.id === action.payload);
      if (s) s.active = !s.active;
    },
    deleteSchedule(state, action: PayloadAction<string>) {
      state.schedules = state.schedules.filter((s) => s.id !== action.payload);
    },
    recordDelivery(state, action: PayloadAction<ReportDelivery>) {
      state.deliveries.unshift(action.payload);
      state.deliveries = state.deliveries.slice(0, 50);
      const s = state.schedules.find((x) => x.id === action.payload.scheduleId);
      if (s) s.lastSentAt = action.payload.sentAt;
    },
  },
});

export const {
  hydrate: hydrateBranchPerformance,
  setTargets,
  resetTargets,
  setScoreKpis,
  upsertSchedule,
  toggleSchedule,
  deleteSchedule,
  recordDelivery,
} = slice.actions;
export default slice.reducer;
