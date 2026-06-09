"use client";

import { store } from "./store";
import { hydrate } from "./profile-edits-slice";
import type { ChangeRequest } from "@/src/lib/types/profile-edits";
import type { OverridesMap } from "@/src/lib/profile/overrides";

const STORAGE_KEY = "motee:profileEdits";
const API_URL = "/api/profile-edits";
const PUT_DEBOUNCE_MS = 500;

interface Snapshot {
  overrides: OverridesMap;
  requests: ChangeRequest[];
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.overrides === "object" && Array.isArray(parsed.requests))
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
    if (body && typeof body.overrides === "object" && Array.isArray(body.requests))
      return body;
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

export function initProfileEditsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  void fetchFromServer().then((server) => {
    if (server && (Object.keys(server.overrides).length > 0 || server.requests.length > 0)) {
      store.dispatch(hydrate(server));
      writeCache(server);
    }
  });

  let lastOverrides = store.getState().profileEdits.overrides;
  let lastRequests = store.getState().profileEdits.requests;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const s = store.getState().profileEdits;
    if (s.overrides === lastOverrides && s.requests === lastRequests) return;
    lastOverrides = s.overrides;
    lastRequests = s.requests;
    const snap: Snapshot = { overrides: s.overrides, requests: s.requests };
    writeCache(snap);
    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => void putToServer(snap), PUT_DEBOUNCE_MS);
  });
}
