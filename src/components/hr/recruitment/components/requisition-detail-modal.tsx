"use client";

import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import {
  REQUISITION_STATUS_LABELS,
  REQUISITION_STATUS_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  formatSalary,
} from "../data";
import type { JobRequisition } from "../types";

interface RequisitionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requisition: JobRequisition | null;
  onEdit: (req: JobRequisition) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClose: (id: string) => void;
  onViewApplicants: (req: JobRequisition) => void;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-36 shrink-0">
        {label}:
      </span>
      <span className="text-xs text-foreground font-medium flex-1">
        {value ?? <span className="italic text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

export function RequisitionDetailModal({
  open,
  onOpenChange,
  requisition,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onClose,
  onViewApplicants,
}: RequisitionDetailModalProps) {
  if (!requisition) return null;

  function act(fn: () => void) {
    fn();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Requisition Details</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {requisition.positionTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {requisition.department} · {requisition.hiringManager}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
              REQUISITION_STATUS_STYLES[requisition.status],
            )}
          >
            {REQUISITION_STATUS_LABELS[requisition.status]}
          </span>
        </div>

        <Separator />

        <div>
          <InfoRow
            label="Employment Type"
            value={EMPLOYMENT_TYPE_LABELS[requisition.employmentType]}
          />
          <InfoRow label="Openings" value={String(requisition.openings)} />
          <InfoRow
            label="Salary Range"
            value={`${formatSalary(requisition.salaryMin)} – ${formatSalary(requisition.salaryMax)}`}
          />
          <InfoRow
            label="Target Start Date"
            value={requisition.targetStartDate}
          />
          <InfoRow
            label="Applicants"
            value={String(requisition.applicantCount)}
          />
          <InfoRow label="Created" value={requisition.createdAt} />
        </div>

        {requisition.requiredSkills.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Required Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {requisition.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {requisition.jobDescription && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Job Description
            </p>
            <p className="text-xs text-foreground leading-relaxed">
              {requisition.jobDescription}
            </p>
          </div>
        )}

        <Separator />

        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => act(() => onEdit(requisition))}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => act(() => onViewApplicants(requisition))}
          >
            <Users className="w-3.5 h-3.5" />
            Applicants
          </Button>

          {requisition.status === "pending_approval" && (
            <>
              <Button
                size="sm"
                className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => act(() => onApprove(requisition.id))}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                onClick={() => act(() => onReject(requisition.id))}
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>
            </>
          )}

          {requisition.status === "approved" && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 text-muted-foreground"
              onClick={() => act(() => onClose(requisition.id))}
            >
              <Lock className="w-3.5 h-3.5" />
              Close Role
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive ml-auto"
            onClick={() => act(() => onDelete(requisition.id))}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
