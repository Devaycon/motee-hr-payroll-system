"use client";

import { store } from "./store";
import { hydrate, type OffboardingState } from "./offboarding-slice";

const STORAGE_KEY = "motee:offboarding";

let initialized = false;

function readCache(): OffboardingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.records)) {
      return parsed as OffboardingState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(snap: OffboardingState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // Quota or private-mode failures are non-fatal — state stays in memory.
  }
}

/**
 * Rehydrates the offboarding pipeline so approvals, disapprovals and
 * reactivations survive a refresh (client feedback §2).
 */
export function initOffboardingPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let last = store.getState().offboarding;
  store.subscribe(() => {
    const s = store.getState().offboarding;
    if (s.records === last.records && s.seeded === last.seeded) return;
    last = s;
    writeCache({ records: s.records, seeded: s.seeded });
  });
}

/** Clears the cache — used when switching tenant/locale demo data. */
export function clearOffboardingCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
