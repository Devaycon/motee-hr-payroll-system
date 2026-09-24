"use client";

import Link from "next/link";
import { HandCoins } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useCan } from "@/src/lib/permissions/use-can";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { LOANS_HREF } from "@/src/lib/loans/loans";
import { useEmployeeLoanRows } from "@/src/lib/loans/use-loans";
import { LoanRegisterTable } from "@/src/components/hr/loans/components/loan-register-table";
import type { ModuleProps } from "./modules";
import { useProfileVariant } from "./variant";
import { Empty, LoadingPanel, Section, StatStrip } from "./ui";

/** Employee Profile → Loans: this person's staff loans and salary advances. */
export function LoansModule({ employeeId }: ModuleProps) {
  const { rows, loading } = useEmployeeLoanRows(employeeId);
  const { format } = useCurrency();
  const variant = useProfileVariant();
  const self = variant.audience === "employee";
  const canOpenRegister = useCan("organization.loans", "view") && !self;

  if (loading && rows.length === 0) return <LoadingPanel />;

  const outstanding = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <Section
      title="Loans"
      description="Staff loans and salary advances, with repayments and outstanding balance."
      action={
        self ? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <Link href="/employee/loans">
              <HandCoins className="h-3.5 w-3.5" /> Apply for a loan
            </Link>
          </Button>
        ) : canOpenRegister ? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <Link href={LOANS_HREF}>
              <HandCoins className="h-3.5 w-3.5" /> Loan Register
            </Link>
          </Button>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <Empty label="No loans or advances on record." />
      ) : (
        <>
          <StatStrip
            items={[
              { label: "Active", value: rows.filter((r) => r.status === "active").length },
              { label: "Outstanding balance", value: format(outstanding, { decimals: true }) },
              { label: "Total borrowed", value: format(rows.filter((r) => r.status !== "rejected" && r.status !== "pending").reduce((s, r) => s + r.amount, 0)) },
              { label: "Pending approval", value: rows.filter((r) => r.status === "pending").length },
            ]}
          />
          <LoanRegisterTable
            rows={rows}
            showEmployee={false}
            hrefFor={(r) => (self ? `/employee/loans/${r.id}` : `${LOANS_HREF}/${r.id}`)}
            exportTitle="Employee Loans"
          />
        </>
      )}
    </Section>
  );
}
