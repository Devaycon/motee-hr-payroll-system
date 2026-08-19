"use client";

import { store } from "./store";
import { hydrate, type DashboardLayoutState } from "./dashboard-layout-slice";

const STORAGE_KEY = "motee:dashboard-layout";

let initialized = false;

function readCache(): DashboardLayoutState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed &&
      Array.isArray(parsed.order) &&
      Array.isArray(parsed.hidden) &&
      typeof parsed.spans === "object"
      ? (parsed as DashboardLayoutState)
      : null;
  } catch {
    return null;
  }
}

function writeCache(snap: DashboardLayoutState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // ignore
  }
}

export function initDashboardLayoutPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let last: DashboardLayoutState | null = null;
  store.subscribe(() => {
    const snap = store.getState().dashboardLayout;
    if (snap === last) return;
    last = snap;
    writeCache(snap);
  });
}
