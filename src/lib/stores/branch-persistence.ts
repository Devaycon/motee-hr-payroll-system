"use client";

import { store } from "./store";
import { hydrate, type BranchState } from "./branch-slice";

const STORAGE_KEY = "motee:branch";

let initialized = false;

function readCache(): BranchState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      (typeof parsed.activeBranchId === "string" ||
        parsed.activeBranchId === null)
    ) {
      return parsed as BranchState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(snap: BranchState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // Quota or private-mode failures are non-fatal — state stays in memory.
  }
}

/** Keeps the navbar's branch selection across navigation and refresh. */
export function initBranchPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let last = store.getState().branch.activeBranchId;
  store.subscribe(() => {
    const next = store.getState().branch.activeBranchId;
    if (next === last) return;
    last = next;
    writeCache({ activeBranchId: next });
  });
}

/** Clears the cache — used when switching tenant/locale demo data. */
export function clearBranchCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
