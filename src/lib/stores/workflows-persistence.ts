"use client";

import { store } from "./store";
import { hydrate } from "./workflows-slice";
import type { Workflow } from "@/src/lib/types/workflows";

const STORAGE_KEY = "motee:workflows";

interface Snapshot {
  workflows: Workflow[];
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.workflows)) {
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
    // ignore
  }
}

export function initWorkflowsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) {
    store.dispatch(hydrate({ workflows: cached.workflows }));
  }

  let lastWorkflows: Workflow[] | null = null;
  store.subscribe(() => {
    const { workflows } = store.getState().workflows;
    if (workflows === lastWorkflows) return;
    lastWorkflows = workflows;
    writeCache({ workflows });
  });
}
