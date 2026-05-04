"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
} from "../data";
import type { LeaveRequest, LeaveTypeName } from "../types";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  viewingRequest: LeaveRequest | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export function ReviewModal({
  open,
  onClose,
  viewingRequest,
  onApprove,
  onReject,
}: ReviewModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevRequest, setPrevRequest] = useState<LeaveRequest | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  if (open !== prevOpen || viewingRequest !== prevRequest) {
    setPrevOpen(open);
    setPrevRequest(viewingRequest);
    if (open) {
      setShowReject(false);
      setRejectReason("");
      setRejectError("");
    }
  }

  if (!viewingRequest) return null;

  const req = viewingRequest;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function handleConfirmReject() {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a rejection reason");
      return;
    }
    onReject(req.id, rejectReason.trim());
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                {req.employeeInitials}
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold leading-tight">
                  {req.employeeName}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {req.jobTitle} · {req.department}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 ${LEAVE_STATUS_STYLES[req.status]}`}
            >
              {LEAVE_STATUS_LABELS[req.status]}
            </span>
          </div>
        </DialogHeader>

        {req.status === "rejected" && req.rejectionReason && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-xs text-destructive">
            <span className="font-semibold">Rejection Reason: </span>
            {req.rejectionReason}
          </div>
        )}

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Leave Type</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_TYPE_STYLES[req.leaveType as LeaveTypeName]}`}
              >
                {LEAVE_TYPE_LABELS[req.leaveType as LeaveTypeName]}
              </span>
            </div>
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Duration</p>
              <p className="text-sm font-semibold">
                {req.totalDays === 0.5
                  ? "½ day"
                  : `${req.totalDays} day${req.totalDays !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-1">
            <p className="text-[10px] text-muted-foreground">Date Range</p>
            <p className="text-xs font-medium">
              {req.startDate === req.endDate
                ? formatDate(req.startDate)
                : `${formatDate(req.startDate)} – ${formatDate(req.endDate)}`}
            </p>
            {req.isHalfDay && req.halfDayPeriod && (
              <p className="text-[10px] text-muted-foreground capitalize">
                {req.halfDayPeriod} half-day
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Submitted</p>
              <p className="text-xs">
                {new Date(req.submittedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            {req.approvedAt && (
              <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">
                  {req.status === "approved" ? "Approved by" : "Actioned by"}
                </p>
                <p className="text-xs font-medium">{req.approvedBy}</p>
              </div>
            )}
          </div>

          {req.notes && (
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Notes</p>
              <p className="text-xs">{req.notes}</p>
            </div>
          )}
        </div>

        {req.status === "pending" && (
          <div className="space-y-2.5 pt-1">
            {showReject ? (
              <div className="space-y-2">
                <Textarea
                  className="text-xs min-h-16 resize-none"
                  placeholder="Enter rejection reason..."
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError("");
                  }}
                />
                {rejectError && (
                  <p className="text-[10px] text-destructive">{rejectError}</p>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setShowReject(false);
                      setRejectReason("");
                      setRejectError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-8"
                    onClick={handleConfirmReject}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowReject(true)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    onApprove(req.id);
                    onClose();
                  }}
                >
                  Approve Request
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
