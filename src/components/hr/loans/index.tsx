"use client";

import { useMemo, useState } from "react";
import { Banknote, CalendarClock, HandCoins, Plus, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import {
  APPROVAL_CHAIN_TAB_ITEM,
  useHasApprovalChainTab,
} from "@/src/components/hr/approvals/use-chain-tab";
import { useCan } from "@/src/lib/permissions/use-can";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { LOAN_DOCUMENT_TYPE, summariseLoans } from "@/src/lib/loans/loans";
import { useLoans } from "@/src/lib/loans/use-loans";
import { LoanRegisterTable } from "./components/loan-register-table";
import { LoanAnalytics } from "./components/loan-analytics";
import { LoanRequestModal } from "./components/loan-request-modal";

/**
 * Core HR → Employee Loans. A staff loan and salary-advance register kept for
 * record-keeping and tracking — request, approval (via the loan approval
 * chain), repayment schedule and outstanding balance. No payroll processing
 * yet: once Payroll Phase 2 exists it will deduct repayments against these
 * same records.
 */
export function LoansPage() {
  const { rows, loading } = useLoans();
  const { format } = useCurrency();
  const canManage = useCan("organization.loans", "edit");
  const hasChainTab = useHasApprovalChainTab(LOAN_DOCUMENT_TYPE);
  const [tab, setTab] = useState("register");
  const [modalOpen, setModalOpen] = useState(false);

  const summary = useMemo(() => summariseLoans(rows), [rows]);
  const pending = useMemo(() => rows.filter((r) => r.status === "pending"), [rows]);

  if (loading && rows.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const cards: HrStatCardItem[] = [
    {
      label: "Total Active Loans",
      value: summary.activeLoans,
      sub: `${summary.defaulted} defaulted · ${summary.pending} awaiting approval`,
      icon: HandCoins,
      tone: "blue",
    },
    {
      label: "Loan Value",
      value: format(summary.loanValue, { compact: true }),
      sub: "Principal on active & defaulted loans",
      icon: Banknote,
      tone: "violet",
    },
    {
      label: "Outstanding Balance",
      value: format(summary.outstanding, { compact: true }),
      sub: `${summary.recoveryRate}% of principal recovered`,
      icon: Wallet,
      tone: "amber",
    },
    {
      label: "Loans Due This Month",
      value: summary.dueThisMonth,
      sub: "Instalment falls due this month",
      zeroSub: "No instalments due this month",
      icon: CalendarClock,
      tone: "emerald",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Employee Loans</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Staff loans, salary advances and cooperative loans — requests, approvals,
            repayment schedules and outstanding balances. Record-keeping only; nothing
            is deducted through payroll yet.
          </p>
        </div>
        {canManage && (
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Record loan request
          </Button>
        )}
      </div>

      <HrStatCardsGrid stats={cards} columns={4} />

      <Tabs value={tab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            { value: "register", label: `Loan Register (${rows.length})` },
            { value: "pending", label: `Pending Approval (${pending.length})` },
            { value: "analytics", label: "Loan Analytics" },
            ...(hasChainTab ? [APPROVAL_CHAIN_TAB_ITEM] : []),
          ]}
        />
        <TabsContent value="register" className="mt-4">
          <LoanRegisterTable rows={rows} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <LoanRegisterTable rows={pending} exportTitle="Pending Loan Requests" />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <LoanAnalytics rows={rows} summary={summary} />
        </TabsContent>
        {hasChainTab && (
          <TabsContent value="approval_chain" className="mt-4">
            <ApprovalChainTab documentType={LOAN_DOCUMENT_TYPE} />
          </TabsContent>
        )}
      </Tabs>

      <LoanRequestModal open={modalOpen} onOpenChange={setModalOpen} mode="hr" />
    </div>
  );
}
