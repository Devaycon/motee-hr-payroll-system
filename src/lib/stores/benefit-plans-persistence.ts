"use client";

import { store } from "./store";
import { hydrate, hydrateCoverageOptions } from "./benefit-plans-slice";
import type { BenefitPlan } from "@/src/lib/types/benefits";

const STORAGE_KEY = "motee:benefitPlans";
const COVERAGE_KEY = "motee:benefitCoverageOptions";
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

function readCoverageCache(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COVERAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCoverageCache(options: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COVERAGE_KEY, JSON.stringify(options));
  } catch {
    // quota / private mode — ignore
  }
}

async function fetchFromServer(): Promise<{
  plans: BenefitPlan[] | null;
  coverageOptions: string[] | null;
}> {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) return { plans: null, coverageOptions: null };
    const body = (await res.json()) as {
      plans?: BenefitPlan[];
      coverageOptions?: string[];
    };
    return {
      plans: Array.isArray(body.plans) && body.plans.length > 0 ? body.plans : null,
      coverageOptions: Array.isArray(body.coverageOptions) ? body.coverageOptions : null,
    };
  } catch {
    return { plans: null, coverageOptions: null };
  }
}

async function putToServer(
  plans: BenefitPlan[],
  coverageOptions: string[],
): Promise<void> {
  try {
    await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plans, coverageOptions }),
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
  const cachedCoverage = readCoverageCache();
  if (cachedCoverage) store.dispatch(hydrateCoverageOptions(cachedCoverage));

  void fetchFromServer().then(({ plans, coverageOptions }) => {
    if (plans) {
      store.dispatch(hydrate(plans));
      writeCache(plans);
    }
    if (coverageOptions) {
      store.dispatch(hydrateCoverageOptions(coverageOptions));
      writeCoverageCache(coverageOptions);
    }
  });

  let lastPlans: BenefitPlan[] | null = null;
  let lastCoverage: string[] | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const { plans, coverageOptions } = store.getState().benefitPlans;
    if (plans === lastPlans && coverageOptions === lastCoverage) return;
    lastPlans = plans;
    lastCoverage = coverageOptions;
    writeCache(plans);
    writeCoverageCache(coverageOptions);

    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => {
      void putToServer(plans, coverageOptions);
    }, PUT_DEBOUNCE_MS);
  });
}
