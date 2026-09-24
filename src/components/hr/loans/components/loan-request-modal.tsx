"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { EmployeePicker, type PickedEmployee } from "@/src/components/shared/employee-picker";
import { SignaturePad } from "@/src/components/shared/signature-pad";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import {
  LOAN_DOCUMENT_TYPE,
  LOAN_TYPES_BY_COUNTRY,
  loanTypeLabel,
  monthlyRepayment,
} from "@/src/lib/loans/loans";
import { useLoanActions } from "@/src/lib/loans/use-loans";

interface LoanRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * "self": the signed-in employee applies for themselves.
   * "hr": HR records a request on an employee's behalf.
   */
  mode: "self" | "hr";
}

const MAX_MONTHS = 36;

/**
 * Apply for a staff loan or salary advance. The request is recorded as pending
 * and routed through the Loan approval chain (line manager → HR → Finance by
 * default), which HR can reshape in Submissions & Approvals.
 */
export function LoanRequestModal({ open, onOpenChange, mode }: LoanRequestModalProps) {
  const user = useAppSelector((s) => s.auth.user);
  const country = useAppSelector((s) => s.locale.country);
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const template = useAppSelector((s) =>
    s.approvals.templates.find((t) => t.documentType === LOAN_DOCUMENT_TYPE && t.isDefault) ??
    s.approvals.templates.find((t) => t.documentType === LOAN_DOCUMENT_TYPE),
  );
  const { code, format } = useCurrency();
  const actions = useLoanActions();

  const types = LOAN_TYPES_BY_COUNTRY[country];
  const [picked, setPicked] = useState<PickedEmployee | null>(null);
  const [loanType, setLoanType] = useState(types[0]);
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("12");
  const [purpose, setPurpose] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setPicked(null);
      setLoanType(types[0]);
      setAmount("");
      setMonths(types[0] === "salary_advance" ? "3" : "12");
      setPurpose("");
      setSignature(null);
      setErrors({});
    }
  }

  const needsSignature = mode === "self" && (template?.signatures.submitterSigns ?? false);
  const amountNum = Number(amount);
  const monthsNum = Number(months);
  const instalment = useMemo(
    () => (amountNum > 0 && monthsNum > 0 ? monthlyRepayment(amountNum, monthsNum) : null),
    [amountNum, monthsNum],
  );

  const subject =
    mode === "self"
      ? employees.find((e) => e.id === user?.employeeId)
      : picked
        ? employees.find((e) => e.id === picked.id)
        : undefined;

  function submit() {
    const errs: Record<string, string> = {};
    if (!subject) errs.employee = mode === "hr" ? "Choose the employee" : "Sign in to apply";
    if (!(amountNum > 0)) errs.amount = "Enter the amount requested";
    if (!Number.isInteger(monthsNum) || monthsNum < 1 || monthsNum > MAX_MONTHS)
      errs.months = `Between 1 and ${MAX_MONTHS} months`;
    if (purpose.trim().length < 3) errs.purpose = "Say what the loan is for";
    if (needsSignature && !signature) errs.signature = "Sign the repayment undertaking";
    setErrors(errs);
    if (Object.keys(errs).length || !subject || !user) return;

    actions.request({
      employee: subject,
      loanType,
      amount: amountNum,
      repaymentMonths: monthsNum,
      purpose: purpose.trim(),
      currency: code,
      submitter: {
        employeeId: user.employeeId,
        name: user.name,
        initials: user.initials,
        departmentName: user.departmentName,
      },
      signatureDataUrl: signature ?? undefined,
    });
    toast.success(
      mode === "self"
        ? "Loan request submitted — you can follow it in My Submissions"
        : `Loan request recorded for ${subject.fullName} and sent for approval`,
    );
    onOpenChange(false);
  }

  const err = (k: string) =>
    errors[k] ? <p className="text-[10px] text-destructive">{errors[k]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "self" ? "Apply for a loan or advance" : "Record a loan request"}</DialogTitle>
          <DialogDescription>
            Goes to approval: {template?.steps.map((s) => s.label).join(" → ") ?? "HR approval"}.
            Repayments are tracked here; nothing is deducted from payroll yet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mode === "hr" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Employee</Label>
              <EmployeePicker
                value={picked?.id}
                onChange={setPicked}
                placeholder="Search for the employee…"
              />
              {err("employee")}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Loan type</Label>
            <Select value={loanType} onValueChange={setLoanType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t} className="text-sm">
                    {loanTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount ({code})</Label>
            <Input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 text-sm"
            />
            {err("amount")}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Repayment period (months)</Label>
            <Input
              type="number"
              min={1}
              max={MAX_MONTHS}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="h-9 text-sm"
            />
            {err("months")}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly repayment</Label>
            <p className="flex h-9 items-center rounded-md border border-dashed border-border px-3 text-sm tabular-nums text-muted-foreground">
              {instalment != null ? format(instalment, { decimals: true }) : "—"}
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Purpose</Label>
            <Textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Rent renewal, school fees, annual season ticket"
              className="text-sm"
            />
            {err("purpose")}
          </div>
          {needsSignature && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">
                I agree to repay this amount in {monthsNum || "—"} monthly instalments
              </Label>
              <SignaturePad onChange={setSignature} className="w-full" />
              {err("signature")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit for approval</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
