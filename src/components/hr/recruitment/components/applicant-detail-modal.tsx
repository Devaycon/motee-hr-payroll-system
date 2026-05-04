"use client";

import { ArrowRight, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import {
  STAGE_LABELS,
  STAGE_STYLES,
  STAGE_ORDER,
  SOURCE_LABELS,
} from "../data";
import type { Applicant, ApplicationStage } from "../types";

interface ApplicantDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant | null;
  onStageChange: (id: string, stage: ApplicationStage) => void;
  onReject: (id: string) => void;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-32 shrink-0">
        {label}:
      </span>
      <span className="text-xs text-foreground font-medium flex-1">
        {value ?? <span className="italic text-muted-foreground/50">—</span>}
      </span>
    </div>
  );
}

export function ApplicantDetailModal({
  open,
  onOpenChange,
  applicant,
  onStageChange,
  onReject,
}: ApplicantDetailModalProps) {
  if (!applicant) return null;

  const currentIdx = STAGE_ORDER.indexOf(applicant.stage);
  const nextStage =
    applicant.stage !== "rejected" && applicant.stage !== "hired"
      ? STAGE_ORDER[currentIdx + 1]
      : null;

  function handleMoveNext() {
    if (!applicant || !nextStage) return;
    onStageChange(applicant.id, nextStage);
    onOpenChange(false);
  }

  function handleReject() {
    if (!applicant) return;
    onReject(applicant.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Applicant Details</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
              {applicant.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {applicant.name}
            </p>
            <p className="text-xs text-muted-foreground">{applicant.email}</p>
          </div>
          <span
            className={cn(
              "ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              STAGE_STYLES[applicant.stage],
            )}
          >
            {STAGE_LABELS[applicant.stage]}
          </span>
        </div>

        <Separator />

        <div>
          <InfoRow label="Position" value={applicant.requisitionTitle} />
          <InfoRow label="Phone" value={applicant.phone} />
          <InfoRow label="Source" value={SOURCE_LABELS[applicant.source]} />
          <InfoRow
            label="Applied"
            value={applicant.applicationDate ?? applicant.appliedAt}
          />
          <InfoRow label="Last updated" value={applicant.updatedAt} />
          {applicant.notes && <InfoRow label="Notes" value={applicant.notes} />}
        </div>

        {(nextStage ||
          (applicant.stage !== "rejected" && applicant.stage !== "hired")) && (
          <>
            <Separator />
            <div className="flex items-center justify-between gap-2 pt-1">
              {applicant.stage !== "rejected" &&
                applicant.stage !== "hired" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                    onClick={handleReject}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                )}
              {nextStage && (
                <Button
                  size="sm"
                  className="text-xs gap-1.5 ml-auto"
                  onClick={handleMoveNext}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Move to {STAGE_LABELS[nextStage]}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
