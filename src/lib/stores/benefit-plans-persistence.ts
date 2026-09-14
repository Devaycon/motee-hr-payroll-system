"use client";

import { store } from "./store";
import { hydrate } from "./benefit-plans-slice";
import type { BenefitPlan } from "@/src/lib/types/benefits";

const STORAGE_KEY = "motee:benefitPlans";
const API_URL = "/api/benefit-plans";
const PUT_DEBOUNCE_MS = 500;

let initialized = false;

function readCache(): BenefitPlan[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BenefitPlan[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(plans: BenefitPlan[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // quota / private mode — ignore
  }
}

async function fetchFromServer(): Promise<BenefitPlan[] | null> {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { plans?: BenefitPlan[] };
    return Array.isArray(body.plans) && body.plans.length > 0
      ? body.plans
      : null;
  } catch {
    return null;
  }
}

async function putToServer(plans: BenefitPlan[]): Promise<void> {
  try {
    await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans }),
    });
  } catch {
    // network down — localStorage still has the last snapshot
  }
}

export function initBenefitPlansPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) store.dispatch(hydrate(cached));

  void fetchFromServer().then((plans) => {
    if (plans) {
      store.dispatch(hydrate(plans));
      writeCache(plans);
    }
  });

  let lastPlans: BenefitPlan[] | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const { plans } = store.getState().benefitPlans;
    if (plans === lastPlans) return;
    lastPlans = plans;
    writeCache(plans);

    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => {
      void putToServer(plans);
    }, PUT_DEBOUNCE_MS);
  });
}
