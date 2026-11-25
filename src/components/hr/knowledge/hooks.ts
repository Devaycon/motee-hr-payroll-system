"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { isServerId, useIsLive, useLiveSender } from "@/src/lib/live/use-is-live";
import { articleFromApi, articleToRequest } from "@/src/lib/knowledge/api-mapping";
import {
  useClearKnowledgeArticleFeedbackMutation,
  useCreateKnowledgeArticleMutation,
  useDeleteKnowledgeArticleMutation,
  useFeatureKnowledgeArticleMutation,
  useGetKnowledgeArticlesQuery,
  useGetPublishedKnowledgeArticlesQuery,
  useMarkKnowledgeArticleReadMutation,
  useSendKnowledgeArticleFeedbackMutation,
  useSetKnowledgeArticleStatusMutation,
  useUnfeatureKnowledgeArticleMutation,
  useUpdateKnowledgeArticleMutation,
} from "@/src/store/services/knowledge";
import type { NewArticle } from "@/src/lib/types/knowledge";
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

/** Every article (HR): from the API when signed in, the bundle otherwise. */
export function useKnowledgeArticles() {
  const live = useIsLive();
  const demo = useLocaleSection<KnowledgeArticle[]>(buildArticles);
  const q = useGetKnowledgeArticlesQuery({ PageSize: 500 }, { skip: !live });
  const data = useMemo(
    () => (q.data?.data ? q.data.data.articles.items.map(articleFromApi) : null),
    [q.data],
  );
  if (!live) return demo;
  return { data, loading: q.isLoading, error: null };
}

/**
 * The published articles an employee can read, with their own vote. Signed
 * out `live` is false and the employee page keeps its demo list.
 */
export function usePublishedKnowledgeArticles() {
  const live = useIsLive();
  const q = useGetPublishedKnowledgeArticlesQuery({ PageSize: 500 }, { skip: !live });
  const data = useMemo(() => {
    const items = q.data?.data?.articles.items;
    if (!items) return null;
    return {
      articles: items.map(articleFromApi),
      votes: Object.fromEntries(
        items
          .filter((a) => a.myVote)
          .map((a) => [a.id, a.myVote === "helpful" ? "up" : "down"] as const),
      ) as Record<string, "up" | "down" | null>,
    };
  }, [q.data]);
  return { live, data };
}

/** Sends the knowledge screens' changes to the API (no-ops signed out). */
export function useKnowledgeActions() {
  const live = useIsLive();
  const send = useLiveSender(["Knowledge"]);
  const [create] = useCreateKnowledgeArticleMutation();
  const [update] = useUpdateKnowledgeArticleMutation();
  const [remove] = useDeleteKnowledgeArticleMutation();
  const [setStatus] = useSetKnowledgeArticleStatusMutation();
  const [feature] = useFeatureKnowledgeArticleMutation();
  const [unfeature] = useUnfeatureKnowledgeArticleMutation();
  const [markRead] = useMarkKnowledgeArticleReadMutation();
  const [vote] = useSendKnowledgeArticleFeedbackMutation();
  const [clearVote] = useClearKnowledgeArticleFeedbackMutation();
  const on = (id: string) => live && isServerId(id);
  const skip = Promise.resolve(true);

  return useMemo(
    () => ({
      live,
      create: (a: NewArticle) =>
        live ? send(() => create(articleToRequest(a)).unwrap(), "Could not save the article.") : skip,
      update: (id: string, a: NewArticle) =>
        on(id)
          ? send(() => update({ id, body: articleToRequest(a) }).unwrap(), "Could not save the article.")
          : skip,
      remove: (id: string) =>
        on(id) ? send(() => remove(id).unwrap(), "Could not delete the article.") : skip,
      status: (id: string, status: ArticleStatus) =>
        on(id)
          ? send(() => setStatus({ id, body: { status } }).unwrap(), "Could not change the status.")
          : skip,
      featured: (id: string, isFeatured: boolean) =>
        on(id)
          ? send(
              () => (isFeatured ? feature(id) : unfeature(id)).unwrap(),
              "Could not change the featured flag.",
            )
          : skip,
      // A read is best-effort: no message if it does not register.
      read: (id: string) => (on(id) ? markRead(id).then(() => true) : skip),
      vote: (id: string, v: "helpful" | "notHelpful" | null) =>
        on(id)
          ? send(
              () => (v ? vote({ id, body: { vote: v } }) : clearVote(id)).unwrap(),
              "Could not record your feedback.",
            )
          : skip,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, send, create, update, remove, setStatus, feature, unfeature, markRead, vote, clearVote],
  );
}
