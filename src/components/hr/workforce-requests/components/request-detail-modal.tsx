"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  type ApprovalStatus,
} from "@/src/lib/types/approvals";
import type { WorkforceRequest } from "@/src/lib/stores/workforce-requests-slice";
import {
  ApprovalActivityLog,
  ApprovalChainTimeline,
} from "@/src/components/hr/approvals/components/approval-log";

interface RequestDetailModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: WorkforceRequest | null;
}

export function RequestDetailModal({
  open,
  onOpenChange,
  request,
}: RequestDetailModalProps) {
  const approval = useAppSelector((s) =>
    request?.approvalRequestId
      ? s.approvals.requests.find((r) => r.id === request.approvalRequestId)
      : undefined,
  );

  if (!request) return null;

  const status: ApprovalStatus = approval?.status ?? "draft";

  const facts: { label: string; value: string }[] = [
    { label: "Department", value: request.department },
    { label: "Number of hires", value: String(request.numberOfHires) },
    { label: "Urgency", value: request.urgency },
    { label: "Budget estimate", value: formatMoneyLocale(request.budgetEstimate) },
    { label: "Expected start", value: request.expectedStartDate || "—" },
    { label: "Raised by", value: request.createdByName },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {request.numberOfHires} hire
            {request.numberOfHires === 1 ? "" : "s"} — {request.department}
            <Badge
              variant="outline"
              className={cn("text-[10px]", STATUS_STYLES[status])}
            >
              {STATUS_LABELS[status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">{request.reason}</p>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border/60 p-4 text-sm sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="text-foreground capitalize">{f.value}</dd>
              </div>
            ))}
          </dl>

          {approval ? (
            <div className="space-y-4">
              <ApprovalChainTimeline request={approval} />
              <ApprovalActivityLog request={approval} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              This request is still a draft — it hasn&apos;t been submitted to the
              approval chain yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
