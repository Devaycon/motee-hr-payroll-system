"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface TaskPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  from: number;
  to: number;
  total: number;
}

export function TaskPagination({
  page,
  totalPages,
  onPageChange,
  from,
  to,
  total,
}: TaskPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
      <span className="text-[11px] text-muted-foreground">
        Showing {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
              p === page
                ? "bg-[#4361ee] text-white"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
