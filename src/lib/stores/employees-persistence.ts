"use client";

import { store } from "./store";
import { hydrate, type EmployeesState } from "./employees-slice";

const STORAGE_KEY = "motee:employees";

let initialized = false;

function readCache(): EmployeesState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.deleted)) {
      return parsed as EmployeesState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(snap: EmployeesState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // Quota or private-mode failures are non-fatal — state stays in memory.
  }
}

/**
 * Rehydrates employee lifecycle overrides so a deactivation, exit or delete
 * survives navigation and a refresh (client feedback §1.2).
 */
export function initEmployeesPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let last = store.getState().employees;
  store.subscribe(() => {
    const s = store.getState().employees;
    if (
      s.statusOverrides === last.statusOverrides &&
      s.deleted === last.deleted &&
      s.credentialsSentAt === last.credentialsSentAt
    ) {
      return;
    }
    last = s;
    writeCache({
      statusOverrides: s.statusOverrides,
      deleted: s.deleted,
      credentialsSentAt: s.credentialsSentAt,
    });
  });
}

/** Clears the cache — used when switching tenant/locale demo data. */
export function clearEmployeesCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
