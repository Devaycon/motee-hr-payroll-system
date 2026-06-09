"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  CornerUpLeft,
  XCircle,
  RotateCcw,
  X,
  Circle,
  Paperclip,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  approveStep,
  rejectStep,
  returnToSender,
  resubmit,
  cancel,
  addComment,
} from "@/src/lib/stores/approvals-slice";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  type ApprovalAttachment,
  type ApprovalSignature,
} from "@/src/lib/types/approvals";
import { useCan } from "@/src/lib/permissions/use-can";
import {
  formatRelativeDate,
  isCurrentApprover,
  isSubmitter,
} from "./utils";
import {
  ApprovalActivityLog,
  ApprovalChainTimeline,
} from "./components/approval-log";
import {
  SignatureDialog,
  type ApproveSignaturePayload,
} from "./components/signature-dialog";

interface ApprovalDetailPageProps {
  requestId: string;
  basePath?: string;
}

export function ApprovalDetailPage({
  requestId,
  basePath = "/hr-action-center/submissions",
}: ApprovalDetailPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const request = useAppSelector((s) =>
    s.approvals.requests.find((r) => r.id === requestId),
  );
  const workflow = useAppSelector((s) =>
    request
      ? s.approvals.templates.find((t) => t.id === request.chainTemplateId) ??
        null
      : null,
  );
  const canApprove = useCan("submissions.queue", "approve");

  const [note, setNote] = useState("");
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);

  const youAreCurrent = useMemo(
    () =>
      request ? isCurrentApprover(request, user?.employeeId, user?.roleId) : false,
    [request, user],
  );
  const youAreSubmitter = useMemo(
    () => (request ? isSubmitter(request, user?.employeeId) : false),
    [request, user],
  );

  if (!request) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const currentStep = request.steps[request.currentStepIndex];
  const actor = user
    ? { employeeId: user.employeeId, name: user.name }
    : null;

  function ensureUser() {
    if (!actor) {
      toast.error("You must be logged in to act on approvals.");
      return false;
    }
    return true;
  }

  function handleApprove() {
    if (!ensureUser()) return;
    // If the workflow requires reviewer signatures, route through the
    // signature-collection dialog instead of dispatching directly.
    if (workflow?.signatures.reviewerSigns) {
      setSignatureOpen(true);
      return;
    }
    dispatchApprove();
  }

  function dispatchApprove(signature?: ApproveSignaturePayload) {
    dispatch(
      approveStep({
        requestId: request!.id,
        actorEmployeeId: actor!.employeeId,
        actorName: actor!.name,
        note: signature?.note ?? (note.trim() || undefined),
        signature: signature
          ? { dataUrl: signature.dataUrl, placement: signature.placement }
          : undefined,
      }),
    );
    setNote("");
    setSignatureOpen(false);
    toast.success(
      currentStep && request!.currentStepIndex === request!.steps.length - 1
        ? "Approved — workflow complete"
        : "Approved — sent to next approver",
    );
  }

  function handleReject() {
    if (!ensureUser()) return;
    if (!note.trim()) {
      toast.error("Add a reason before rejecting.");
      return;
    }
    dispatch(
      rejectStep({
        requestId: request!.id,
        actorEmployeeId: actor!.employeeId,
        actorName: actor!.name,
        note: note.trim(),
      }),
    );
    setNote("");
    toast.success("Rejected");
  }

  function handleReturn() {
    if (!ensureUser()) return;
    if (!note.trim()) {
      toast.error("Add a note explaining what needs revision.");
      return;
    }
    dispatch(
      returnToSender({
        requestId: request!.id,
        actorEmployeeId: actor!.employeeId,
        actorName: actor!.name,
        note: note.trim(),
      }),
    );
    setNote("");
    toast.success("Sent back to sender");
  }

  function handleResubmit() {
    if (!ensureUser()) return;
    dispatch(
      resubmit({
        requestId: request!.id,
        actorEmployeeId: actor!.employeeId,
        actorName: actor!.name,
        updatedTitle: editTitle?.trim() || undefined,
        updatedSummary: editSummary?.trim() || undefined,
        note: note.trim() || undefined,
      }),
    );
    setNote("");
    setEditTitle(null);
    setEditSummary(null);
    toast.success("Resubmitted — chain restarted");
  }

  function handleCancel() {
    if (!ensureUser()) return;
    dispatch(
      cancel({
        requestId: request!.id,
        actorEmployeeId: actor!.employeeId,
        actorName: actor!.name,
      }),
    );
    toast.success("Withdrawn");
    router.push(basePath);
  }

  function handleComment() {
    if (!ensureUser()) return;
    if (!note.trim()) return;
    dispatch(
      addComment({
        requestId: request!.id,
        actorEmployeeId: actor!.employeeId,
        actorName: actor!.name,
        note: note.trim(),
      }),
    );
    setNote("");
  }

  const showApproverActions =
    youAreCurrent && canApprove && request.status === "in_progress";
  const showSubmitterReturned =
    youAreSubmitter && request.status === "returned";
  const showSubmitterCancel =
    youAreSubmitter && request.status === "in_progress";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 pt-6">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to submissions
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wide"
            >
              {DOCUMENT_TYPE_LABELS[request.documentType]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-2 py-0.5 font-medium",
                STATUS_STYLES[request.status],
              )}
            >
              {STATUS_LABELS[request.status]}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {request.documentTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {request.documentSummary}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <PersonAvatar
              name={request.submittedBy.name}
              initials={request.submittedBy.initials}
              className="size-6"
              fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
            />
            <span>
              Submitted by{" "}
              <span className="text-foreground font-medium">
                {request.submittedBy.name}
              </span>{" "}
              · {request.submittedBy.departmentName} ·{" "}
              {formatRelativeDate(request.submittedAt)}
            </span>
          </div>
        </div>
      </div>

      <CurrentlyWithBanner request={request} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Submission details
              </h2>
            </CardHeader>
            <CardContent className="px-5 py-4">
              {Object.keys(request.payloadSnapshot).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No additional fields captured.
                </p>
              ) : (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {Object.entries(request.payloadSnapshot).map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5">
                      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {k}
                      </dt>
                      <dd className="text-foreground">
                        {typeof v === "string" || typeof v === "number"
                          ? String(v)
                          : JSON.stringify(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          {request.attachments.length > 0 && (
            <AttachmentsCard
              attachments={request.attachments}
              signatures={request.signatures}
              placeOnDocument={
                workflow?.signatures.placeOnDocument ?? false
              }
            />
          )}

          {(showApproverActions || showSubmitterReturned || showSubmitterCancel) && (
            <Card>
              <CardHeader className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {showApproverActions
                    ? "Your decision"
                    : showSubmitterReturned
                      ? "Edit & resubmit"
                      : "Withdraw submission"}
                </h2>
              </CardHeader>
              <CardContent className="px-5 py-4 space-y-3">
                {showSubmitterReturned && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        Title
                      </label>
                      <Textarea
                        rows={1}
                        value={editTitle ?? request.documentTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">
                        Summary
                      </label>
                      <Textarea
                        rows={2}
                        value={editSummary ?? request.documentSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Textarea
                  placeholder={
                    showApproverActions
                      ? "Add a note for the next person / sender..."
                      : showSubmitterReturned
                        ? "Optional note on what changed..."
                        : "Add a note (optional)..."
                  }
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />

                <div className="flex flex-wrap items-center gap-2">
                  {showApproverActions && (
                    <>
                      <Button onClick={handleApprove} className="gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReturn}
                        className="gap-1.5 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600"
                      >
                        <CornerUpLeft className="w-4 h-4" />
                        Return to sender
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReject}
                        className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {showSubmitterReturned && (
                    <Button onClick={handleResubmit} className="gap-1.5">
                      <RotateCcw className="w-4 h-4" />
                      Resubmit
                    </Button>
                  )}
                  {showSubmitterCancel && (
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Withdraw
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={handleComment}
                    disabled={!note.trim()}
                  >
                    Just comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ApprovalActivityLog request={request} />
        </div>

        <div className="flex flex-col gap-4">
          <ApprovalChainTimeline request={request} />
        </div>
      </div>

      <SignatureDialog
        open={signatureOpen}
        onOpenChange={setSignatureOpen}
        attachments={request.attachments}
        placeOnDocument={workflow?.signatures.placeOnDocument ?? false}
        onConfirm={(payload) => {
          if (!ensureUser()) return;
          dispatchApprove(payload);
        }}
      />
    </div>
  );
}

function AttachmentsCard({
  attachments,
  signatures,
  placeOnDocument,
}: {
  attachments: ApprovalAttachment[];
  signatures: ApprovalSignature[];
  placeOnDocument: boolean;
}) {
  function formatBytes(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  }
  return (
    <Card>
      <CardHeader className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5" />
          Attachments ({attachments.length})
        </h2>
      </CardHeader>
      <CardContent className="px-5 py-4 space-y-4">
        {attachments.map((att) => {
          const isImage = att.mimeType.startsWith("image/");
          const overlays = signatures.filter(
            (s) => s.placement?.attachmentId === att.id,
          );
          return (
            <div key={att.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="truncate text-foreground">
                      {att.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {att.mimeType} · {formatBytes(att.sizeBytes)}
                    </span>
                  </div>
                </div>
                <a
                  href={att.dataUrl}
                  download={att.name}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
              </div>
              {isImage && placeOnDocument && (
                <div className="relative rounded-md overflow-hidden border border-border bg-muted/30">
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="block w-full"
                  />
                  {overlays.map((sig) => {
                    if (!sig.placement) return null;
                    return (
                      <img
                        key={sig.id}
                        src={sig.dataUrl}
                        alt={`Signed by ${sig.signerName}`}
                        title={`Signed by ${sig.signerName}`}
                        className="absolute pointer-events-none"
                        style={{
                          left: `${sig.placement.x * 100}%`,
                          top: `${sig.placement.y * 100}%`,
                          width: `${sig.placement.width * 100}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CurrentlyWithBanner({
  request,
}: {
  request: import("@/src/lib/types/approvals").ApprovalRequest;
}) {
  const totalSteps = request.steps.length;

  if (request.status === "approved") {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500 text-white">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Fully approved
          </span>
          <span className="text-xs text-muted-foreground">
            All {totalSteps} step{totalSteps === 1 ? "" : "s"} completed
          </span>
        </div>
      </div>
    );
  }

  if (request.status === "rejected") {
    const step = request.steps[request.currentStepIndex];
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500 text-white">
          <XCircle className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-red-700 dark:text-red-400">
            Rejected by {step?.resolvedEmployeeName ?? step?.label ?? "approver"}
          </span>
          {step?.note && (
            <span className="text-xs text-muted-foreground italic mt-0.5">
              “{step.note}”
            </span>
          )}
        </div>
      </div>
    );
  }

  if (request.status === "returned") {
    const step = request.steps[request.currentStepIndex];
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-5 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white">
          <CornerUpLeft className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-500">
            Sent back to sender for revision
          </span>
          {step?.note && (
            <span className="text-xs text-muted-foreground italic mt-0.5">
              “{step.note}”
            </span>
          )}
        </div>
      </div>
    );
  }

  if (request.status === "cancelled") {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-5 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted">
          <X className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            Withdrawn by submitter
          </span>
        </div>
      </div>
    );
  }

  // in_progress
  const currentStep = request.steps[request.currentStepIndex];
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-5 py-4 flex items-center gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500 text-white animate-pulse">
        <Circle className="w-3 h-3 fill-white" />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          Currently with{" "}
          {currentStep?.resolvedEmployeeName ?? currentStep?.label ?? "approver"}
        </span>
        <span className="text-xs text-muted-foreground">
          Step {request.currentStepIndex + 1} of {totalSteps}
          {currentStep?.label ? ` — ${currentStep.label}` : ""}
        </span>
      </div>
      {currentStep?.resolvedEmployeeName && (
        <PersonAvatar
          name={currentStep.resolvedEmployeeName}
          className="size-9"
          fallbackClassName="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold"
        />
      )}
    </div>
  );
}
