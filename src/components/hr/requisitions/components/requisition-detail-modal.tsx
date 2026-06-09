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
import { formatDate } from "@/src/lib/utils/format-date";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  type ApprovalStatus,
} from "@/src/lib/types/approvals";
import type { Requisition } from "@/src/lib/stores/requisitions-slice";
import {
  ApprovalActivityLog,
  ApprovalChainTimeline,
} from "@/src/components/hr/approvals/components/approval-log";

interface RequisitionDetailModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  requisition: Requisition | null;
}

export function RequisitionDetailModal({
  open,
  onOpenChange,
  requisition,
}: RequisitionDetailModalProps) {
  const approval = useAppSelector((s) =>
    requisition?.approvalRequestId
      ? s.approvals.requests.find((r) => r.id === requisition.approvalRequestId)
      : undefined,
  );

  if (!requisition) return null;

  const status: ApprovalStatus = approval?.status ?? "draft";
  const salary = `${formatMoneyLocale(requisition.salaryMin)} – ${formatMoneyLocale(requisition.salaryMax)}`;

  const facts: { label: string; value: string }[] = [
    { label: "Source workforce", value: requisition.workforceLabel },
    { label: "Department", value: requisition.department },
    { label: "Location", value: requisition.location || "—" },
    { label: "Positions", value: String(requisition.numberOfPositions) },
    { label: "Salary range", value: salary },
    { label: "Start date", value: requisition.startDate ? formatDate(requisition.startDate) : "—" },
    {
      label: "Duration",
      value: requisition.durationMonths ? `${requisition.durationMonths} months` : "Permanent",
    },
    { label: "Reporting manager", value: requisition.reportingManager || "—" },
    { label: "Budget", value: formatMoneyLocale(requisition.budgetAllocation) },
    { label: "Raised by", value: requisition.createdByName },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {requisition.title} — {requisition.department}
            <Badge
              variant="outline"
              className={cn("text-[10px]", STATUS_STYLES[status])}
            >
              {STATUS_LABELS[status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">{requisition.jobDescription}</p>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border/60 p-4 text-sm sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-0.5">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>

          {requisition.qualifications && (
            <div className="rounded-lg border border-border/60 p-4 text-sm">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                Required qualifications
              </p>
              <p className="text-foreground">{requisition.qualifications}</p>
            </div>
          )}

          {approval ? (
            <div className="space-y-4">
              <ApprovalChainTimeline request={approval} />
              <ApprovalActivityLog request={approval} />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              This requisition is still a draft — it hasn&apos;t been submitted to the
              approval chain yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
