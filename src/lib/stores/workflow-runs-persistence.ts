"use client";

import { store } from "./store";
import { hydrate } from "./workflow-runs-slice";
import type { WorkflowRun } from "@/src/lib/types/workflow-runs";

const STORAGE_KEY = "motee:workflowRuns";
const API_URL = "/api/workflow-runs";
const PUT_DEBOUNCE_MS = 500;
/** Bump to drop caches written against an older run shape. */
const SCHEMA_VERSION = 1;

interface Snapshot {
  schemaVersion?: number;
  byCountry: Record<string, WorkflowRun[]>;
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.byCountry) return null;
    // A cache written before the current shape is worse than no cache: it
    // hydrates a run whose tasks are missing the fields every screen reads.
    if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
    return parsed as Snapshot;
  } catch {
    return null;
  }
}

function writeCache(snap: Snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // ignore
  }
}

async function fetchFromServer(): Promise<Snapshot | null> {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as Snapshot;
    if (body && body.byCountry) return body;
    return null;
  } catch {
    return null;
  }
}

async function putToServer(snap: Snapshot): Promise<void> {
  try {
    await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snap),
    });
  } catch {
    // ignore
  }
}

export function initWorkflowRunsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate({ byCountry: cached.byCountry }));

  void fetchFromServer().then((server) => {
    if (server && Object.keys(server.byCountry).length > 0) {
      store.dispatch(hydrate({ byCountry: server.byCountry }));
      writeCache({ schemaVersion: SCHEMA_VERSION, byCountry: server.byCountry });
    }
  });

  let last: Record<string, WorkflowRun[]> | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const byCountry = store.getState().workflowRuns.byCountry;
    if (byCountry === last) return;
    last = byCountry;
    const snap: Snapshot = { schemaVersion: SCHEMA_VERSION, byCountry };
    writeCache(snap);
    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => void putToServer(snap), PUT_DEBOUNCE_MS);
  });
}
