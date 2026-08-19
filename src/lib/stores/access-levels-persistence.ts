"use client";

import { store } from "./store";
import { hydrate, hydrateAssignments } from "./access-levels-slice";
import type {
  AccessLevel,
  RoleAssignmentEvent,
} from "@/src/lib/types/access-levels";

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

interface ServerPayload {
  levels: AccessLevel[];
  assignments: RoleAssignmentEvent[];
}

async function fetchFromServer(): Promise<ServerPayload | null> {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<ServerPayload>;
    if (Array.isArray(body.levels) && body.levels.length > 0) {
      return {
        levels: body.levels,
        assignments: Array.isArray(body.assignments) ? body.assignments : [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function putToServer(payload: ServerPayload): Promise<void> {
  try {
    await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      store.dispatch(hydrate(server.levels));
      store.dispatch(hydrateAssignments(server.assignments));
      writeCache(server.levels);
    }
  });

  // 3. Sync subsequent edits back to server + cache (debounced)
  let lastLevels: AccessLevel[] | null = null;
  let lastAssignments: RoleAssignmentEvent[] | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const { levels, assignments } = store.getState().accessLevels;
    if (levels === lastLevels && assignments === lastAssignments) return;
    if (levels !== lastLevels) writeCache(levels);
    lastLevels = levels;
    lastAssignments = assignments;

    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => {
      void putToServer({ levels, assignments });
    }, PUT_DEBOUNCE_MS);
  });
}
