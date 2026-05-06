"use client";

import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { LEAVE_POLICIES } from "@/src/data/leave-demo";
import type { LeaveTypeName } from "@/src/lib/types/leave";
import { TYPE_COLORS } from "./data";

interface PolicyModalProps {
  policy: (typeof LEAVE_POLICIES)[0] | null;
  onClose: () => void;
}

export function PolicyModal({ policy, onClose }: PolicyModalProps) {
  return (
    <Dialog open={!!policy} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        {policy && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{
                    background:
                      TYPE_COLORS[policy.leaveType as LeaveTypeName].bg,
                  }}
                >
                  <Info
                    className="w-4 h-4"
                    style={{
                      color: TYPE_COLORS[policy.leaveType as LeaveTypeName].bar,
                    }}
                  />
                </div>
                <DialogTitle className="text-sm font-semibold">
                  {policy.name}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-1">
              {policy.description && (
                <p className="text-xs text-muted-foreground">
                  {policy.description}
                </p>
              )}
              <Separator />
              {[
                {
                  label: "Max days/year",
                  value: `${policy.maxDaysPerYear} days`,
                },
                {
                  label: "Min notice required",
                  value:
                    policy.minNoticeDays === 0
                      ? "None"
                      : `${policy.minNoticeDays} days`,
                },
                {
                  label: "Max consecutive days",
                  value: `${policy.maxConsecutiveDays} days`,
                },
                {
                  label: "Medical cert required",
                  value: policy.requiresMedicalCertificate
                    ? "Yes (3+ consecutive days)"
                    : "No",
                },
                {
                  label: "Carry-over allowed",
                  value: policy.carryOverAllowed
                    ? `Yes — up to ${policy.maxCarryOverDays} days`
                    : "No",
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                >
                  <span className="text-[11px] text-muted-foreground">
                    {r.label}
                  </span>
                  <span className="text-[11px] font-medium text-foreground">
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
