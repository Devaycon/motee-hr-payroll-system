"use client";

import { store } from "./store";
import { hydrate } from "./attendance-deduction-policy-slice";
import type { DeductionPolicy } from "@/src/lib/types/attendance";

const STORAGE_KEY = "motee:attendance-deduction-policy";
const API_URL = "/api/attendance-deduction-policy";
const PUT_DEBOUNCE_MS = 500;

interface Snapshot {
  policy: DeductionPolicy;
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.policy === "object") return parsed as Snapshot;
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
    // Quota or private-mode failures are non-fatal — state stays in memory.
  }
}

async function fetchFromServer(): Promise<Snapshot | null> {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as Snapshot;
    if (body && body.policy) return body;
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

export function initAttendanceDeductionPolicyPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate({ policy: cached.policy }));

  void fetchFromServer().then((server) => {
    if (server) {
      store.dispatch(hydrate({ policy: server.policy }));
      writeCache(server);
    }
  });

  let last: DeductionPolicy | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const { policy } = store.getState().attendanceDeductionPolicy;
    if (policy === last) return;
    last = policy;
    const snap: Snapshot = { policy };
    writeCache(snap);
    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => void putToServer(snap), PUT_DEBOUNCE_MS);
  });
}
