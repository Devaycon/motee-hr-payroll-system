"use client";

import { useState } from "react";
import {
  ChevronUp,
  Lightbulb,
  MessageCircle,
  Search,
  Flame,
  Star,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  SUGGESTION_STATUS_CONFIG,
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_CATEGORY_OPTIONS,
  SUGGESTION_STATUS_OPTIONS,
} from "../data";
import type {
  Suggestion,
  SuggestionCategory,
  SuggestionStatus,
  SuggestionSortOrder,
} from "../types";

interface SuggestionsBoardProps {
  suggestions: Suggestion[];
  onUpvote: (id: string) => void;
  onView: (suggestion: Suggestion) => void;
}

export function SuggestionsBoard({
  suggestions,
  onUpvote,
  onView,
}: SuggestionsBoardProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    SuggestionCategory | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | "all">(
    "all",
  );
  const [sortOrder, setSortOrder] =
    useState<SuggestionSortOrder>("most_upvoted");

  const publicSuggestions = suggestions.filter((s) => !s.isAnonymous);

  const filtered = publicSuggestions
    .filter((s) => {
      const matchSearch =
        search === "" ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || s.category === categoryFilter;
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "most_upvoted") return b.upvotes - a.upvotes;
      if (sortOrder === "most_recent")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const featured = filtered.filter((s) => s.isFeatured);
  const rest = filtered.filter((s) => !s.isFeatured);

  function renderCard(s: Suggestion) {
    const catConfig = SUGGESTION_CATEGORY_CONFIG[s.category];
    const statusConfig = SUGGESTION_STATUS_CONFIG[s.status];
    const hasUpvoted = s.upvotedBy.includes("me");

    return (
      <div
        key={s.id}
        className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/40 transition-colors"
      >
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onUpvote(s.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg border transition-colors shrink-0 ${
              hasUpvoted
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <ChevronUp className="w-4 h-4" />
            <span className="text-xs font-bold">{s.upvotes}</span>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-foreground">
                {s.title}
              </span>
              {s.isFeatured && (
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              )}
              {s.isTrending && (
                <Flame className="w-3.5 h-3.5 text-orange-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {s.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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
              {s.isAnonymous ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Anonymous
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {s.submitterName}
                </span>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                <button
                  type="button"
                  onClick={() => onView(s)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {s.comments.length}
                </button>
                <span>{s.createdAt}</span>
              </div>
            </div>

            {s.adminResponse && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-xs mt-2">
                <p className="text-muted-foreground font-medium mb-0.5">
                  HR Response
                </p>
                <p className="text-foreground line-clamp-2">
                  {s.adminResponse}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col  sm:flex-row gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search suggestions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) =>
            setCategoryFilter(v as SuggestionCategory | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Categories" />
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
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
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
          value={sortOrder}
          onValueChange={(v) => setSortOrder(v as SuggestionSortOrder)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="most_upvoted">Most Upvoted</SelectItem>
            <SelectItem value="most_recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No public suggestions match your filters.</p>
        </div>
      )}

      {featured.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <p className="text-xl font-semibold text-muted-foreground uppercase tracking-wide">
              Featured
            </p>
          </div>
          <div className="space-y-3">{featured.map(renderCard)}</div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-3">
          {featured.length > 0 && (
            <p className="text-xl font-semibold text-muted-foreground uppercase tracking-wide">
              All Suggestions
            </p>
          )}
          <div className="space-y-3">{rest.map(renderCard)}</div>
        </div>
      )}

      <div className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground border-t border-border/40">
        <ShieldCheck className="w-3.5 h-3.5" />
        Anonymous suggestions are hidden from this board to protect submitter
        identity.
      </div>
    </div>
  );
}
