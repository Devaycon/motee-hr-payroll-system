"use client";

import { store } from "./store";
import { hydrate } from "./attendance-slice";
import type {
  ClockSession,
  CorrectionRequest,
  TimesheetRecord,
} from "@/src/lib/types/attendance";

const STORAGE_KEY = "motee:attendance";

interface Snapshot {
  sessions: Record<string, ClockSession>;
  timesheets: TimesheetRecord[];
  corrections: CorrectionRequest[];
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.sessions === "object"
      ? (parsed as Snapshot)
      : null;
  } catch {
    return null;
  }
}

function writeCache(snap: Snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // ignore
  }
}

export function initAttendancePersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) {
    store.dispatch(
      hydrate({
        sessions: cached.sessions,
        timesheets: cached.timesheets,
        corrections: cached.corrections,
      }),
    );
  }

  let lastSessions: Snapshot["sessions"] | null = null;
  let lastTimesheets: TimesheetRecord[] | null = null;
  let lastCorrections: CorrectionRequest[] | null = null;
  store.subscribe(() => {
    const { sessions, timesheets, corrections } = store.getState().attendance;
    if (
      sessions === lastSessions &&
      timesheets === lastTimesheets &&
      corrections === lastCorrections
    ) {
      return;
    }
    lastSessions = sessions;
    lastTimesheets = timesheets;
    lastCorrections = corrections;
    writeCache({ sessions, timesheets, corrections });
  });
}

/** Clears the cache — used when switching tenant/locale demo data. */
export function clearAttendanceCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
