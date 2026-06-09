"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  Suggestion,
  SuggestionCategory,
  SuggestionStatus,
} from "@/src/lib/types/suggestions";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawSuggestion {
  id?: string;
  title?: string;
  description?: string;
  body?: string;
  submittedBy?: string;
  category?: string;
  status?: string;
  votes?: number;
  upvotes?: number;
  isAnonymous?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function mapCategory(c?: string): SuggestionCategory {
  if (
    c === "culture" ||
    c === "process" ||
    c === "benefits" ||
    c === "tools" ||
    c === "wellbeing" ||
    c === "management"
  )
    return c;
  return "other";
}

function mapStatus(s?: string): SuggestionStatus {
  if (s === "new") return "submitted";
  if (s === "under-review" || s === "under_review") return "under_review";
  if (
    s === "accepted" ||
    s === "in_progress" ||
    s === "implemented" ||
    s === "declined"
  )
    return s;
  if (s === "rejected") return "declined";
  return "submitted";
}

function buildSuggestions(bundle: LocaleBundle): Suggestion[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return ((bundle.suggestions ?? []) as RawSuggestion[]).map((raw, i) => {
    const submitter = raw.submittedBy ? employeesById.get(raw.submittedBy) : null;
    const createdAt = raw.createdAt ?? bundle.tenant.createdAt.slice(0, 10);
    return {
      id: raw.id ?? `SUG-${String(i + 1).padStart(3, "0")}`,
      title: raw.title ?? "Suggestion",
      description: raw.description ?? raw.body ?? "",
      category: mapCategory(raw.category),
      status: mapStatus(raw.status),
      priority: "medium",
      isAnonymous: raw.isAnonymous ?? !submitter,
      submitterName: submitter?.fullName,
      submitterInitials: submitter?.initials,
      submitterDept: submitter?.departmentName,
      upvotes: raw.upvotes ?? raw.votes ?? 0,
      upvotedBy: [],
      comments: [],
      createdAt,
      updatedAt: raw.updatedAt ?? createdAt,
      isFeatured: false,
      isTrending: (raw.upvotes ?? raw.votes ?? 0) > 10,
    };
  });
}

export function useSuggestions() {
  return useLocaleSection<Suggestion[]>(buildSuggestions);
}
