"use client";

import { Clock, Trash2, FileText } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_STYLES } from "@/src/data/leave-demo";
import type { LeaveRequestEntry } from "./types";

interface RequestCardProps {
  request: LeaveRequestEntry;
  onView: (r: LeaveRequestEntry) => void;
  onCancel: (id: string) => void;
}

export function RequestCard({ request, onView, onCancel }: RequestCardProps) {
  return (
    <Card className="border-amber-500/20">
      <CardContent className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                LEAVE_TYPE_STYLES[request.leaveType],
              )}
            >
              {LEAVE_TYPE_LABELS[request.leaveType]}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(request.startDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
              {" – "}
              {new Date(request.endDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="text-[11px] font-medium text-foreground">
              ({request.totalDays} day{request.totalDays !== 1 ? "s" : ""})
            </span>
          </div>
          {request.notes && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {request.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onView(request)}
          >
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-red-500"
            onClick={() => onCancel(request.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
