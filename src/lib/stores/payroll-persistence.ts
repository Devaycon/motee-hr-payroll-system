"use client";

import { scopedStorageKey } from "@/src/lib/locale/country-storage";
import { store } from "./store";
import { hydratePayroll, type PayrollState } from "./payroll-slice";

/**
 * Payroll persistence for the demo: this browser's localStorage only.
 *
 * Deliberately NOT the shared `/api/runtime` store the other modules use —
 * that route is unauthenticated, and payroll holds salaries, bank accounts
 * and tax IDs. BVNs are dropped before anything is written. In production
 * all of this lives behind the authenticated payroll API.
 */
const STORAGE_KEY = scopedStorageKey("payroll");
const WRITE_DEBOUNCE_MS = 400;
let initialized = false;

function redact(state: PayrollState): PayrollState {
  const byTenant: PayrollState["byTenant"] = {};
  for (const [id, t] of Object.entries(state.byTenant)) {
    byTenant[id] = { ...t, profiles: t.profiles.map((p) => ({ ...p, bvn: "" })) };
  }
  return { ...state, byTenant };
}

export function initPayrollPersistence(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // A snapshot from an older seed version is ignored by the reducer.
    if (raw) store.dispatch(hydratePayroll(JSON.parse(raw) as PayrollState));
  } catch {
    // corrupt cache / private mode — start from a fresh seed
  }

  let last: PayrollState | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  store.subscribe(() => {
    const snap = store.getState().payroll;
    if (snap === last) return;
    last = snap;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(redact(snap)));
      } catch {
        // quota — state stays in memory for the session
      }
    }, WRITE_DEBOUNCE_MS);
  });
}

export function clearPayrollCache(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
