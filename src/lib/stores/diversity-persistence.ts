"use client";

import { store } from "./store";
import { hydrate } from "./diversity-slice";
import type { DiversityDeclaration } from "@/src/lib/types/diversity";

const STORAGE_KEY = "motee:diversity-declarations";

let initialized = false;

function readCache(): Record<string, DiversityDeclaration> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, DiversityDeclaration>)
      : null;
  } catch {
    return null;
  }
}

function writeCache(declarations: Record<string, DiversityDeclaration>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(declarations));
  } catch {
    // ignore
  }
}

export function initDiversityPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let last: Record<string, DiversityDeclaration> | null = null;
  store.subscribe(() => {
    const { declarations } = store.getState().diversity;
    if (declarations === last) return;
    last = declarations;
    writeCache(declarations);
  });
}
