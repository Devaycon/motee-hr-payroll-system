"use client";

import { store } from "./store";
import { hydrate, seed } from "./expenses-slice";
import {
  EMPLOYEE_EXPENSES,
  type ExpenseClaim,
} from "@/src/data/employee-expenses-demo";

const STORAGE_KEY = "motee:expenses";

interface Snapshot {
  claims: ExpenseClaim[];
  seeded: boolean;
  seedAttributedFor: string | null;
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.claims)) return parsed as Snapshot;
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
    // Receipts are held as data URLs, so a claim-heavy account can exceed the
    // storage quota. Non-fatal: state stays in memory for the session.
  }
}

/**
 * Rehydrates expense claims from localStorage and seeds the demo set on first
 * run. Seeding happens here rather than in the list component so a deep link
 * straight to a claim's detail page finds its claim.
 */
export function initExpensesPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));
  // No-op once `seeded` is set, so the employee's own claims are never
  // overwritten by the demo rows.
  store.dispatch(seed(EMPLOYEE_EXPENSES));

  let last = store.getState().expenses;
  store.subscribe(() => {
    const s = store.getState().expenses;
    if (
      s.claims === last.claims &&
      s.seeded === last.seeded &&
      s.seedAttributedFor === last.seedAttributedFor
    ) {
      return;
    }
    last = s;
    writeCache({
      claims: s.claims,
      seeded: s.seeded,
      seedAttributedFor: s.seedAttributedFor,
    });
  });
}

/** Clears the cache — used when switching tenant/locale demo data. */
export function clearExpensesCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
