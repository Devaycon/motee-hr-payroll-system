"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { CalEvent } from "./types";

interface AllEventsListProps {
  events: CalEvent[];
  onDelete: (id: string) => void;
  typeColors: Record<string, string>;
  typeLabels?: Record<string, string>;
  /** When set, paginate the list at this page size. Omit to show all. */
  pageSize?: number;
  emptyMessage?: string;
}

export function AllEventsList({
  events,
  onDelete,
  typeColors,
  typeLabels,
  pageSize,
  emptyMessage = "No events yet.",
}: AllEventsListProps) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const [viewEvent, setViewEvent] = useState<CalEvent | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = pageSize
    ? Math.max(1, Math.ceil(sorted.length / pageSize))
    : 1;
  // Clamp so a shrinking/growing event list never strands us on a missing page.
  const currentPage = Math.min(page, totalPages);
  const visible = pageSize
    ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sorted;

  // Windowed page numbers (max 5) so large lists don't render a giant button row.
  const windowStart = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - 4),
  );
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pageWindow = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );

  const label = (type: string) => typeLabels?.[type] ?? type;

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="px-5 pt-4 pb-3">
          <CardTitle className="text-sm font-medium">All Events</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="px-5 pb-5 pt-1 flex-1">
          {sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">
              {emptyMessage}
            </p>
          ) : (
            <div className="flex flex-col">
              {visible.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-md bg-muted shrink-0 text-center">
                    <span className="text-[10px] text-muted-foreground leading-none uppercase">
                      {format(parseISO(ev.date), "MMM")}
                    </span>
                    <span className="text-sm font-bold text-foreground leading-tight">
                      {format(parseISO(ev.date), "d")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {ev.title}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 mt-1 ${typeColors[ev.type] ?? ""}`}
                    >
                      {label(ev.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => setViewEvent(ev)}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(ev.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                {windowStart > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7 text-xs"
                      onClick={() => setPage(1)}
                    >
                      1
                    </Button>
                    {windowStart > 2 && (
                      <span className="px-0.5 text-xs text-muted-foreground">
                        …
                      </span>
                    )}
                  </>
                )}
                {pageWindow.map((p) => (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="icon"
                    className="size-7 text-xs"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                {windowEnd < totalPages && (
                  <>
                    {windowEnd < totalPages - 1 && (
                      <span className="px-0.5 text-xs text-muted-foreground">
                        …
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7 text-xs"
                      onClick={() => setPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!viewEvent}
        onOpenChange={(open) => !open && setViewEvent(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{viewEvent?.title}</DialogTitle>
          </DialogHeader>
          {viewEvent && (
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-muted text-center shrink-0">
                  <span className="text-[10px] text-muted-foreground leading-none uppercase">
                    {format(parseISO(viewEvent.date), "MMM")}
                  </span>
                  <span className="text-base font-bold text-foreground leading-tight">
                    {format(parseISO(viewEvent.date), "d")}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(viewEvent.date), "EEEE, MMMM d, yyyy")}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 w-fit ${typeColors[viewEvent.type] ?? ""}`}
                  >
                    {label(viewEvent.type)}
                  </Badge>
                </div>
              </div>
              {viewEvent.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {viewEvent.description}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
