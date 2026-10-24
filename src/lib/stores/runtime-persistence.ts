"use client";

import type { Action } from "@reduxjs/toolkit";
import { store, type RootState } from "./store";

const PUT_DEBOUNCE_MS = 500;
const initialized = new Set<string>();

/**
 * localStorage + `/api/runtime/<key>` persistence for one slice, the shared
 * version of the hand-written `*-persistence.ts` files: hydrate from the cache
 * at once, then from the server, and write every change back to both.
 */
export function initRuntimePersistence<T extends object>(opts: {
  key: "branch-performance" | "sickness" | "leave-schemes";
  select: (s: RootState) => T;
  hydrate: (snapshot: T) => Action;
}): void {
  if (typeof window === "undefined" || initialized.has(opts.key)) return;
  initialized.add(opts.key);
  const storageKey = `motee:${opts.key}`;
  const apiUrl = `/api/runtime/${opts.key}`;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) store.dispatch(opts.hydrate(JSON.parse(raw) as T));
  } catch {
    // corrupt cache / private mode — start from the slice's defaults
  }

  void fetch(apiUrl, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((body: { snapshot?: T | null } | null) => {
      if (body?.snapshot) store.dispatch(opts.hydrate(body.snapshot));
    })
    .catch(() => {});

  let last: T | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  store.subscribe(() => {
    const snap = opts.select(store.getState());
    if (snap === last) return;
    last = snap;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(snap));
    } catch {
      // quota — the server copy still lands
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: snap }),
      }).catch(() => {});
    }, PUT_DEBOUNCE_MS);
  });
}
