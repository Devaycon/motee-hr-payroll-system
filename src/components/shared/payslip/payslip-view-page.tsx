"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Lock, Printer, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Badge } from "@/src/components/ui/badge";
import { useCan } from "@/src/lib/permissions/use-can";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { PAYROLL_MODULE, verifyHref } from "@/src/lib/payroll/constants";
import { usePayrollActions, usePayslip } from "@/src/lib/payroll/use-payroll";
import type { Payslip } from "@/src/lib/payroll/types";
import { PayslipDocument, PayslipPrintStyles } from "./payslip-document";

interface Props {
  payslipId: string;
  /** "hr" shows admin controls (revoke verification); "ess" is the employee's own view. */
  mode: "hr" | "ess";
  backHref: string;
  backLabel: string;
}

/** A finalized payslip as its own page — the view both HR and the employee open. */
export function PayslipViewPage({ payslipId, mode, backHref, backLabel }: Props) {
  const { payslip, loading, supported } = usePayslip(payslipId);
  const me = useAppSelector((s) => s.auth.user?.employeeId);
  const canViewPayroll = useCan(PAYROLL_MODULE, "view");
  const canAdminister = useCan(PAYROLL_MODULE, "edit");
  const actions = usePayrollActions();

  if (!supported) return <Unavailable backHref={backHref} backLabel={backLabel} message="Payslips are available for Nigerian tenants. UK payroll is the next statutory module." />;
  if (loading && !payslip) return <PageSkeleton />;
  if (!payslip) return <Unavailable backHref={backHref} backLabel={backLabel} message="This payslip doesn't exist or hasn't been issued yet." />;

  // Payslips are private: the employee themselves, or someone with payroll access.
  const own = !!me && me === payslip.employeeId;
  if (!own && !canViewPayroll && me) {
    return <Unavailable backHref={backHref} backLabel={backLabel} message="Payslips are confidential. Only the employee and payroll staff can open them." icon />;
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PayslipPrintStyles />
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {mode === "ess" ? "My payslip" : payslip.employee.fullName} · {payslip.period.label}
          </h1>
          <p className="text-xs text-muted-foreground">
            {payslip.reference} · issued {new Date(payslip.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <VerificationBadge payslip={payslip} />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => copyVerifyLink(payslip)}>
            <Copy className="h-3.5 w-3.5" /> Copy verification link
          </Button>
          {mode === "hr" && canAdminister && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                actions.setVerificationRevoked(payslip.id, !payslip.verification.revoked);
                toast.success(payslip.verification.revoked ? "Verification restored" : "Verification revoked — the code now reports this payslip as withdrawn");
              }}
            >
              {payslip.verification.revoked ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
              {payslip.verification.revoked ? "Restore verification" : "Revoke verification"}
            </Button>
          )}
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="payslip-print-root">
        <PayslipDocument payslip={payslip} />
      </div>
    </div>
  );
}

function copyVerifyLink(p: Payslip) {
  const url = `${window.location.origin}${verifyHref(p.verification.code)}`;
  void navigator.clipboard?.writeText(url).then(
    () => toast.success("Verification link copied", { description: "Anyone with the link can confirm this payslip is genuine — they see only name, period and net pay." }),
    () => toast.error("Couldn't copy the link"),
  );
}

function VerificationBadge({ payslip }: { payslip: Payslip }) {
  return payslip.verification.revoked ? (
    <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-600">Verification revoked</Badge>
  ) : (
    <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
      <ShieldCheck className="h-3 w-3" /> Verifiable · {payslip.verification.code}
    </Badge>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="mx-auto h-[1100px] w-full max-w-[880px] rounded-xl" />
    </div>
  );
}

function Unavailable({ backHref, backLabel, message, icon }: { backHref: string; backLabel: string; message: string; icon?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Link href={backHref} className="text-sm font-medium text-primary hover:underline">
        {backLabel}
      </Link>
    </div>
  );
}
