"use client";

import {
  Clock,
  CalendarDays,
  Wallet,
  ShieldCheck,
  Users,
  Layers,
  CheckCircle2,
  XCircle,
  Timer,
  Percent,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import {
  CONTRACT_DURATION_LABELS,
  CONTRACT_DURATION_STYLES,
  PAY_FREQUENCY_LABELS,
} from "../data";
import type { EmploymentTypeRow } from "../types";

interface Props {
  type: EmploymentTypeRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function BooleanChip({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        value ? "text-emerald-600" : "text-muted-foreground",
      )}
    >
      {value ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : (
        <XCircle className="w-3.5 h-3.5" />
      )}
      {value ? "Yes" : "No"}
    </span>
  );
}

export function EmploymentTypeDetailModal({ type, open, onOpenChange }: Props) {
  if (!type) return null;

  const durationStyle = CONTRACT_DURATION_STYLES[type.contractDuration];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-5 pt-10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold leading-tight truncate">
                {type.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {type.description}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[10px] font-medium ml-auto",
                type.isActive
                  ? "border-green-500/30 bg-green-500/10 text-green-600"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {type.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        <Separator />

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
          <div className="grid grid-cols-2 gap-4">
            <DetailRow icon={CalendarDays} label="Contract Duration">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-medium",
                  durationStyle.color,
                  durationStyle.bg,
                  durationStyle.border,
                )}
              >
                {CONTRACT_DURATION_LABELS[type.contractDuration]}
              </Badge>
            </DetailRow>

            <DetailRow icon={Wallet} label="Pay Frequency">
              <span className="text-sm">
                {PAY_FREQUENCY_LABELS[type.payFrequency]}
              </span>
            </DetailRow>

            <DetailRow icon={CalendarDays} label="Leave Entitlement">
              <span className="text-sm">{type.leaveEntitlement}</span>
            </DetailRow>

            <DetailRow icon={Users} label="Employees">
              <span className="text-sm font-medium">{type.employeeCount}</span>
            </DetailRow>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Working Hours
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow icon={Clock} label="Hours per Week">
                <span className="text-sm">
                  {type.workingHours.enabled
                    ? `${type.workingHours.hoursPerWeek}h`
                    : "—"}
                </span>
              </DetailRow>
              <DetailRow icon={Timer} label="Flexible Hours">
                <BooleanChip value={type.workingHours.flexibleHours} />
              </DetailRow>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Probation Period
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow icon={Timer} label="Enabled">
                <BooleanChip value={type.probationPeriod.enabled} />
              </DetailRow>
              {type.probationPeriod.enabled && (
                <>
                  <DetailRow icon={CalendarDays} label="Duration">
                    <span className="text-sm">
                      {type.probationPeriod.durationMonths} months
                    </span>
                  </DetailRow>
                  <DetailRow icon={CheckCircle2} label="Review Required">
                    <BooleanChip value={type.probationPeriod.reviewRequired} />
                  </DetailRow>
                </>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Pension Contribution
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow icon={Percent} label="Employee">
                <span className="text-sm">
                  {type.pensionContribution.enabled
                    ? `${type.pensionContribution.employeePercentage}%`
                    : "—"}
                </span>
              </DetailRow>
              <DetailRow icon={Percent} label="Employer">
                <span className="text-sm">
                  {type.pensionContribution.enabled
                    ? `${type.pensionContribution.employerPercentage}%`
                    : "—"}
                </span>
              </DetailRow>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Payroll & Deductions
            </p>
            <div className="grid grid-cols-2 gap-4">
              <DetailRow icon={Wallet} label="Payroll Inclusion">
                <BooleanChip value={type.payrollInclusion} />
              </DetailRow>
              <DetailRow icon={ShieldCheck} label="Statutory Deductions">
                {type.statutoryDeductions.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {type.statutoryDeductions.map((d) => (
                      <Badge
                        key={d}
                        variant="outline"
                        className="text-[10px] font-medium border-border bg-muted text-muted-foreground"
                      >
                        {d}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </DetailRow>
            </div>
          </div>

          {type.benefits.enabled && type.benefits.available.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  Benefits
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {type.benefits.available.map((b) => (
                    <Badge
                      key={b}
                      variant="outline"
                      className="text-[10px] font-medium border-primary/20 bg-primary/5 text-primary"
                    >
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
