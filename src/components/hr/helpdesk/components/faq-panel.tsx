"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronUp, ThumbsUp, Eye } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { TICKET_CATEGORY_CONFIG, TICKET_CATEGORY_OPTIONS } from "../data";
import type { FAQArticle, TicketCategory } from "../types";

interface FAQPanelProps {
  articles: FAQArticle[];
  onMarkHelpful: (id: string) => void;
}

export function FAQPanel({ articles, onMarkHelpful }: FAQPanelProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">(
    "all",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [helpfulVoted, setHelpfulVoted] = useState<Set<string>>(new Set());

  const filtered = articles.filter((a) => {
    const matchSearch =
      search === "" ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.content?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || a.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const groupedByCategory = TICKET_CATEGORY_OPTIONS.reduce<
    Record<TicketCategory, FAQArticle[]>
  >(
    (acc, cat) => {
      acc[cat] = filtered.filter((a) => a.category === cat);
      return acc;
    },
    {} as Record<TicketCategory, FAQArticle[]>,
  );

  function handleHelpful(id: string) {
    if (helpfulVoted.has(id)) return;
    setHelpfulVoted((prev) => new Set(prev).add(id));
    onMarkHelpful(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as TicketCategory | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TICKET_CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {TICKET_CATEGORY_CONFIG[c].icon}{" "}
                {TICKET_CATEGORY_CONFIG[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No articles match your search.</p>
        </div>
      )}

      <div className="space-y-6">
        {TICKET_CATEGORY_OPTIONS.map((cat) => {
          const catArticles = groupedByCategory[cat];
          if (catArticles.length === 0) return null;
          const catConfig = TICKET_CATEGORY_CONFIG[cat];
          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${catConfig.color} ${catConfig.bg} ${catConfig.border}`}
                >
                  {catConfig.icon} {catConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {catArticles.length} article
                  {catArticles.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1.5">
                {catArticles.map((a) => {
                  const isExpanded = expandedId === a.id;
                  const hasVoted = helpfulVoted.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className="border border-border rounded-xl bg-card overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {a.title}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            {a.views}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {a.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>
                                {a.helpful + (hasVoted ? 1 : 0)} found this
                                helpful
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleHelpful(a.id)}
                              disabled={hasVoted}
                              className="text-xs h-7"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              {hasVoted ? "Thanks!" : "Helpful"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
