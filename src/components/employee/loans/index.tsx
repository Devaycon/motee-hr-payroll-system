"use client";

import { useMemo, useState } from "react";
import { HandCoins, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { StatStrip } from "@/src/components/hr/employees/employee-detail/ui";
import { LoanRegisterTable } from "@/src/components/hr/loans/components/loan-register-table";
import { LoanRequestModal } from "@/src/components/hr/loans/components/loan-request-modal";
import { SelfLoanDetailPage } from "@/src/components/hr/loans/detail";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import { nextInstalment } from "@/src/lib/loans/loans";
import { useEmployeeLoanRows } from "@/src/lib/loans/use-loans";

/** Self-service: apply for a staff loan or salary advance and follow repayments. */
export function MyLoansPage() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const { rows } = useEmployeeLoanRows(employeeId);
  const { format } = useCurrency();
  const [open, setOpen] = useState(false);

  const outstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const next = useMemo(
    () =>
      rows
        .filter((r) => r.status === "active")
        .map((r) => nextInstalment(r))
        .filter((i): i is NonNullable<typeof i> => !!i)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0],
    [rows],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <HandCoins className="h-6 w-6 text-primary" /> My Loans
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Apply for a staff loan or salary advance and track what you&apos;ve repaid.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Apply for a loan
        </Button>
      </div>

      <StatStrip
        items={[
          { label: "Active loans", value: rows.filter((r) => r.status === "active").length },
          { label: "Outstanding balance", value: format(outstanding, { decimals: true }) },
          {
            label: "Next instalment",
            value: next ? `${format(next.amount, { decimals: true })} · ${formatDate(next.dueDate)}` : "—",
          },
          { label: "Awaiting approval", value: rows.filter((r) => r.status === "pending").length },
        ]}
      />

      <LoanRegisterTable
        rows={rows}
        showEmployee={false}
        hrefFor={(r) => `/employee/loans/${r.id}`}
        exportTitle="My Loans"
      />

      <LoanRequestModal open={open} onOpenChange={setOpen} mode="self" />
    </div>
  );
}

/** Self-service loan detail — resolves the signed-in employee's own loan only. */
export function MyLoanDetailPage({ loanId }: { loanId: string }) {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  return <SelfLoanDetailPage loanId={loanId} employeeId={employeeId} />;
}
