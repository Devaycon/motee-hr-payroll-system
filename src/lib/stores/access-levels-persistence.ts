"use client";

import { store } from "./store";
import { hydrate } from "./access-levels-slice";
import type { AccessLevel } from "@/src/lib/types/access-levels";

const STORAGE_KEY = "motee:accessLevels";
const API_URL = "/api/access-levels";
const PUT_DEBOUNCE_MS = 500;

let initialized = false;

function readCache(): AccessLevel[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccessLevel[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(levels: AccessLevel[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
  } catch {
    // quota / private mode — ignore
  }
}

async function fetchFromServer(): Promise<AccessLevel[] | null> {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { levels?: AccessLevel[] };
    if (Array.isArray(body.levels) && body.levels.length > 0) {
      return body.levels;
    }
    return null;
  } catch {
    return null;
  }
}

async function putToServer(levels: AccessLevel[]): Promise<void> {
  try {
    await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levels }),
    });
  } catch {
    // network down — localStorage still has the last snapshot
  }
}

export function initAccessLevelsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  // 1. Optimistic hydrate from localStorage cache (no network wait)
  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  // 2. Async authoritative load from server
  void fetchFromServer().then((server) => {
    if (server) {
      store.dispatch(hydrate(server));
      writeCache(server);
    }
  });

  // 3. Sync subsequent edits back to server + cache (debounced)
  let last: AccessLevel[] | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const next = store.getState().accessLevels.levels;
    if (next === last) return;
    last = next;
    writeCache(next);

    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => {
      void putToServer(next);
    }, PUT_DEBOUNCE_MS);
  });
}
