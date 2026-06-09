"use client";

import { store } from "./store";
import { hydrate } from "./collection-edits-slice";
import type { CollectionEditsState } from "./collection-edits-slice";

const STORAGE_KEY = "motee:collectionEdits";
const API_URL = "/api/collection-edits";
const PUT_DEBOUNCE_MS = 500;

type Snapshot = Pick<CollectionEditsState, "added" | "edits">;

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.added === "object" && typeof parsed.edits === "object")
      return parsed as Snapshot;
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

async function fetchFromServer(): Promise<Snapshot | null> {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as Snapshot;
    if (body && typeof body.added === "object" && typeof body.edits === "object") return body;
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

export function initCollectionEditsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  void fetchFromServer().then((server) => {
    if (
      server &&
      (Object.keys(server.added).length > 0 || Object.keys(server.edits).length > 0)
    ) {
      store.dispatch(hydrate(server));
      writeCache(server);
    }
  });

  let lastAdded = store.getState().collectionEdits.added;
  let lastEdits = store.getState().collectionEdits.edits;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const s = store.getState().collectionEdits;
    if (s.added === lastAdded && s.edits === lastEdits) return;
    lastAdded = s.added;
    lastEdits = s.edits;
    const snap: Snapshot = { added: s.added, edits: s.edits };
    writeCache(snap);
    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => void putToServer(snap), PUT_DEBOUNCE_MS);
  });
}
