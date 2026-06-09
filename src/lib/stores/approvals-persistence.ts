"use client";

import { store } from "./store";
import { hydrate } from "./approvals-slice";
import type {
  ApprovalCategory,
  ApprovalChainTemplate,
  ApprovalRequest,
} from "@/src/lib/types/approvals";

const STORAGE_KEY = "motee:approvals";
const API_URL = "/api/approvals";
const PUT_DEBOUNCE_MS = 500;

interface Snapshot {
  templates: ApprovalChainTemplate[];
  requests: ApprovalRequest[];
  categories?: ApprovalCategory[];
}

let initialized = false;

function readCache(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.templates) &&
      Array.isArray(parsed.requests)
    ) {
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
    const body = (await res.json()) as Snapshot;
    if (Array.isArray(body.templates) && Array.isArray(body.requests)) {
      return body;
    }
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

export function initApprovalsPersistence(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  const cached = readCache();
  if (cached) {
    store.dispatch(
      hydrate({
        templates: cached.templates,
        requests: cached.requests,
        categories: cached.categories,
      }),
    );
  }

  void fetchFromServer().then((server) => {
    if (
      server &&
      (server.templates.length > 0 ||
        server.requests.length > 0 ||
        (server.categories?.length ?? 0) > 0)
    ) {
      store.dispatch(
        hydrate({
          templates: server.templates,
          requests: server.requests,
          categories: server.categories,
        }),
      );
      writeCache(server);
    }
  });

  let lastTemplates: ApprovalChainTemplate[] | null = null;
  let lastRequests: ApprovalRequest[] | null = null;
  let lastCategories: ApprovalCategory[] | null = null;
  let putTimer: ReturnType<typeof setTimeout> | null = null;

  store.subscribe(() => {
    const { templates, requests, categories } = store.getState().approvals;
    if (
      templates === lastTemplates &&
      requests === lastRequests &&
      categories === lastCategories
    )
      return;
    lastTemplates = templates;
    lastRequests = requests;
    lastCategories = categories;
    const snap: Snapshot = { templates, requests, categories };
    writeCache(snap);
    if (putTimer) clearTimeout(putTimer);
    putTimer = setTimeout(() => void putToServer(snap), PUT_DEBOUNCE_MS);
  });
}
