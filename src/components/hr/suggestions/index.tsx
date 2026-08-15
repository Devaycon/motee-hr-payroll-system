"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useSuggestions } from "./hooks";
import { Lightbulb, Plus, ChevronUp, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  StatCards,
  matchesSuggestionCardFilter,
  SUGGESTION_CARD_FILTER_LABELS,
  type SuggestionCardFilter,
} from "./components/stat-cards";
import { SuggestionsBoard } from "./components/suggestions-board";
import { SuggestionsTable } from "./components/suggestions-table";
import { SuggestionDetailModal } from "./components/suggestion-detail-modal";
import { SuggestionFormModal } from "./components/suggestion-form-modal";
import {
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_CATEGORY_OPTIONS,
  SUGGESTION_STATUS_CONFIG,
  SUGGESTION_STATUS_OPTIONS,
  computeSuggestionStats,
  getCategoryBreakdown,
  getStatusBreakdown,
} from "./data";
import type {
  Suggestion,
  NewSuggestion,
  SuggestionStatus,
  SuggestionPriority,
} from "./types";

export function SuggestionsPage() {
  const { data, loading } = useSuggestions();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => {
    if (data) setSuggestions(data);
  }, [data]);
  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("board");
  /** Drill-down set by the KPI cards; "all" shows every submission. */
  const [cardFilter, setCardFilter] = useState<SuggestionCardFilter>("all");
  /** The submissions rows, narrowed to whichever KPI card is selected. */
  const visibleSuggestions = suggestions.filter((s) =>
    matchesSuggestionCardFilter(s, cardFilter),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [detailSuggestion, setDetailSuggestion] = useState<Suggestion | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  function handleCreate(data: NewSuggestion) {
    const now = new Date().toISOString().split("T")[0];
    const id = `SUG-${String(suggestions.length + 1).padStart(3, "0")}`;
    const newSuggestion: Suggestion = {
      id,
      title: data.title,
      description: data.description,
      category: data.category,
      status: "submitted",
      priority: "medium",
      isAnonymous: data.isAnonymous,
      submitterName: data.submitterName,
      submitterInitials: data.submitterInitials,
      submitterDept: data.submitterDept,
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
      isFeatured: false,
      isTrending: false,
    };
    setSuggestions((prev) => [newSuggestion, ...prev]);
    toast.success("Suggestion submitted successfully!");
  }

  function handleUpvote(id: string) {
    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const hasUpvoted = s.upvotedBy.includes("me");
        return {
          ...s,
          upvotes: hasUpvoted ? s.upvotes - 1 : s.upvotes + 1,
          upvotedBy: hasUpvoted
            ? s.upvotedBy.filter((u) => u !== "me")
            : [...s.upvotedBy, "me"],
        };
      }),
    );
  }

  function handleUpdateStatus(id: string, status: SuggestionStatus) {
    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const now = new Date().toISOString().split("T")[0];
        return {
          ...s,
          status,
          updatedAt: now,
          resolvedAt:
            status === "implemented" || status === "declined"
              ? now
              : s.resolvedAt,
        };
      }),
    );
    setDetailSuggestion((prev) =>
      prev?.id === id ? { ...prev, status } : prev,
    );
  }

  function handleUpdatePriority(id: string, priority: SuggestionPriority) {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, priority } : s)),
    );
    setDetailSuggestion((prev) =>
      prev?.id === id ? { ...prev, priority } : prev,
    );
  }

  function handleSaveAdminResponse(id: string, response: string) {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, adminResponse: response } : s)),
    );
    setDetailSuggestion((prev) =>
      prev?.id === id ? { ...prev, adminResponse: response } : prev,
    );
  }

  function handleSaveImplementationNotes(id: string, notes: string) {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, implementationNotes: notes } : s)),
    );
    setDetailSuggestion((prev) =>
      prev?.id === id ? { ...prev, implementationNotes: notes } : prev,
    );
  }

  function handleToggleFeatured(id: string) {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFeatured: !s.isFeatured } : s)),
    );
    setDetailSuggestion((prev) =>
      prev?.id === id ? { ...prev, isFeatured: !prev.isFeatured } : prev,
    );
    const target = suggestions.find((s) => s.id === id);
    if (target) {
      toast.success(
        target.isFeatured ? "Removed from featured" : "Marked as featured",
      );
    }
  }

  function handleAddComment(id: string, message: string) {
    const now = new Date().toISOString().split("T")[0];
    const comment = {
      id: `c-${Date.now()}`,
      authorName: "HR Admin",
      authorInitials: "HA",
      authorDept: "Human Resources",
      message,
      createdAt: now,
      isAdmin: true,
    };
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, comments: [...s.comments, comment] } : s,
      ),
    );
    setDetailSuggestion((prev) =>
      prev?.id === id
        ? { ...prev, comments: [...prev.comments, comment] }
        : prev,
    );
  }

  function handleDelete(id: string) {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    if (detailOpen && detailSuggestion?.id === id) {
      setDetailOpen(false);
      setDetailSuggestion(null);
    }
    toast.error("Suggestion deleted.");
  }

  function openDetail(suggestion: Suggestion) {
    setDetailSuggestion(suggestion);
    setDetailOpen(true);
  }

  const stats = computeSuggestionStats(suggestions);
  const categoryBreakdown = getCategoryBreakdown(suggestions);
  const statusBreakdown = getStatusBreakdown(suggestions);
  const topFive = [...suggestions]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5);
  const implementationRate =
    stats.total > 0 ? Math.round((stats.implemented / stats.total) * 100) : 0;

  if (loading && !suggestions.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-semibold text-foreground">
              Employee Suggestions
            </h1>
            <p className="text-sm text-muted-foreground">
              Collect ideas, track progress, and implement improvements from
              your team
            </p>
          </div>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2"
          size="lg"
        >
          <Plus className="w-4 h-4" />
          Submit Suggestion
        </Button>
      </div>

      <StatCards
        suggestions={suggestions}
        activeTab={activeTab}
        cardFilter={cardFilter}
        onDrillDown={(tab, filter) => {
          setActiveTab(tab);
          setCardFilter(filter);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {SUGGESTION_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              ({visibleSuggestions.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All submissions
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "board", label: "Community Board" },
            {
              value: "submissions",
              label: `All Submissions (${visibleSuggestions.length})`,
            },
            { value: "analytics", label: "Analytics" },
          ]}
        />

        <TabsContent value="board" className="mt-4">
          <SuggestionsBoard
            suggestions={suggestions}
            onUpvote={handleUpvote}
            onView={openDetail}
          />
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <SuggestionsTable
            suggestions={visibleSuggestions}
            onView={openDetail}
            onUpdateStatus={handleUpdateStatus}
            onToggleFeatured={handleToggleFeatured}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Suggestions by Category
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of ideas across all topic areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SUGGESTION_CATEGORY_OPTIONS.map((cat) => {
                  const count = categoryBreakdown[cat] ?? 0;
                  const pct =
                    stats.total > 0
                      ? Math.round((count / stats.total) * 100)
                      : 0;
                  const config = SUGGESTION_CATEGORY_CONFIG[cat];
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          {config.label}
                        </span>
                        <span className="text-muted-foreground">
                          {count} &bull; {pct}%
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Implementation Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress value={implementationRate} className="h-2" />
                    </div>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {implementationRate}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.implemented} of {stats.total} suggestions implemented
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {SUGGESTION_STATUS_OPTIONS.map((st) => {
                    const count = statusBreakdown[st] ?? 0;
                    if (count === 0) return null;
                    const config = SUGGESTION_STATUS_CONFIG[st];
                    return (
                      <div
                        key={st}
                        className="flex items-center justify-between"
                      >
                        <Badge
                          variant="outline"
                          className={`text-xs ${config.color} ${config.bg} ${config.border}`}
                        >
                          {config.label}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">
                    Top 5 Most Upvoted
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  The most popular suggestions from your employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topFive.map((s, i) => {
                    const catConfig = SUGGESTION_CATEGORY_CONFIG[s.category];
                    const statusConfig = SUGGESTION_STATUS_CONFIG[s.status];
                    return (
                      <div key={s.id} className="flex items-center gap-3 group">
                        <span className="text-sm font-bold text-muted-foreground w-5 shrink-0 text-right">
                          {i + 1}
                        </span>
                        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span className="text-sm font-semibold text-foreground">
                            {s.upvotes}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openDetail(s)}
                          className="flex-1 text-left text-sm font-medium text-foreground leading-snug hover:text-primary transition-colors truncate"
                        >
                          {s.title}
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-xs ${catConfig.color} ${catConfig.bg} ${catConfig.border}`}
                          >
                            {catConfig.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
                          >
                            {statusConfig.label}
                          </Badge>
                          {s.isAnonymous ? null : (
                            <PersonAvatar
                              name={s.submitterName ?? "Anonymous"}
                              initials={s.submitterInitials}
                              className="w-5 h-5"
                              fallbackClassName="text-[9px] bg-primary/10 text-primary"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <SuggestionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />

      <SuggestionDetailModal
        suggestion={detailSuggestion}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePriority={handleUpdatePriority}
        onSaveAdminResponse={handleSaveAdminResponse}
        onSaveImplementationNotes={handleSaveImplementationNotes}
        onToggleFeatured={handleToggleFeatured}
        onAddComment={handleAddComment}
      />
    </div>
  );
}
