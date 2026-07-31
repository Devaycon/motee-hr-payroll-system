"use client";

import { useState } from "react";
import { AlertTriangle, FileText, Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
} from "../data";
import { ApprovalStepper } from "./approval-stepper";
import type { LeaveConflict } from "@/src/lib/leave/conflicts";
import type { LeaveStage } from "@/src/lib/leave/stages";
import { isOpenLeaveStatus } from "@/src/lib/types/leave";
import type { LeaveRequest, LeaveTypeName } from "../types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatStamp(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-0.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  viewingRequest: LeaveRequest | null;
  /** Approving advances one stage; the caller decides the target status. */
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, reason: string) => void;
  onCancel?: (id: string) => void;
  stages: LeaveStage[];
  conflicts: LeaveConflict[];
  canApprove: boolean;
}

/**
 * Full request detail panel — reason, documents, notes, approval history,
 * approver comments and timestamps, plus the multi-stage chain and any
 * coverage conflicts (client feedback round 2, §F3/F4/F8).
 */
export function ReviewModal({
  open,
  onClose,
  viewingRequest,
  onApprove,
  onReject,
  onCancel,
  stages,
  conflicts,
  canApprove,
}: ReviewModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevRequest, setPrevRequest] = useState<LeaveRequest | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [approveComment, setApproveComment] = useState("");

  if (open !== prevOpen || viewingRequest !== prevRequest) {
    setPrevOpen(open);
    setPrevRequest(viewingRequest);
    if (open) {
      setShowReject(false);
      setRejectReason("");
      setRejectError("");
      setApproveComment("");
    }
  }

  if (!viewingRequest) return null;
  const req = viewingRequest;
  const isOpenRequest = isOpenLeaveStatus(req.status);

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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
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
                <DialogDescription className="text-xs mt-0.5">
                  {req.jobTitle} · {req.department}
                  {req.managerName && ` · Reports to ${req.managerName}`}
                </DialogDescription>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0",
                LEAVE_STATUS_STYLES[req.status],
              )}
            >
              {LEAVE_STATUS_LABELS[req.status]}
            </span>
          </div>
        </DialogHeader>

        {/* Where the request sits in the approval chain (§F4/F7). */}
        <ApprovalStepper status={req.status} stages={stages} />

        {req.status === "rejected" && req.rejectionReason && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-xs text-destructive">
            <span className="font-semibold">Rejection reason: </span>
            {req.rejectionReason}
          </div>
        )}

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Leave Type">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                  LEAVE_TYPE_STYLES[req.leaveType as LeaveTypeName],
                )}
              >
                {LEAVE_TYPE_LABELS[req.leaveType as LeaveTypeName]}
              </span>
            </Field>
            <Field label="Duration">
              <p className="text-sm font-semibold">
                {req.totalDays === 0.5
                  ? "½ day"
                  : `${req.totalDays} day${req.totalDays !== 1 ? "s" : ""}`}
              </p>
            </Field>
          </div>

          <Field label="Date Range">
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
          </Field>

          {req.reason && (
            <Field label="Reason for leave">
              <p className="text-xs whitespace-pre-wrap">{req.reason}</p>
            </Field>
          )}

          {req.notes && (
            <Field label="Internal notes">
              <p className="text-xs whitespace-pre-wrap">{req.notes}</p>
            </Field>
          )}

          {/* Who is covering while they are away (client feedback §3.2). */}
          <Field label="Relief employee">
            {req.reliefEmployeeName ? (
              <p className="text-xs font-medium">{req.reliefEmployeeName}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No cover assigned
              </p>
            )}
          </Field>

          {/* Supporting documents (§F3). */}
          <Field label="Supporting documents">
            {req.documents && req.documents.length > 0 ? (
              <ul className="space-y-1 pt-0.5">
                {req.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2 text-xs">
                    <Paperclip className="w-3 h-3 shrink-0 text-muted-foreground" />
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {doc.name}
                      </a>
                    ) : (
                      <span className="truncate">{doc.name}</span>
                    )}
                    {doc.size ? (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatBytes(doc.size)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">None attached.</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Submitted">
              <p className="text-xs">{formatStamp(req.createdAt ?? req.submittedAt)}</p>
              {req.submittedBy && (
                <p className="text-[10px] text-muted-foreground">by {req.submittedBy}</p>
              )}
            </Field>
            <Field label="Last modified">
              <p className="text-xs">{formatStamp(req.updatedAt ?? req.createdAt)}</p>
            </Field>
          </div>

          {/* Approval history / audit trail (§F3). */}
          <Field label="Approval history">
            {req.history && req.history.length > 0 ? (
              <ol className="space-y-2 pt-1">
                {req.history.map((h) => (
                  <li key={h.id} className="flex gap-2 text-xs">
                    <FileText className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {h.action}
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {h.actor}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatStamp(h.at)}
                      </p>
                      {h.comment && (
                        <p className="text-[11px] italic text-muted-foreground mt-0.5">
                          &ldquo;{h.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">
                No activity recorded yet.
              </p>
            )}
          </Field>
        </div>

        {/* Conflicts show whenever the request is open, not only at approval. */}
        {isOpenRequest && conflicts.length > 0 && (
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                <p>{c.message}</p>
              </div>
            ))}
          </div>
        )}

        {isOpenRequest && canApprove && (
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
              <div className="space-y-2">
                <Textarea
                  className="text-xs min-h-14 resize-none"
                  placeholder="Add a comment for the approval record (optional)..."
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                />
                <div className="flex items-center gap-2 justify-end">
                  {onCancel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-muted-foreground mr-auto"
                      onClick={() => {
                        onCancel(req.id);
                        onClose();
                      }}
                    >
                      Cancel request
                    </Button>
                  )}
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
                      onApprove(req.id, approveComment.trim() || undefined);
                      onClose();
                    }}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
