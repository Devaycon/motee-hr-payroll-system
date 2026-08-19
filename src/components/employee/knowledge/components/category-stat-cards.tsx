import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import {
  ARTICLES,
  ARTICLE_CATEGORY_CONFIG,
  ARTICLE_CATEGORY_OPTIONS,
} from "./data";
import type { ArticleCategory } from "./data";

interface CategoryStatCardsProps {
  publishedArticles: ReturnType<typeof ARTICLES.filter>;
  /** The category currently drilled into, or "all". */
  selected: ArticleCategory | "all";
  onSelect: (cat: ArticleCategory | "all") => void;
}

/**
 * Category tiles double as the drill-down into the article list. These keep
 * their own colour coding rather than using `HrStatCard`, because the left
 * border is what tells the categories apart at a glance.
 */
export function CategoryStatCards({
  publishedArticles,
  selected,
  onSelect,
}: CategoryStatCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
      {ARTICLE_CATEGORY_OPTIONS.map(({ value, label }) => {
        const cfg = ARTICLE_CATEGORY_CONFIG[value];
        const count = publishedArticles.filter(
          (a) => a.category === value,
        ).length;
        if (count === 0) return null;
        const isActive = selected === value;
        // Re-selecting the open category clears back to every article.
        const toggle = () => onSelect(isActive ? "all" : value);
        return (
          <Card
            key={value}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            className={cn(
              "cursor-pointer hover:shadow-md transition-all border-l-4",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              cfg.border,
              isActive && "ring-2 ring-primary",
            )}
            onClick={toggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
              }
            }}
          >
            <CardContent className="p-4">
              <p className={`text-lg font-semibold ${cfg.color}`}>{label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                article{count !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
