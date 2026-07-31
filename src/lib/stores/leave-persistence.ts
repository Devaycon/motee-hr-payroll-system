"use client";

import { store } from "./store";
import { hydrate } from "./leave-slice";
import type {
  LeaveBalance,
  LeavePolicy,
  LeaveRequest,
} from "@/src/lib/types/leave";

const STORAGE_KEY = "motee:leave";

interface Snapshot {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  policies: LeavePolicy[];
  seeded: boolean;
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.requests) &&
      Array.isArray(parsed.balances) &&
      Array.isArray(parsed.policies)
    ) {
      return parsed as Snapshot;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(snap: Snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // Quota or private-mode failures are non-fatal — state stays in memory.
  }
}

/**
 * Rehydrates leave state from localStorage and keeps it in sync, so approvals
 * and stage transitions survive a refresh (client feedback round 2, §F4).
 */
export function initLeavePersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let last = store.getState().leave;
  store.subscribe(() => {
    const s = store.getState().leave;
    if (
      s.requests === last.requests &&
      s.balances === last.balances &&
      s.policies === last.policies &&
      s.seeded === last.seeded
    ) {
      return;
    }
    last = s;
    writeCache({
      requests: s.requests,
      balances: s.balances,
      policies: s.policies,
      seeded: s.seeded,
    });
  });
}

/** Clears the cache — used when switching tenant/locale demo data. */
export function clearLeaveCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
