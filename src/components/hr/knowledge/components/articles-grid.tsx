"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useState } from "react";
import {
  Search,
  Star,
  Eye,
  ThumbsUp,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ARTICLE_CATEGORY_CONFIG, ARTICLE_CATEGORY_OPTIONS } from "../data";
import type { KnowledgeArticle } from "../types";

interface ArticlesGridProps {
  articles: KnowledgeArticle[];
  onView: (article: KnowledgeArticle) => void;
}

type SortOption = "views" | "recent" | "alpha";

function isNew(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = new Date("2026-04-04").getTime();
  return now - created <= 14 * 24 * 60 * 60 * 1000;
}

function helpfulRate(article: KnowledgeArticle): number {
  const total = (article.helpfulVotes ?? 0) + (article.notHelpfulVotes ?? 0);
  if (total === 0) return 0;
  return Math.round(((article.helpfulVotes ?? 0) / total) * 100);
}

export function ArticlesGrid({ articles, onView }: ArticlesGridProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("views");

  const published = articles.filter((a) => a.status === "published");

  const filtered = published
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.body ?? "").toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      const matchCat =
        categoryFilter === "all" || a.category === categoryFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === "views") return b.views - a.views;
      if (sort === "recent") return b.updatedAt.localeCompare(a.updatedAt);
      return a.title.localeCompare(b.title);
    });

  const featured = filtered.filter((a) => a.isFeatured);
  const regular = filtered.filter((a) => !a.isFeatured);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles, topics, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-42.5">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ARTICLE_CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-37.5">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {featured.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Featured Articles
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onView={onView}
                featured
              />
            ))}
          </div>
        </div>
      )}

      {regular.length > 0 && (
        <div className="space-y-3">
          {featured.length > 0 && (
            <h3 className="text-sm font-semibold text-foreground">
              All Articles
            </h3>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regular.map((article) => (
              <ArticleCard key={article.id} article={article} onView={onView} />
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No articles found</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Try adjusting your search or filter
          </p>
        </div>
      )}
    </div>
  );
}

interface ArticleCardProps {
  article: KnowledgeArticle;
  onView: (article: KnowledgeArticle) => void;
  featured?: boolean;
}

function ArticleCard({ article, onView, featured }: ArticleCardProps) {
  const catCfg = ARTICLE_CATEGORY_CONFIG[article.category];
  const rate = helpfulRate(article);
  const articleIsNew = isNew(article.createdAt);
  const bodyPreview =
    (article.body ?? "").replace(/\n\n/g, " ").slice(0, 130) + "...";

  return (
    <button
      type="button"
      onClick={() => onView(article)}
      className={`group flex flex-col gap-3 rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 ${
        featured ? "border-amber-200 dark:border-amber-800/60" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}
          >
            {catCfg.label}
          </span>
          {featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              <Star className="h-2.5 w-2.5" /> Featured
            </span>
          )}
          {articleIsNew && (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Sparkles className="h-2.5 w-2.5" /> New
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-1.5">
        <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {article.title}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {bodyPreview}
        </p>
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-1.5 py-0 text-[10px]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.views.toLocaleString()}
          </span>
          {rate > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {rate}%
            </span>
          )}
        </div>
        <span>{formatDate(article.updatedAt)}</span>
      </div>
    </button>
  );
}
