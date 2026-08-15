"use client";

import { store } from "./store";
import { hydrate } from "./scenarios-slice";
import type { Scenario } from "@/src/lib/types/headcount-scenarios";

const STORAGE_KEY = "motee:headcount-scenarios";

let initialized = false;

function readCache(): Scenario[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Scenario[]) : null;
  } catch {
    return null;
  }
}

function writeCache(scenarios: Scenario[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    // private mode / quota — scenarios are disposable by nature
  }
}

export function initScenariosPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  let last: Scenario[] | null = null;
  store.subscribe(() => {
    const { scenarios } = store.getState().scenarios;
    if (scenarios === last) return;
    last = scenarios;
    writeCache(scenarios);
  });
}
