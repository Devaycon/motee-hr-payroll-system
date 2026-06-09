"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  ArticleCategory,
  ArticleStatus,
  KnowledgeArticle,
} from "@/src/lib/types/knowledge";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawArticle {
  id?: string;
  title?: string;
  body?: string;
  content?: string;
  category?: string;
  authorId?: string;
  author?: string;
  tags?: string[];
  views?: number;
  helpful?: number;
  status?: string;
  lastUpdated?: string;
  updatedAt?: string;
  createdAt?: string;
}

function mapCategory(c?: string): ArticleCategory {
  if (
    c === "onboarding" ||
    c === "hr_policies" ||
    c === "payroll" ||
    c === "benefits" ||
    c === "compliance" ||
    c === "tools"
  )
    return c;
  return "general";
}

function mapStatus(s?: string): ArticleStatus {
  if (s === "draft" || s === "archived") return s;
  return "published";
}

function buildArticles(bundle: LocaleBundle): KnowledgeArticle[] {
  const kb = bundle.knowledgeBase as { articles?: RawArticle[] };
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return (kb.articles ?? []).map((raw, i) => {
    const author = raw.authorId ? employeesById.get(raw.authorId) : null;
    const createdAt = raw.createdAt ?? bundle.tenant.createdAt.slice(0, 10);
    return {
      id: raw.id ?? `KB-${String(i + 1).padStart(3, "0")}`,
      title: raw.title ?? "Untitled article",
      body: raw.body ?? raw.content ?? "",
      content: raw.content ?? raw.body,
      category: mapCategory(raw.category),
      status: mapStatus(raw.status),
      authorName: author?.fullName ?? raw.author ?? "HR Admin",
      authorInitials: author?.initials ?? "HA",
      tags: raw.tags ?? [],
      views: raw.views ?? 0,
      helpful: raw.helpful,
      helpfulVotes: raw.helpful ?? 0,
      notHelpfulVotes: 0,
      isFeatured: false,
      createdAt,
      updatedAt: raw.updatedAt ?? raw.lastUpdated ?? createdAt,
      publishedAt: raw.status === "draft" ? undefined : createdAt,
    };
  });
}

export function useKnowledgeArticles() {
  return useLocaleSection<KnowledgeArticle[]>(buildArticles);
}
