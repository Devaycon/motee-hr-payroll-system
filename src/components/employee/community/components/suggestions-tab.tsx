"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Lightbulb,
  ChevronUp,
  Plus,
  CheckCircle,
  Clock,
  Flame,
  TrendingUp,
} from "lucide-react";
import type {
  Suggestion,
  SuggestionCategory,
  SuggestionStatus,
} from "@/src/lib/types/suggestions";
import {
  SUGGESTIONS,
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_STATUS_CONFIG,
  SUGGESTION_CATEGORY_OPTIONS,
  SUGGESTION_STATUS_OPTIONS,
  computeSuggestionStats,
  MY_INITIALS,
  MY_NAME,
  MY_DEPT,
  formatDate,
} from "./data";

export function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<SuggestionCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | "all">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"upvotes" | "recent">("upvotes");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [myTab, setMyTab] = useState<"all" | "mine">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<SuggestionCategory>("culture");
  const [newAnon, setNewAnon] = useState(false);

  const stats = computeSuggestionStats(suggestions);

  function toggleUpvote(id: string) {
    setUpvoted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const has = upvoted.has(id);
        return { ...s, upvotes: has ? s.upvotes - 1 : s.upvotes + 1 };
      }),
    );
  }

  function submitSuggestion() {
    if (!newTitle.trim() || !newDesc.trim()) return;
    const ns: Suggestion = {
      id: `SUG-NEW-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      category: newCat,
      status: "submitted",
      priority: "medium",
      isAnonymous: newAnon,
      submitterName: newAnon ? undefined : MY_NAME,
      submitterInitials: newAnon ? undefined : MY_INITIALS,
      submitterDept: newAnon ? undefined : MY_DEPT,
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFeatured: false,
      isTrending: false,
    };
    setSuggestions((prev) => [ns, ...prev]);
    setShowSubmitModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewCat("culture");
    setNewAnon(false);
  }

  let list = suggestions.filter((s) => {
    if (catFilter !== "all" && s.category !== catFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (myTab === "mine" && s.submitterInitials !== MY_INITIALS) return false;
    return true;
  });

  list = [...list].sort((a, b) =>
    sortBy === "upvotes"
      ? b.upvotes - a.upvotes
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Suggestions", value: stats.total, icon: Lightbulb },
          { label: "Implemented", value: stats.implemented, icon: CheckCircle },
          { label: "Under Review", value: stats.underReview, icon: Clock },
          { label: "Avg Upvotes", value: stats.avgUpvotes, icon: ChevronUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#4361ee]/10">
                <Icon className="h-4 w-4 text-[#4361ee]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 border border-border rounded-lg p-0.5">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMyTab(t)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                myTab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "all" ? "All Suggestions" : "My Submissions"}
            </button>
          ))}
        </div>
        <Select
          value={catFilter}
          onValueChange={(v) => setCatFilter(v as SuggestionCategory | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SUGGESTION_CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {SUGGESTION_CATEGORY_CONFIG[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as SuggestionStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {SUGGESTION_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {SUGGESTION_STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "upvotes" | "recent")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upvotes">Most Upvoted</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => setShowSubmitModal(true)}
          className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
        >
          <Plus className="h-4 w-4 mr-1" /> Submit Suggestion
        </Button>
      </div>

      <div className="space-y-3">
        {list.map((s) => {
          const catCfg = SUGGESTION_CATEGORY_CONFIG[s.category];
          const statusCfg = SUGGESTION_STATUS_CONFIG[s.status];
          const hasUpvoted = upvoted.has(s.id);
          const isTrending = s.isTrending;
          const isFeatured = s.isFeatured;

          return (
            <Card
              key={s.id}
              className="cursor-pointer bg-card border-border hover:border-primary/40 transition-colors"
              onClick={() => setSelectedSuggestion(s)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUpvote(s.id);
                    }}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg border transition-colors shrink-0 ${
                      hasUpvoted
                        ? "bg-[#4361ee]/10 border-[#4361ee]/40 text-[#4361ee]"
                        : "border-border text-muted-foreground hover:border-[#4361ee]/40"
                    }`}
                  >
                    <ChevronUp
                      className={`h-4 w-4 ${hasUpvoted ? "fill-[#4361ee]" : ""}`}
                    />
                    <span className="text-xs font-bold">
                      {s.upvotes +
                        (hasUpvoted && !s.upvotedBy.includes("current")
                          ? 1
                          : 0)}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-foreground">
                        {s.title}
                      </span>
                      {isFeatured && (
                        <Flame className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      {isTrending && (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${catCfg.color} ${catCfg.bg} ${catCfg.border}`}
                      >
                        {catCfg.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </Badge>
                      {s.isAnonymous ? (
                        <span className="text-xs text-muted-foreground">
                          Anonymous
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {s.submitterName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(s.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {list.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No suggestions match your filters.
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedSuggestion}
        onOpenChange={() => setSelectedSuggestion(null)}
      >
        {selectedSuggestion && (
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base leading-snug">
                {selectedSuggestion.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs ${SUGGESTION_CATEGORY_CONFIG[selectedSuggestion.category].color} ${SUGGESTION_CATEGORY_CONFIG[selectedSuggestion.category].bg} ${SUGGESTION_CATEGORY_CONFIG[selectedSuggestion.category].border}`}
                >
                  {
                    SUGGESTION_CATEGORY_CONFIG[selectedSuggestion.category]
                      .label
                  }
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${SUGGESTION_STATUS_CONFIG[selectedSuggestion.status].color} ${SUGGESTION_STATUS_CONFIG[selectedSuggestion.status].bg} ${SUGGESTION_STATUS_CONFIG[selectedSuggestion.status].border}`}
                >
                  {SUGGESTION_STATUS_CONFIG[selectedSuggestion.status].label}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {selectedSuggestion.upvotes} upvotes
                </span>
              </div>

              <p className="text-sm text-foreground leading-relaxed">
                {selectedSuggestion.description}
              </p>

              <div className="text-xs text-muted-foreground flex gap-4">
                <span>
                  By:{" "}
                  {selectedSuggestion.isAnonymous
                    ? "Anonymous"
                    : selectedSuggestion.submitterName}
                </span>
                <span>
                  Submitted: {formatDate(selectedSuggestion.createdAt)}
                </span>
              </div>

              {selectedSuggestion.adminResponse && (
                <>
                  <Separator />
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                      HR Response
                    </p>
                    <p className="text-xs text-foreground">
                      {selectedSuggestion.adminResponse}
                    </p>
                  </div>
                </>
              )}

              {selectedSuggestion.comments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      Comments
                    </p>
                    {selectedSuggestion.comments.map((c) => (
                      <div
                        key={c.id}
                        className={`p-2 rounded-lg text-xs ${c.isAdmin ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800" : "bg-muted/40"}`}
                      >
                        <p className="font-medium text-foreground">
                          {c.authorName}{" "}
                          {c.isAdmin && (
                            <span className="text-blue-600 dark:text-blue-400">
                              (HR)
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground mt-0.5">
                          {c.message}
                        </p>
                        <p className="text-muted-foreground mt-0.5">
                          {formatDate(c.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit a Suggestion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Title
              </label>
              <Input
                placeholder="Brief title for your suggestion"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="Describe your idea in detail…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Category
              </label>
              <Select
                value={newCat}
                onValueChange={(v) => setNewCat(v as SuggestionCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTION_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {SUGGESTION_CATEGORY_CONFIG[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anon-toggle"
                checked={newAnon}
                onChange={(e) => setNewAnon(e.target.checked)}
                className="rounded"
              />
              <label
                htmlFor="anon-toggle"
                className="text-xs text-muted-foreground"
              >
                Submit anonymously
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitSuggestion}
                disabled={!newTitle.trim() || !newDesc.trim()}
                className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
