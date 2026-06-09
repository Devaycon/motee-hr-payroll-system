"use client";

import { cn } from "@/src/lib/utils";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
} from "@/src/data/leave-demo";
import type { HistoryEntry } from "./data";

interface HistoryRowProps {
  request: HistoryEntry;
}

export function HistoryRow({ request }: HistoryRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
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
              month: "long",
            })}
            {" – "}
            {new Date(request.endDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="text-[11px] text-foreground font-medium">
            ({request.totalDays} day{request.totalDays > 1 ? "s" : ""})
          </span>
        </div>
        {request.notes && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {request.notes}
          </p>
        )}
        {request.rejectionReason && (
          <p className="text-[10px] text-red-500 mt-0.5 truncate">
            {request.rejectionReason}
          </p>
        )}
      </div>
      <span
        className={cn(
          "text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0",
          LEAVE_STATUS_STYLES[request.status],
        )}
      >
        {LEAVE_STATUS_LABELS[request.status]}
      </span>
    </div>
  );
}
