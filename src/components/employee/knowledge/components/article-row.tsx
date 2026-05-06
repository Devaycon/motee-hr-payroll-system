import {
  Eye,
  ThumbsUp,
  Tag,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { ARTICLE_CATEGORY_CONFIG } from "./data";
import type { KnowledgeArticle } from "./data";

interface ArticleRowProps {
  article: KnowledgeArticle;
  bookmarked: boolean;
  onOpen: () => void;
  onBookmark: () => void;
}

export function ArticleRow({
  article,
  bookmarked,
  onOpen,
  onBookmark,
}: ArticleRowProps) {
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
              className="text-sm font-semibold text-foreground hover:text-[#4361ee] transition-colors text-left leading-snug"
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
                <BookmarkCheck className="w-4 h-4 text-[#4361ee]" />
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
