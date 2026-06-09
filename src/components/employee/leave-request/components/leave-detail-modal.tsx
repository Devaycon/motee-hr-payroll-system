"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  LEAVE_STATUS_STYLES,
  LEAVE_STATUS_LABELS,
} from "@/src/data/leave-demo";
import type { LeaveRequestEntry } from "./types";

import { formatDate } from "@/src/lib/utils/format-date";

interface LeaveDetailModalProps {
  request: LeaveRequestEntry | null;
  onClose: () => void;
  onCancelRequest: (id: string) => void;
}

export function LeaveDetailModal({
  request,
  onClose,
  onCancelRequest,
}: LeaveDetailModalProps) {
  return (
    <Dialog open={!!request} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        {request && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                    LEAVE_TYPE_STYLES[request.leaveType],
                  )}
                >
                  {LEAVE_TYPE_LABELS[request.leaveType]}
                </div>
                <DialogTitle className="text-sm font-semibold">
                  Leave Request Details
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-1 py-1">
              {[
                { label: "Start date", value: formatDate(request.startDate) },
                { label: "End date", value: formatDate(request.endDate) },
                {
                  label: "Duration",
                  value: `${request.totalDays} day${request.totalDays !== 1 ? "s" : ""}${request.isHalfDay ? ` (${request.halfDayPeriod} half-day)` : ""}`,
                },
                {
                  label: "Submitted",
                  value: formatDate(request.submittedAt),
                },
                ...(request.approvedBy
                  ? [{ label: "Approved by", value: request.approvedBy }]
                  : []),
                ...(request.rejectionReason
                  ? [{ label: "Reason", value: request.rejectionReason }]
                  : []),
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0 gap-4"
                >
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {r.label}
                  </span>
                  <span className="text-[11px] font-medium text-foreground text-right">
                    {r.value}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 gap-4">
                <span className="text-[11px] text-muted-foreground shrink-0">
                  Status
                </span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                    LEAVE_STATUS_STYLES[request.status],
                  )}
                >
                  {LEAVE_STATUS_LABELS[request.status]}
                </span>
              </div>
              {request.notes && (
                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Notes
                  </p>
                  <p className="text-xs text-foreground">{request.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={onClose}
              >
                Close
              </Button>
              {request.status === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-red-500/30 text-red-600 hover:bg-red-500/10"
                  onClick={() => {
                    onCancelRequest(request.id);
                    onClose();
                  }}
                >
                  Cancel Request
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
