"use client";

import { useState } from "react";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Eye,
  Tag,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  ARTICLES,
  ARTICLE_CATEGORY_CONFIG,
  ARTICLE_CATEGORY_OPTIONS,
} from "@/src/data/knowledge-demo";
import type {
  KnowledgeArticle,
  ArticleCategory,
} from "@/src/lib/types/knowledge";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EmployeeKnowledgeBase() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ArticleCategory | "all">(
    "all",
  );
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [helpfulVotes, setHelpfulVotes] = useState<
    Record<string, "up" | "down" | null>
  >({});
  const [openArticle, setOpenArticle] = useState<KnowledgeArticle | null>(null);

  const publishedArticles = ARTICLES.filter((a) => a.status === "published");

  const filtered = publishedArticles.filter((a) => {
    const matchSearch =
      search === "" ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.summary ?? "").toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter === "all" || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const bookmarkedArticles = publishedArticles.filter((a) =>
    bookmarks.has(a.id),
  );

  const featured = publishedArticles
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  const relatedArticles = openArticle
    ? publishedArticles
        .filter(
          (a) =>
            a.id !== openArticle.id &&
            (a.category === openArticle.category ||
              a.tags.some((t) => openArticle.tags.includes(t))),
        )
        .slice(0, 3)
    : [];

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function vote(id: string, dir: "up" | "down") {
    setHelpfulVotes((prev) => ({
      ...prev,
      [id]: prev[id] === dir ? null : dir,
    }));
  }

  if (openArticle) {
    return (
      <div className="space-y-6 max-w-3xl">
        <button
          onClick={() => setOpenArticle(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Knowledge Base
        </button>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={`text-xs border ${ARTICLE_CATEGORY_CONFIG[openArticle.category].bg} ${ARTICLE_CATEGORY_CONFIG[openArticle.category].color} ${ARTICLE_CATEGORY_CONFIG[openArticle.category].border}`}
            >
              {ARTICLE_CATEGORY_CONFIG[openArticle.category].label}
            </Badge>
            {openArticle.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {openArticle.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Updated {formatDate(openArticle.updatedAt)}
            </span>
            <span>•</span>
            <span>{openArticle.authorName}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {openArticle.views.toLocaleString()} views
            </span>
          </div>
        </div>

        <Separator />

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-foreground leading-relaxed text-sm">
            {openArticle.content ?? openArticle.body ?? openArticle.summary}
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Was this article helpful?
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={
                helpfulVotes[openArticle.id] === "up" ? "default" : "outline"
              }
              className={
                helpfulVotes[openArticle.id] === "up"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : ""
              }
              onClick={() => vote(openArticle.id, "up")}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
              Helpful
              {openArticle.helpful !== undefined && (
                <span className="ml-1.5 text-xs opacity-70">
                  (
                  {openArticle.helpful +
                    (helpfulVotes[openArticle.id] === "up" ? 1 : 0)}
                  )
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant={
                helpfulVotes[openArticle.id] === "down" ? "default" : "outline"
              }
              className={
                helpfulVotes[openArticle.id] === "down"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : ""
              }
              onClick={() => vote(openArticle.id, "down")}
            >
              <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
              Not helpful
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => toggleBookmark(openArticle.id)}
            >
              {bookmarks.has(openArticle.id) ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 mr-1.5 text-[#7F77DD]" />
                  Bookmarked
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                  Bookmark
                </>
              )}
            </Button>
          </div>
        </div>

        {relatedArticles.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-semibold text-foreground">
              Related Articles
            </p>
            <div className="space-y-2">
              {relatedArticles.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setOpenArticle(a)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {a.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {a.summary}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse articles, policies, and guides to find answers fast.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 h-11"
          placeholder="Search articles, topics, tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search === "" && categoryFilter === "all" && (
        <>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Categories</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {ARTICLE_CATEGORY_OPTIONS.map(({ value, label }) => {
                const cfg = ARTICLE_CATEGORY_CONFIG[value];
                const count = publishedArticles.filter(
                  (a) => a.category === value,
                ).length;
                if (count === 0) return null;
                return (
                  <button
                    key={value}
                    onClick={() => setCategoryFilter(value)}
                    className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${cfg.bg} ${cfg.border}`}
                  >
                    <p className={`text-sm font-semibold ${cfg.color}`}>
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {count} article{count !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {bookmarkedArticles.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                My Bookmarks
              </p>
              <div className="space-y-2">
                {bookmarkedArticles.map((a) => (
                  <ArticleRow
                    key={a.id}
                    article={a}
                    bookmarked={bookmarks.has(a.id)}
                    onOpen={() => setOpenArticle(a)}
                    onBookmark={() => toggleBookmark(a.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Most Viewed</p>
            <div className="space-y-2">
              {featured.map((a) => (
                <ArticleRow
                  key={a.id}
                  article={a}
                  bookmarked={bookmarks.has(a.id)}
                  onOpen={() => setOpenArticle(a)}
                  onBookmark={() => toggleBookmark(a.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {(search !== "" || categoryFilter !== "all") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {categoryFilter !== "all"
                ? ARTICLE_CATEGORY_CONFIG[categoryFilter].label
                : "Search Results"}{" "}
              <span className="font-normal text-muted-foreground">
                ({filtered.length})
              </span>
            </p>
            {categoryFilter !== "all" && (
              <div className="flex gap-2">
                {search === "" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setCategoryFilter("all")}
                  >
                    ← All categories
                  </Button>
                )}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No articles found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => (
                <ArticleRow
                  key={a.id}
                  article={a}
                  bookmarked={bookmarks.has(a.id)}
                  onOpen={() => setOpenArticle(a)}
                  onBookmark={() => toggleBookmark(a.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ArticleRow({
  article,
  bookmarked,
  onOpen,
  onBookmark,
}: {
  article: KnowledgeArticle;
  bookmarked: boolean;
  onOpen: () => void;
  onBookmark: () => void;
}) {
  const cfg = ARTICLE_CATEGORY_CONFIG[article.category];
  const helpfulRate =
    article.helpful !== undefined && article.views > 0
      ? Math.round((article.helpful / article.views) * 100)
      : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                className={`text-xs border ${cfg.bg} ${cfg.color} ${cfg.border}`}
              >
                {cfg.label}
              </Badge>
            </div>
            <button
              onClick={onOpen}
              className="text-sm font-semibold text-foreground hover:text-[#7F77DD] transition-colors text-left leading-snug"
            >
              {article.title}
            </button>
            {article.summary && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {article.summary}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.views.toLocaleString()}
              </span>
              {helpfulRate !== null && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <ThumbsUp className="w-3 h-3" />
                    {helpfulRate}% helpful
                  </span>
                </>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {article.tags.slice(0, 2).join(", ")}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark();
              }}
            >
              {bookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-[#7F77DD]" />
              ) : (
                <Bookmark className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onOpen}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
