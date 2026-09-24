"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Progress } from "@/src/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { useCan } from "@/src/lib/permissions/use-can";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";
import { STATUS_LABELS as APPROVAL_STATUS_LABELS } from "@/src/lib/types/approvals";
import {
  loanTypeLabel,
  repaymentSchedule,
  type InstalmentStatus,
} from "@/src/lib/loans/loans";
import { useEmployeeLoanRows, useLoanActions, useLoans, type LoanRow } from "@/src/lib/loans/use-loans";
import { LoanStatusBadge } from "./components/loan-register-table";

const INSTALMENT_STYLES: Record<InstalmentStatus, string> = {
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  due: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  overdue: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  upcoming: "border-border bg-muted text-muted-foreground",
};

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

/** HR view: resolves the loan from the scoped register. */
export function HrLoanDetailPage({ loanId }: { loanId: string }) {
  const { rows, loading } = useLoans();
  const loan = rows.find((r) => r.id === loanId);
  return <LoanDetail loan={loan} loading={loading} audience="hr" backHref="/organization/loans" />;
}

/** Employee view: only ever their own loans. */
export function SelfLoanDetailPage({ loanId, employeeId }: { loanId: string; employeeId?: string }) {
  const { rows, loading } = useEmployeeLoanRows(employeeId);
  const loan = rows.find((r) => r.id === loanId);
  return <LoanDetail loan={loan} loading={loading} audience="self" backHref="/employee/loans" />;
}

function LoanDetail({
  loan,
  loading,
  audience,
  backHref,
}: {
  loan: LoanRow | undefined;
  loading: boolean;
  audience: "hr" | "self";
  backHref: string;
}) {
  const router = useRouter();
  const { format } = useCurrency();
  const canManage = useCan("organization.loans", "edit") && audience === "hr";
  const canApprove = useCan("organization.loans", "approve") && audience === "hr";
  const actions = useLoanActions();
  const [repayOpen, setRepayOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [confirmDefault, setConfirmDefault] = useState(false);

  const schedule = useMemo(() => (loan ? repaymentSchedule(loan) : []), [loan]);

  if (!loan) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">{loading ? "Loading loan…" : "Loan not found."}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href={backHref}>Back to loans</Link>
        </Button>
      </div>
    );
  }

  const repaidPct = loan.amount ? Math.round((Math.min(loan.amountRepaid, loan.amount) / loan.amount) * 100) : 0;
  const live = loan.status === "active" || loan.status === "defaulted";
  const request = loan.request;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground"
          onClick={() => router.push(backHref)}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Loans
        </Button>
        <span className="text-xs text-muted-foreground">/ {loan.id}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{loanTypeLabel(loan.loanType)}</h1>
            <LoanStatusBadge status={loan.status} />
          </div>
          {audience === "hr" && loan.employee && (
            <EmployeeLink name={loan.employee.fullName} employeeId={loan.employeeId} gender={loan.employee.gender} />
          )}
          {loan.purpose && <p className="text-xs text-muted-foreground">Purpose: {loan.purpose}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {canApprove && loan.status === "pending" && !request && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  actions.decide(loan, false);
                  toast.success("Loan request rejected");
                }}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  actions.decide(loan, true);
                  toast.success("Loan approved and issued");
                }}
              >
                Approve & issue
              </Button>
            </>
          )}
          {canManage && live && (
            <>
              <Button variant="outline" onClick={() => setRepayOpen(true)}>
                Record repayment
              </Button>
              {loan.status === "active" && (
                <Button variant="outline" className="text-rose-600" onClick={() => setConfirmDefault(true)}>
                  Mark defaulted
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="grid grid-cols-2 gap-4 px-5 py-4 md:grid-cols-4">
          <Fact label="Loan amount" value={format(loan.amount)} />
          <Fact label="Date issued" value={loan.issuedAt ? formatDate(loan.issuedAt) : "Not yet issued"} />
          <Fact label="Repayment period" value={`${loan.repaymentMonths} months`} />
          <Fact label="Monthly repayment" value={format(loan.monthlyRepayment, { decimals: true })} />
          <Fact label="Repaid to date" value={format(loan.amountRepaid, { decimals: true })} />
          <Fact label="Outstanding balance" value={format(loan.outstanding, { decimals: true })} />
          <Fact label="Interest" value={loan.interestRatePct ? `${loan.interestRatePct}% p.a.` : "Interest-free"} />
          <Fact label="Approver" value={loan.approverName ?? "—"} />
          {live && (
            <div className="col-span-2 md:col-span-4">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{repaidPct}% repaid</span>
                <span>Requested {formatDate(loan.requestedAt)}</span>
              </div>
              <Progress value={repaidPct} className="mt-1 h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>

      {request && (
        <Card className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between px-5 pt-4 pb-2">
            <CardTitle className="text-sm">Approval — {APPROVAL_STATUS_LABELS[request.status]}</CardTitle>
            <Link
              href={
                audience === "hr"
                  ? `/hr-action-center/submissions/${request.id}`
                  : `/employee/submissions/${request.id}`
              }
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open submission <ExternalLink className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2 px-5 pb-4">
            {request.steps.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground">→</span>}
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px]",
                    s.status === "approved"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : s.status === "rejected"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                        : i === request.currentStepIndex && request.status === "in_progress"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                          : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {s.label}
                  {s.resolvedEmployeeName ? ` · ${s.resolvedEmployeeName}` : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="gap-0 py-0">
        <CardHeader className="px-5 pt-4 pb-2">
          <CardTitle className="text-sm">Repayment schedule</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {schedule.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              The schedule starts once the loan is approved and issued.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Due date</th>
                    <th className="px-3 py-2 text-right">Instalment</th>
                    <th className="px-3 py-2 text-right">Balance after</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((i) => (
                    <tr key={i.number} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-1.5 text-muted-foreground">{i.number}</td>
                      <td className="px-3 py-1.5">{formatDate(i.dueDate)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{format(i.amount, { decimals: true })}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{format(i.balanceAfter, { decimals: true })}</td>
                      <td className="px-3 py-1.5">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize", INSTALMENT_STYLES[i.status])}>
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record repayment</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount received</Label>
            <Input
              type="number"
              min={0}
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder={String(loan.monthlyRepayment)}
            />
            <p className="text-[11px] text-muted-foreground">
              Outstanding: {format(loan.outstanding, { decimals: true })}. Payroll deductions
              will post here automatically once Payroll is connected.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepayOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const n = Number(repayAmount || loan.monthlyRepayment);
                if (!(n > 0)) {
                  toast.error("Enter an amount");
                  return;
                }
                actions.recordRepayment(loan, n);
                toast.success(
                  n >= loan.outstanding ? "Loan fully repaid and closed" : "Repayment recorded",
                );
                setRepayAmount("");
                setRepayOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDefault} onOpenChange={setConfirmDefault}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this loan as defaulted?</AlertDialogTitle>
            <AlertDialogDescription>
              {format(loan.outstanding, { decimals: true })} is still outstanding. The loan stays on
              the register and repayments can still be recorded against it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                actions.setStatus(loan, "defaulted");
                toast.success("Loan marked as defaulted");
              }}
            >
              Mark defaulted
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
