"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ARTICLES, ARTICLE_CATEGORY_CONFIG } from "./components/data";
import type { KnowledgeArticle, ArticleCategory } from "./components/data";
import { CategoryStatCards } from "./components/category-stat-cards";
import { ArticleList } from "./components/article-list";
import { ArticleReader } from "./components/article-reader";

export function EmployeeKnowledgeBase() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ArticleCategory | "all">("all");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, "up" | "down" | null>>({});
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

  const bookmarkedArticles = publishedArticles.filter((a) => bookmarks.has(a.id));
  const mostViewed = [...publishedArticles].sort((a, b) => b.views - a.views).slice(0, 3);

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
    setHelpfulVotes((prev) => ({ ...prev, [id]: prev[id] === dir ? null : dir }));
  }

  function handleOpenArticle(a: KnowledgeArticle) {
    setOpenArticle(a);
  }

  if (openArticle) {
    return (
      <ArticleReader
        article={openArticle}
        bookmarks={bookmarks}
        helpfulVotes={helpfulVotes}
        relatedArticles={relatedArticles}
        onBack={() => setOpenArticle(null)}
        onOpen={handleOpenArticle}
        onBookmark={toggleBookmark}
        onVote={vote}
      />
    );
  }

  const isFiltering = search !== "" || categoryFilter !== "all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Knowledge Base</h1>
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

      {isFiltering ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {categoryFilter !== "all"
                ? ARTICLE_CATEGORY_CONFIG[categoryFilter].label
                : "Search Results"}{" "}
              <span className="font-normal text-muted-foreground">({filtered.length})</span>
            </p>
            {categoryFilter !== "all" && search === "" && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setCategoryFilter("all")}
              >
                ? All categories
              </Button>
            )}
          </div>
          <ArticleList
            articles={filtered}
            bookmarks={bookmarks}
            emptyMessage="No articles found."
            onOpen={handleOpenArticle}
            onBookmark={toggleBookmark}
          />
        </div>
      ) : (
        <>
          <CategoryStatCards
            publishedArticles={publishedArticles}
            onSelect={setCategoryFilter}
          />

          <Tabs defaultValue="most-viewed">
            <PageTabsList
              tabs={[
                { value: "most-viewed", label: "Most Viewed" },
                { value: "bookmarks", label: `Bookmarks${bookmarkedArticles.length > 0 ? ` (${bookmarkedArticles.length})` : ""}` },
              ]}
            />

            <TabsContent value="most-viewed" className="mt-5">
              <ArticleList
                articles={mostViewed}
                bookmarks={bookmarks}
                onOpen={handleOpenArticle}
                onBookmark={toggleBookmark}
              />
            </TabsContent>

            <TabsContent value="bookmarks" className="mt-5">
              <ArticleList
                articles={bookmarkedArticles}
                bookmarks={bookmarks}
                emptyMessage="No bookmarks yet. Bookmark articles to find them here."
                onOpen={handleOpenArticle}
                onBookmark={toggleBookmark}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
