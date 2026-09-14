"use client";

import { store } from "./store";
import { hydrate } from "./shifts-slice";
import type { ShiftAssignment, ShiftTemplate } from "@/src/lib/types/shifts";

const STORAGE_KEY = "motee:shifts";

interface Snapshot {
  templates: ShiftTemplate[];
  assignments: ShiftAssignment[];
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.templates)
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

export function initShiftsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) {
    store.dispatch(
      hydrate({ templates: cached.templates, assignments: cached.assignments }),
    );
  }

  let lastTemplates: ShiftTemplate[] | null = null;
  let lastAssignments: ShiftAssignment[] | null = null;
  store.subscribe(() => {
    const { templates, assignments } = store.getState().shifts;
    if (templates === lastTemplates && assignments === lastAssignments) return;
    lastTemplates = templates;
    lastAssignments = assignments;
    writeCache({ templates, assignments });
  });
}
