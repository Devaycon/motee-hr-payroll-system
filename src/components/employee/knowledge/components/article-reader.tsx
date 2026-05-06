import {
  ArrowLeft,
  Eye,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { ARTICLE_CATEGORY_CONFIG, formatDate } from "./data";
import type { KnowledgeArticle } from "./data";

interface ArticleReaderProps {
  article: KnowledgeArticle;
  bookmarks: Set<string>;
  helpfulVotes: Record<string, "up" | "down" | null>;
  relatedArticles: KnowledgeArticle[];
  onBack: () => void;
  onOpen: (a: KnowledgeArticle) => void;
  onBookmark: (id: string) => void;
  onVote: (id: string, dir: "up" | "down") => void;
}

export function ArticleReader({
  article,
  bookmarks,
  helpfulVotes,
  relatedArticles,
  onBack,
  onOpen,
  onBookmark,
  onVote,
}: ArticleReaderProps) {
  const cfg = ARTICLE_CATEGORY_CONFIG[article.category];

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Knowledge Base
      </button>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={`text-xs border ${cfg.bg} ${cfg.color} ${cfg.border}`}
          >
            {cfg.label}
          </Badge>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{article.title}</h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Updated {formatDate(article.updatedAt)}
          </span>
          <span>•</span>
          <span>{article.authorName}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {article.views.toLocaleString()} views
          </span>
        </div>
      </div>

      <Separator />

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-foreground leading-relaxed text-sm">
          {article.content ?? article.body ?? article.summary}
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
            variant={helpfulVotes[article.id] === "up" ? "default" : "outline"}
            className={
              helpfulVotes[article.id] === "up"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : ""
            }
            onClick={() => onVote(article.id, "up")}
          >
            <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
            Helpful
            {article.helpful !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">
                ({article.helpful + (helpfulVotes[article.id] === "up" ? 1 : 0)}
                )
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant={
              helpfulVotes[article.id] === "down" ? "default" : "outline"
            }
            className={
              helpfulVotes[article.id] === "down"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : ""
            }
            onClick={() => onVote(article.id, "down")}
          >
            <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />
            Not helpful
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => onBookmark(article.id)}
          >
            {bookmarks.has(article.id) ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 mr-1.5 text-[#4361ee]" />
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
                onClick={() => onOpen(a)}
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
