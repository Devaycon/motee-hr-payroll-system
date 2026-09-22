"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface ListPaginationProps {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Left-hand text. Defaults to "Page X of Y". */
  summary?: string;
}

/**
 * Prev / windowed page numbers / Next for lists that aren't tables. Renders
 * nothing when there is only one page. Callers own the `page` state and should
 * clamp it to `totalPages` so a shrinking list never strands them on a page
 * that no longer exists.
 */
export function ListPagination({
  page,
  totalPages,
  onPageChange,
  summary,
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  // Windowed page numbers (max 5) so long lists don't render a giant button row.
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pageWindow = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-muted-foreground">
        {summary ?? `Page ${page} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        {windowStart > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="size-7 text-xs"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {windowStart > 2 && (
              <span className="px-0.5 text-xs text-muted-foreground">…</span>
            )}
          </>
        )}
        {pageWindow.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon"
            className="size-7 text-xs"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        {windowEnd < totalPages && (
          <>
            {windowEnd < totalPages - 1 && (
              <span className="px-0.5 text-xs text-muted-foreground">…</span>
            )}
            <Button
              variant="outline"
              size="icon"
              className="size-7 text-xs"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          aria-label="Next page"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
