"use client";

import { store } from "./store";
import { hydrate } from "./presence-check-slice";
import type {
  PresenceCheckSettings,
  PresencePrompt,
} from "@/src/lib/types/presence-check";

const STORAGE_KEY = "motee:presence-check";

interface Snapshot {
  settings: PresenceCheckSettings;
  prompts: PresencePrompt[];
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.settings === "object"
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
    // Quota or private-mode failures are non-fatal — state stays in memory.
  }
}

export function initPresenceCheckPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let lastSettings: PresenceCheckSettings | null = null;
  let lastPrompts: PresencePrompt[] | null = null;
  store.subscribe(() => {
    const { settings, prompts } = store.getState().presenceCheck;
    if (settings === lastSettings && prompts === lastPrompts) return;
    lastSettings = settings;
    lastPrompts = prompts;
    writeCache({ settings, prompts });
  });
}

/** Clears the cache — used when switching tenant/locale demo data. */
export function clearPresenceCheckCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
