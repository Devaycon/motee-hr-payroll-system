"use client";

import { scopedStorageKey } from "@/src/lib/locale/country-storage";
import { store } from "./store";
import { hydrateReportStudio, type ReportStudioState } from "./report-studio-slice";

/**
 * Saved Report Studio reports in this browser (per country). Only report
 * specifications are stored — never report data — but they stay off the
 * shared runtime API anyway, like payroll.
 */
const STORAGE_KEY = scopedStorageKey("report-studio");
let initialized = false;

export function initReportStudioPersistence(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) store.dispatch(hydrateReportStudio(JSON.parse(raw) as ReportStudioState));
  } catch {
    // corrupt cache — start empty
  }
  let last: ReportStudioState | null = null;
  store.subscribe(() => {
    const snap = store.getState().reportStudio;
    if (snap === last) return;
    last = snap;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch {
      // quota — keep in memory
    }
  });
}
