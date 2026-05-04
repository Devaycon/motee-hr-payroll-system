"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Trash2, Eye } from "lucide-react";
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
import { EVENT_TYPE_COLORS } from "../data";
import type { CalEvent } from "../types";

interface AllEventsListProps {
  events: CalEvent[];
  onDelete: (id: string) => void;
}

export function AllEventsList({ events, onDelete }: AllEventsListProps) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const [viewEvent, setViewEvent] = useState<CalEvent | null>(null);

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
              No events yet. Click New Event to create one.
            </p>
          ) : (
            <div className="flex flex-col">
              {sorted.map((ev) => (
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
                      className={`text-[10px] px-1.5 py-0 mt-1 ${EVENT_TYPE_COLORS[ev.type]}`}
                    >
                      {ev.type}
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
                    className={`text-[10px] px-1.5 py-0 w-fit ${EVENT_TYPE_COLORS[viewEvent.type]}`}
                  >
                    {viewEvent.type}
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
