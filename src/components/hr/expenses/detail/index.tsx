"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CircleCheck,
  Clock,
  CornerUpLeft,
  Pencil,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import { claimTimeline } from "@/src/lib/expenses/timeline";
import { approverUnavailable, isOnMyDesk } from "@/src/lib/expenses/desk";
import {
  chainChangedSinceFiled,
  currentExpenseStage,
  type ExpenseStage,
} from "@/src/lib/expenses/stages";
import {
  ClaimActivityCard,
  ClaimDetailsCard,
  ClaimReceiptsCard,
  ClaimSummaryCard,
  claimAmountLabel,
} from "@/src/components/shared/expenses/claim-cards";
import { ClaimProgressSteps } from "@/src/components/employee/expenses/components/claim-progress";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import { useHrExpenseClaims } from "../hooks";
import { DecisionPanel } from "../components/decision-panel";
import { ExpenseChainTimeline } from "../components/chain-timeline";

const LIST_PATH = "/time-payroll/expenses";

/**
 * One claim, as an approver needs to see it: who filed it, what the receipt
 * shows, where it sits in the chain, and the decision controls. Separate from
 * the employee's detail page rather than a variant of it — almost every line
 * of copy differs, and only the neutral cards are genuinely shared.
 */
export function HrExpenseClaimDetailPage({ claimId }: { claimId: string }) {
  const router = useRouter();
  const { format, code } = useCurrency();
  const { claims, stages, template, ready, canApprove, canOverride, actor } =
    useHrExpenseClaims();
  const user = useAppSelector((s) => s.auth.user);
  const bundle = useAppSelector((s) => s.locale.data);

  const claim = useMemo(
    () => claims.find((c) => c.id === claimId),
    [claims, claimId],
  );
  const timeline = useMemo(() => (claim ? claimTimeline(claim) : []), [claim]);

  if (!ready) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <h1 className="text-xl font-semibold text-foreground">
          Claim not found
        </h1>
        <p className="text-sm text-muted-foreground">
          This expense claim no longer exists — it may have been withdrawn by
          the employee.
        </p>
        <Button asChild variant="outline" className="gap-1.5">
          <Link href={LIST_PATH}>
            <ArrowLeft className="h-4 w-4" />
            Back to Expense Claims
          </Link>
        </Button>
      </div>
    );
  }

  const amountLabel = claimAmountLabel(claim, code, format);
  const onMyDesk = isOnMyDesk(claim, stages, user?.employeeId, user?.roleId);
  const unavailable = approverUnavailable(claim, bundle);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 pt-6">
        <Link
          href={LIST_PATH}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Expense Claims
        </Link>
      </div>

      <ClaimSummaryCard
        claim={claim}
        amountLabel={amountLabel}
        tenantCode={code}
        subtitle={
          <>
            {claim.employeeName ?? "Unattributed"}
            {claim.department ? ` · ${claim.department}` : ""} ·{" "}
            {claim.merchant || "No merchant"} ·{" "}
            {formatDate(claim.dateSubmitted)}
          </>
        }
      >
        <HrStatusBanner claim={claim} stages={stages} onMyDesk={onMyDesk} />
        {unavailable && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              The approver this claim resolved to is no longer active. Someone
              with override rights needs to move it on.
            </span>
          </div>
        )}
      </ClaimSummaryCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <ClaimDetailsCard
            claim={claim}
            amountLabel={amountLabel}
            tenantCode={code}
            submitterName={claim.employeeName ?? "Unattributed"}
            approverFallback="Not yet assigned"
          />

          <ClaimReceiptsCard
            claim={claim}
            missingWarning={
              (claim.attachments?.length ?? 0) === 0
                ? template?.attachments.required
                  ? "No receipt attached, and this chain requires one. Return the claim for a receipt rather than approving it unsupported."
                  : "No receipt attached — check the claim stands up without one before approving."
                : undefined
            }
          />

          <DecisionPanel
            claim={claim}
            stages={stages}
            template={template}
            actor={actor}
            onMyDesk={onMyDesk}
            canApprove={canApprove}
            canOverride={canOverride}
            onDecided={() => router.push(LIST_PATH)}
          />

          <ClaimActivityCard entries={timeline} />
        </div>

        <div className="flex flex-col gap-4">
          <ExpenseChainTimeline
            claim={claim}
            stages={stages}
            chainChanged={chainChangedSinceFiled(claim, template)}
          />

          <Card>
            <CardHeader className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Employee&apos;s view
              </h2>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <ClaimProgressSteps claim={claim} stages={stages} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Where the claim stands, from the reviewer's side of the desk. */
function HrStatusBanner({
  claim,
  stages,
  onMyDesk,
}: {
  claim: ExpenseClaim;
  stages: ExpenseStage[];
  onMyDesk: boolean;
}) {
  const stage = currentExpenseStage(claim, stages);
  const withWhom =
    claim.currentApproverName ?? stage?.approverLabel ?? "an approver";

  const banner =
    claim.status === "draft" && claim.returned
      ? {
          icon: CornerUpLeft,
          tone: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
          iconTone: "bg-amber-500 text-white",
          title: "Returned to the employee",
          body:
            claim.returnedReason ??
            "Waiting for the employee to correct and resubmit.",
        }
      : {
          draft: {
            icon: Pencil,
            tone: "border-border bg-muted/40 text-foreground",
            iconTone: "bg-muted text-muted-foreground",
            title: "Draft — not submitted",
            body: "The employee hasn't filed this yet.",
          },
          submitted: {
            icon: Clock,
            tone: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
            iconTone: "bg-sky-500 text-white",
            title: onMyDesk
              ? `Pending your approval — ${stage?.label ?? "review"}`
              : `With ${withWhom} — ${stage?.label ?? "review"}`,
            body: onMyDesk
              ? "Approve to send it to the next stage, or send it back with a reason."
              : "You can see it here, but the decision is theirs to make.",
          },
          approved: {
            icon: CircleCheck,
            tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            iconTone: "bg-emerald-500 text-white",
            title: onMyDesk
              ? `Pending your approval — ${stage?.label ?? "payment"}`
              : `Approved — with ${withWhom}`,
            body: `Cleared by ${claim.reviewer ?? "the previous approver"}.`,
          },
          rejected: {
            icon: XCircle,
            tone: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
            iconTone: "bg-rose-500 text-white",
            title: `Rejected by ${claim.reviewer ?? "an approver"}`,
            body: "The employee has been told. A corrected claim would be a new one.",
          },
          reimbursed: {
            icon: Banknote,
            tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            iconTone: "bg-emerald-500 text-white",
            title: "Reimbursed",
            body: "Paid out in full — nothing further is needed.",
          },
        }[claim.status];

  const Icon = banner.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-5 py-4",
        banner.tone,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          banner.iconTone,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold">{banner.title}</span>
        <span className="text-xs text-muted-foreground">{banner.body}</span>
      </div>
    </div>
  );
}
