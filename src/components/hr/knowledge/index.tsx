"use client";

import { useState } from "react";
import { BookOpen, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { StatCards } from "./components/stat-cards";
import { ArticlesGrid } from "./components/articles-grid";
import { ArticlesTable } from "./components/articles-table";
import { ArticleViewModal } from "./components/article-view-modal";
import { ArticleFormModal } from "./components/article-form-modal";
import {
  ARTICLES,
  ARTICLE_CATEGORY_CONFIG,
  ARTICLE_CATEGORY_OPTIONS,
  ARTICLE_STATUS_CONFIG,
  getCategoryBreakdown,
  getTopArticles,
  computeKbStats,
} from "./data";
import type { KnowledgeArticle, NewArticle, ArticleStatus } from "./types";

export function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>(ARTICLES);
  const [formOpen, setFormOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<KnowledgeArticle | null>(null);
  const [viewArticle, setViewArticle] = useState<KnowledgeArticle | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  function handleCreate(data: NewArticle) {
    const now = "2026-04-04";
    const id = `KB-${String(articles.length + 1).padStart(3, "0")}`;
    const newArticle: KnowledgeArticle = {
      id,
      title: data.title,
      body: data.body,
      category: data.category,
      status: data.status,
      tags: data.tags,
      authorName: "Sarah Mitchell",
      authorInitials: "SM",
      views: 0,
      helpfulVotes: 0,
      notHelpfulVotes: 0,
      isFeatured: data.isFeatured,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === "published" ? now : undefined,
    };
    setArticles((prev) => [newArticle, ...prev]);
  }

  function handleEdit(data: NewArticle) {
    if (!editArticle) return;
    setArticles((prev) =>
      prev.map((a) =>
        a.id === editArticle.id
          ? {
              ...a,
              title: data.title,
              body: data.body,
              category: data.category,
              status: data.status,
              tags: data.tags,
              isFeatured: data.isFeatured,
              updatedAt: "2026-04-04",
              publishedAt:
                data.status === "published" && !a.publishedAt
                  ? "2026-04-04"
                  : a.publishedAt,
            }
          : a,
      ),
    );
  }

  function handleSubmit(data: NewArticle) {
    if (editArticle) {
      handleEdit(data);
    } else {
      handleCreate(data);
    }
  }

  function handleDelete(id: string) {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }

  function handleToggleStatus(id: string, newStatus: ArticleStatus) {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: newStatus,
              updatedAt: "2026-04-04",
              publishedAt:
                newStatus === "published" && !a.publishedAt
                  ? "2026-04-04"
                  : a.publishedAt,
            }
          : a,
      ),
    );
  }

  function handleToggleFeatured(id: string) {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isFeatured: !a.isFeatured } : a)),
    );
  }

  function handleVote(id: string, vote: "helpful" | "notHelpful") {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              helpfulVotes:
                vote === "helpful"
                  ? (a.helpfulVotes ?? 0) + 1
                  : (a.helpfulVotes ?? 0),
              notHelpfulVotes:
                vote === "notHelpful"
                  ? (a.notHelpfulVotes ?? 0) + 1
                  : (a.notHelpfulVotes ?? 0),
            }
          : a,
      ),
    );
  }

  function handleView(article: KnowledgeArticle) {
    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, views: a.views + 1 } : a)),
    );
    setViewArticle(article);
    setViewOpen(true);
  }

  function handleOpenEdit(article: KnowledgeArticle) {
    setEditArticle(article);
    setFormOpen(true);
  }

  function handleOpenCreate() {
    setEditArticle(null);
    setFormOpen(true);
  }

  function getRelated(article: KnowledgeArticle): KnowledgeArticle[] {
    return articles
      .filter(
        (a) =>
          a.id !== article.id &&
          a.category === article.category &&
          a.status === "published",
      )
      .slice(0, 3);
  }

  const stats = computeKbStats(articles);
  const categoryBreakdown = getCategoryBreakdown(articles);
  const topArticles = getTopArticles(articles, 5);
  const totalCatCount = Object.values(categoryBreakdown).reduce(
    (s, n) => s + n,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Knowledge Base
            </h1>
            <p className="text-sm text-muted-foreground">
              Company policies, guides, and resources for your team
            </p>
          </div>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="shrink-0 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      <Tabs defaultValue="browse">
        <PageTabsList
          tabs={[
            { value: "browse", label: "Browse" },
            { value: "manage", label: "Manage" },
            { value: "analytics", label: "Analytics" },
          ]}
        />

        <TabsContent value="browse" className="mt-0">
          <ArticlesGrid articles={articles} onView={handleView} />
        </TabsContent>

        <TabsContent value="manage" className="mt-0">
          <ArticlesTable
            articles={articles}
            onView={handleView}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onToggleFeatured={handleToggleFeatured}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 space-y-6">
          <StatCards articles={articles} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Articles by Category
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution across all {totalCatCount} articles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ARTICLE_CATEGORY_OPTIONS.map(({ value, label }) => {
                  const count = categoryBreakdown[value] ?? 0;
                  const pct =
                    totalCatCount > 0
                      ? Math.round((count / totalCatCount) * 100)
                      : 0;
                  const cfg = ARTICLE_CATEGORY_CONFIG[value];
                  return (
                    <div key={value} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium">
                          {label}
                        </span>
                        <span className="text-muted-foreground">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <Progress value={pct} className={`h-1.5 ${cfg.bg}`} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Publication Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {(
                      ["published", "draft", "archived"] as ArticleStatus[]
                    ).map((s) => {
                      const cfg = ARTICLE_STATUS_CONFIG[s];
                      const count =
                        s === "published"
                          ? stats.published
                          : s === "draft"
                            ? stats.drafts
                            : stats.archived;
                      return (
                        <div
                          key={s}
                          className={`flex flex-col items-center rounded-xl border px-6 py-4 ${cfg.bg} ${cfg.border}`}
                        >
                          <span className={`text-2xl font-bold ${cfg.color}`}>
                            {count}
                          </span>
                          <span className={`text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Helpfulness Rate
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Based on all user votes across published articles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {stats.helpfulRate}%
                    </span>
                    <div className="flex-1">
                      <Progress
                        value={stats.helpfulRate}
                        className="h-2 bg-muted"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        of readers found articles helpful
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-sm font-semibold">
                  Top 5 Most Viewed Articles
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topArticles.map((article, idx) => {
                  const catCfg = ARTICLE_CATEGORY_CONFIG[article.category];
                  return (
                    <div
                      key={article.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {article.title}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}
                        >
                          {catCfg.label}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {article.views.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          views
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ArticleViewModal
        article={viewArticle}
        open={viewOpen}
        onOpenChange={setViewOpen}
        relatedArticles={viewArticle ? getRelated(viewArticle) : []}
        onVote={handleVote}
        onViewRelated={(rel) => {
          setViewArticle(rel);
        }}
      />

      <ArticleFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        editArticle={editArticle}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
