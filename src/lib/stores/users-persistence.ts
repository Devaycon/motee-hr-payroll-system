"use client";

import { store } from "./store";
import { hydrate } from "./users-slice";
import type { UserAccountOverride } from "@/src/lib/types/users";

const STORAGE_KEY = "motee:user-accounts";

let initialized = false;

function readCache(): Record<string, UserAccountOverride> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, UserAccountOverride>)
      : null;
  } catch {
    return null;
  }
}

function writeCache(overrides: Record<string, UserAccountOverride>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore
  }
}

export function initUsersPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let last: Record<string, UserAccountOverride> | null = null;
  store.subscribe(() => {
    const { overrides } = store.getState().users;
    if (overrides === last) return;
    last = overrides;
    writeCache(overrides);
  });
}
