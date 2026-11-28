import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReportSpec } from "@/src/lib/reports/studio";

/**
 * Report Studio — saved custom reports and their audit trail (feedback B2).
 * A saved report is only its specification; it reruns on live data each time.
 */

export interface StudioRunLog {
  id: string;
  reportId: string;
  reportName: string;
  at: string;
  by: string;
  action: "saved" | "run" | "export" | "scheduled" | "archived" | "restored" | "deleted" | "duplicated";
  format?: string;
  rows?: number;
  /** Restricted fields that were masked for this person. */
  masked?: string[];
}

export interface ReportStudioState {
  reports: ReportSpec[];
  log: StudioRunLog[];
}

const initialState: ReportStudioState = { reports: [], log: [] };
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function push(state: ReportStudioState, entry: Omit<StudioRunLog, "id" | "at">) {
  state.log.unshift({ id: uid("RSL"), at: new Date().toISOString(), ...entry });
  if (state.log.length > 300) state.log.length = 300;
}

const slice = createSlice({
  name: "reportStudio",
  initialState,
  reducers: {
    hydrateReportStudio(state, action: PayloadAction<ReportStudioState>) {
      state.reports = action.payload?.reports ?? [];
      state.log = action.payload?.log ?? [];
    },
    saveReport(state, action: PayloadAction<{ spec: ReportSpec; by: string }>) {
      const { spec, by } = action.payload;
      const i = state.reports.findIndex((r) => r.id === spec.id);
      const next = { ...spec, updatedAt: new Date().toISOString() };
      if (i >= 0) state.reports[i] = next;
      else state.reports.unshift(next);
      push(state, { reportId: spec.id, reportName: spec.name, by, action: spec.schedule ? "scheduled" : "saved" });
    },
    duplicateReport(state, action: PayloadAction<{ id: string; newId: string; by: string; byId?: string; asTemplate?: boolean }>) {
      const src = state.reports.find((r) => r.id === action.payload.id);
      if (!src) return;
      const now = new Date().toISOString();
      const copy: ReportSpec = { ...src, id: action.payload.newId, name: `${src.name} (copy)`, template: action.payload.asTemplate ?? false, schedule: null, status: "active", owner: action.payload.by, ownerId: action.payload.byId, createdAt: now, updatedAt: now };
      state.reports.unshift(copy);
      push(state, { reportId: copy.id, reportName: copy.name, by: action.payload.by, action: "duplicated" });
    },
    setReportStatus(state, action: PayloadAction<{ id: string; status: ReportSpec["status"]; by: string }>) {
      const r = state.reports.find((x) => x.id === action.payload.id);
      if (!r) return;
      r.status = action.payload.status;
      r.updatedAt = new Date().toISOString();
      push(state, { reportId: r.id, reportName: r.name, by: action.payload.by, action: action.payload.status === "archived" ? "archived" : "restored" });
    },
    deleteReport(state, action: PayloadAction<{ id: string; by: string }>) {
      const r = state.reports.find((x) => x.id === action.payload.id);
      if (!r) return;
      state.reports = state.reports.filter((x) => x.id !== r.id);
      push(state, { reportId: r.id, reportName: r.name, by: action.payload.by, action: "deleted" });
    },
    logStudioRun(state, action: PayloadAction<Omit<StudioRunLog, "id" | "at">>) {
      push(state, action.payload);
    },
  },
});

export const { hydrateReportStudio, saveReport, duplicateReport, setReportStatus, deleteReport, logStudioRun } = slice.actions;
export default slice.reducer;
