"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Eye,
  Star,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { ARTICLE_CATEGORY_CONFIG, ARTICLE_STATUS_CONFIG } from "../data";
import type { KnowledgeArticle } from "../types";

interface ArticleViewModalProps {
  article: KnowledgeArticle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedArticles: KnowledgeArticle[];
  onVote: (id: string, vote: "helpful" | "notHelpful") => void;
  onViewRelated: (article: KnowledgeArticle) => void;
}

function isNew(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = new Date("2026-04-04").getTime();
  return now - created <= 14 * 24 * 60 * 60 * 1000;
}

export function ArticleViewModal({
  article,
  open,
  onOpenChange,
  relatedArticles,
  onVote,
  onViewRelated,
}: ArticleViewModalProps) {
  const [prevArticleId, setPrevArticleId] = useState<string | null>(null);
  const [votedArticles, setVotedArticles] = useState<Set<string>>(new Set());
  const [localVotes, setLocalVotes] = useState<
    Record<string, { helpful: number; notHelpful: number }>
  >({});

  if (article && article.id !== prevArticleId) {
    setPrevArticleId(article.id);
  }

  if (!article) return null;

  const catCfg = ARTICLE_CATEGORY_CONFIG[article.category];
  const statusCfg = ARTICLE_STATUS_CONFIG[article.status];
  const articleIsNew = isNew(article.createdAt);
  const localV = localVotes[article.id];
  const helpfulCount = (article.helpfulVotes ?? 0) + (localV?.helpful ?? 0);
  const notHelpfulCount =
    (article.notHelpfulVotes ?? 0) + (localV?.notHelpful ?? 0);
  const totalVotes = helpfulCount + notHelpfulCount;
  const helpfulRate =
    totalVotes > 0 ? Math.round((helpfulCount / totalVotes) * 100) : 0;
  const hasVoted = votedArticles.has(article.id);

  function handleVote(vote: "helpful" | "notHelpful") {
    if (hasVoted) return;
    const updated = new Set(votedArticles);
    updated.add(article!.id);
    setVotedArticles(updated);
    setLocalVotes((prev) => ({
      ...prev,
      [article!.id]: {
        helpful:
          (prev[article!.id]?.helpful ?? 0) + (vote === "helpful" ? 1 : 0),
        notHelpful:
          (prev[article!.id]?.notHelpful ?? 0) +
          (vote === "notHelpful" ? 1 : 0),
      },
    }));
    onVote(article!.id, vote);
    toast.success(
      vote === "helpful" ? "Thanks for your feedback!" : "Feedback recorded.",
    );
  }

  const paragraphs = (article.body ?? "").split("\n\n").filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${catCfg.bg} ${catCfg.color} ${catCfg.border}`}
              >
                {catCfg.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
              >
                {statusCfg.label}
              </span>
              {article.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              {articleIsNew && (
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Sparkles className="h-3 w-3" /> New
                </span>
              )}
            </div>
            <DialogTitle className="text-lg leading-snug">
              {article.title}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {article.authorInitials}
                </div>
                <span>{article.authorName}</span>
              </div>
              <span>Updated {formatDate(article.updatedAt)}</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {article.views.toLocaleString()} views
              </span>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          <div className="rounded-xl border border-border bg-muted p-5">
            <div className="space-y-4 text-sm leading-7 text-foreground">
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted p-4">
            <p className="mb-3 text-sm font-medium text-foreground">
              Was this article helpful?
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={hasVoted}
                  onClick={() => handleVote("helpful")}
                  className="gap-1.5"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes ({helpfulCount})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={hasVoted}
                  onClick={() => handleVote("notHelpful")}
                  className="gap-1.5"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  No ({notHelpfulCount})
                </Button>
              </div>
              {totalVotes > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${helpfulRate}%` }}
                    />
                  </div>
                  <span>{helpfulRate}% found this helpful</span>
                </div>
              )}
              {hasVoted && (
                <span className="text-xs text-muted-foreground">
                  Thank you for your feedback.
                </span>
              )}
            </div>
          </div>

          {relatedArticles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Related Articles
              </p>
              <div className="space-y-1">
                {relatedArticles.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onViewRelated(rel)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium text-foreground">
                      {rel.title}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
