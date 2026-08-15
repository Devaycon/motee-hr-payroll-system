"use client";

import { store } from "./store";
import { hydrate } from "./projects-slice";
import type { Project, TimesheetEntry } from "@/src/lib/types/projects";

const STORAGE_KEY = "motee:projects";

interface Snapshot {
  projects: Project[];
  timesheets: TimesheetEntry[];
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.projects)
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

export function initProjectsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) {
    store.dispatch(
      hydrate({ projects: cached.projects, timesheets: cached.timesheets }),
    );
  }

  let lastProjects: Project[] | null = null;
  let lastTimesheets: TimesheetEntry[] | null = null;
  store.subscribe(() => {
    const { projects, timesheets } = store.getState().projects;
    if (projects === lastProjects && timesheets === lastTimesheets) return;
    lastProjects = projects;
    lastTimesheets = timesheets;
    writeCache({ projects, timesheets });
  });
}
