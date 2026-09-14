"use client";

import { store } from "./store";
import { hydrate } from "./approvals-slice";
import type { ApprovalCategory, ApprovalChainTemplate } from "@/src/lib/types/approvals";

const STORAGE_KEY = "motee:approvals";
const API_URL = "/api/approvals";
const PUT_DEBOUNCE_MS = 500;

/**
 * Only chain templates and categories persist across a refresh — those are
 * real HR configuration (a custom approval chain an admin built). Requests
 * are deliberately excluded: they're either live user submissions (which
 * should come from a real backend, not a demo persistence layer) or seeded
 * demo data, and caching them meant a stale snapshot from an earlier session
 * would starve `useDemoApprovalSeed`'s per-type seeding forever (the same
 * staleness bug already fixed for the Offboarding module) — every refresh
 * now reseeds the submissions queue fresh instead.
 */
interface Snapshot {
  templates: ApprovalChainTemplate[];
  categories?: ApprovalCategory[];
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.templates)) {
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

async function fetchFromServer(): Promise<Snapshot | null> {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<Snapshot>;
    if (Array.isArray(body.templates)) {
      return { templates: body.templates, categories: body.categories };
    }
    return null;
  } catch {
    return null;
  }
}

async function putToServer(snap: Snapshot): Promise<void> {
  try {
    // The API's file shape still requires a `requests` array — send an empty
    // one so the server file never re-accumulates stale submissions either.
    await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...snap, requests: [] }),
    });
  } catch {
    // ignore
  }
}

export function initApprovalsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) {
    store.dispatch(
      hydrate({ templates: cached.templates, categories: cached.categories }),
    );
  }

  void fetchFromServer().then((server) => {
    if (
      server &&
      (server.templates.length > 0 || (server.categories?.length ?? 0) > 0)
    ) {
      store.dispatch(
        hydrate({ templates: server.templates, categories: server.categories }),
      );
      writeCache(server);
    }
  });

  let lastTemplates: ApprovalChainTemplate[] | null = null;
  let lastCategories: ApprovalCategory[] | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const { templates, categories } = store.getState().approvals;
    if (templates === lastTemplates && categories === lastCategories) return;
    lastTemplates = templates;
    lastCategories = categories;
    const snap: Snapshot = { templates, categories };
    writeCache(snap);
    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => void putToServer(snap), PUT_DEBOUNCE_MS);
  });
}
