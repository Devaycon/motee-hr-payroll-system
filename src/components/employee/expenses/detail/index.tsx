"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CircleCheck,
  Clock,
  CornerUpLeft,
  Pencil,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
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
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { deleteClaim, withdrawClaim } from "@/src/lib/stores/expenses-slice";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import { claimTimeline } from "@/src/lib/expenses/timeline";
import { useExpenseStages } from "@/src/lib/expenses/use-expense-stages";
import {
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
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import { ClaimProgressSteps } from "../components/claim-progress";

const LIST_PATH = "/employee/expenses";

interface ExpenseClaimDetailPageProps {
  claimId: string;
}

/**
 * The full record behind one row of My Expenses (client feedback §8.9). The
 * list can only show six columns; this is where the receipt, the notes, the
 * approval track and the audit trail live, on its own route so a claim can be
 * linked to, bookmarked and opened in a new tab.
 */
export function ExpenseClaimDetailPage({ claimId }: ExpenseClaimDetailPageProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { format, code } = useCurrency();
  const stages = useExpenseStages();
  const ready = useAppSelector((s) => s.expenses.status === "ready");
  const claim = useAppSelector((s) =>
    s.expenses.claims.find((c) => c.id === claimId),
  );
  const viewerName = useAppSelector((s) => s.auth.user?.name ?? "You");

  const [confirm, setConfirm] = useState<"withdraw" | "delete" | null>(null);

  const timeline = useMemo(() => (claim ? claimTimeline(claim) : []), [claim]);

  // The store hydrates in an effect, so an unknown id and a not-yet-loaded one
  // look identical on first render — wait for `ready` before saying it's gone.
  if (!ready) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full max-w-xl rounded-xl" />
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
          This expense claim no longer exists — it may have been deleted.
        </p>
        <Button asChild variant="outline" className="gap-1.5">
          <Link href={LIST_PATH}>
            <ArrowLeft className="h-4 w-4" />
            Back to My Expenses
          </Link>
        </Button>
      </div>
    );
  }

  const amountLabel = claimAmountLabel(claim, code, format);
  const missingReceipt =
    claim.status !== "draft" && (claim.attachments?.length ?? 0) === 0;

  function handleWithdraw() {
    dispatch(withdrawClaim({ id: claim!.id, actor: viewerName }));
    setConfirm(null);
    toast.success("Claim withdrawn", {
      description: "It's back in your drafts — edit it and submit again.",
    });
  }

  function handleDelete() {
    dispatch(deleteClaim(claim!.id));
    setConfirm(null);
    toast.success("Draft deleted");
    router.push(LIST_PATH);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 pt-6">
        <Link
          href={LIST_PATH}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Expenses
        </Link>
      </div>

      <ClaimSummaryCard
        claim={claim}
        amountLabel={amountLabel}
        tenantCode={code}
        subtitle={
          <>
            {claim.merchant || "No merchant recorded"} ·{" "}
            {formatDate(claim.dateSubmitted)}
          </>
        }
      >
        <StatusBanner claim={claim} stages={stages} />
      </ClaimSummaryCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <ClaimDetailsCard
            claim={claim}
            amountLabel={amountLabel}
            tenantCode={code}
            submitterName={claim.employeeName ?? viewerName}
            approverFallback="Your line manager"
          />

          <ClaimReceiptsCard
            claim={claim}
            missingWarning={
              missingReceipt
                ? "No receipt attached. Claims sent without one are usually returned — reply to your approver with the receipt, or withdraw the claim and attach it."
                : undefined
            }
          />

          <ClaimActivityCard entries={timeline} />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Progress</h2>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <ClaimProgressSteps claim={claim} stages={stages} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Actions</h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-5 py-4">
              {claim.status === "draft" && (
                <>
                  <Button
                    className="w-full gap-1.5"
                    onClick={() => router.push(`${LIST_PATH}?draft=${claim.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                    {claim.returned ? "Fix and resubmit" : "Continue editing"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirm("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete draft
                  </Button>
                </>
              )}

              {claim.status === "submitted" && (
                <>
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => setConfirm("withdraw")}
                  >
                    <Undo2 className="h-4 w-4" />
                    Withdraw claim
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Withdrawing pulls the claim out of review and returns it to
                    your drafts, where you can correct and resubmit it.
                  </p>
                </>
              )}

              {(claim.status === "approved" ||
                claim.status === "reimbursed") && (
                <p className="text-xs text-muted-foreground">
                  {claim.status === "approved"
                    ? "Approved and moving through the chain. Nothing more is needed from you."
                    : "Paid out. Keep the receipt for your own records."}
                </p>
              )}

              {claim.status === "rejected" && (
                <p className="text-xs text-muted-foreground">
                  Rejected claims can&apos;t be reopened. File a new claim with
                  the correction your approver asked for.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete"
                ? "Delete this draft?"
                : "Withdraw this claim?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "The draft and anything attached to it will be removed. This can't be undone."
                : "Your approver will no longer see it, and it goes back to your drafts."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirm === "delete" ? handleDelete : handleWithdraw}
              className={cn(
                confirm === "delete" &&
                  "bg-destructive text-white hover:bg-destructive/90",
              )}
            >
              {confirm === "delete" ? "Delete draft" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Where the claim stands, said in a sentence before any of the detail. */
function StatusBanner({
  claim,
  stages,
}: {
  claim: ExpenseClaim;
  stages: ExpenseStage[];
}) {
  const stage = currentExpenseStage(claim, stages);
  const waitingOn =
    claim.currentApproverName ?? stage?.approverLabel ?? "your line manager";
  const lastStage = stages[stages.length - 1];

  // A returned claim is stored as a draft, but it is not one the employee
  // chose to park — say why it came back before anything else.
  const banner =
    claim.status === "draft" && claim.returned
      ? {
          icon: CornerUpLeft,
          tone: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
          iconTone: "bg-amber-500 text-white",
          title: `Returned for correction by ${claim.reviewer ?? "your approver"}`,
          body:
            claim.returnedReason ??
            "Fix what was flagged and submit it again — it keeps the same reference.",
        }
      : {
          draft: {
            icon: Pencil,
            tone: "border-border bg-muted/40 text-foreground",
            iconTone: "bg-muted text-muted-foreground",
            title: "Draft — not submitted yet",
            body: "Nobody can see this claim until you submit it.",
          },
          submitted: {
            icon: Clock,
            tone: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
            iconTone: "bg-sky-500 text-white",
            title: stage
              ? `${stage.label} — with ${waitingOn}`
              : `Awaiting review by ${waitingOn}`,
            body: "You'll be notified as soon as a decision is made.",
          },
          approved: {
            icon: CircleCheck,
            tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            iconTone: "bg-emerald-500 text-white",
            title: `Approved by ${claim.reviewer ?? "your approver"}`,
            body: lastStage
              ? `Now with ${waitingOn} for ${lastStage.label.toLowerCase()}.`
              : "Approved and awaiting payment.",
          },
          rejected: {
            icon: XCircle,
            tone: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
            iconTone: "bg-rose-500 text-white",
            title: `Rejected by ${claim.reviewer ?? "your approver"}`,
            body: "Check the activity below, then file a corrected claim if it still stands.",
          },
          reimbursed: {
            icon: Banknote,
            tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            iconTone: "bg-emerald-500 text-white",
            title: "Reimbursed",
            body: "This claim has been paid out in full.",
          },
        }[claim.status];

  const Icon = banner.icon;
  const missingReceipt =
    claim.status !== "draft" && (claim.attachments?.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-2">
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

      {missingReceipt && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          This claim has no receipt attached, so it may be returned to you.
        </div>
      )}
    </div>
  );
}
