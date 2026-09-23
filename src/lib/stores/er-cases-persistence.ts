"use client";

import { store } from "./store";
import { hydrate } from "./er-cases-slice";
import type { ERCase } from "@/src/lib/types/grievance";

const STORAGE_KEY = "motee:erCases";
const API_URL = "/api/er-cases";
const PUT_DEBOUNCE_MS = 500;

interface Snapshot {
  byCountry: Record<string, ERCase[]>;
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.byCountry) return parsed as Snapshot;
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

export function initErCasesPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate({ byCountry: cached.byCountry }));

  void fetchFromServer().then((server) => {
    if (server && Object.keys(server.byCountry).length > 0) {
      store.dispatch(hydrate({ byCountry: server.byCountry }));
      writeCache(server);
    }
  });

  let last: Record<string, ERCase[]> | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const byCountry = store.getState().erCases.byCountry;
    if (byCountry === last) return;
    last = byCountry;
    const snap: Snapshot = { byCountry };
    writeCache(snap);
    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => void putToServer(snap), PUT_DEBOUNCE_MS);
  });
}
