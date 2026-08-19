"use client";

import { Download, FileWarning, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { formatDate, formatDateTime } from "@/src/lib/utils/format-date";
import { formatBytes, isPreviewable } from "@/src/lib/utils/file-attachments";
import {
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseClaim,
  type ExpenseHistoryEntry,
} from "@/src/data/employee-expenses-demo";
import {
  expenseStatusLabel,
  expenseStatusStyle,
} from "@/src/lib/expenses/stages";

/**
 * The parts of a claim that read the same to whoever is looking — the header,
 * the field grid, the receipts and the audit trail. The employee page and the
 * HR review page compose these and differ only in what they say *about* the
 * claim and what they let you do to it.
 */

/** Money as the viewer should read it: original currency when it isn't ours. */
export function claimAmountLabel(
  claim: ExpenseClaim,
  tenantCode: string,
  format: (n: number, opts?: { decimals?: boolean }) => string,
): string {
  const foreign = Boolean(claim.currency && claim.currency !== tenantCode);
  return foreign
    ? `${claim.currency} ${claim.amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : format(claim.amount, { decimals: true });
}

export function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

interface ClaimSummaryCardProps {
  claim: ExpenseClaim;
  amountLabel: string;
  tenantCode: string;
  /** Line under the title — merchant and date, or the submitter for HR. */
  subtitle: React.ReactNode;
  /** Status banner(s) shown inside the same solid card. */
  children?: React.ReactNode;
}

export function ClaimSummaryCard({
  claim,
  amountLabel,
  tenantCode,
  subtitle,
  children,
}: ClaimSummaryCardProps) {
  const CategoryIcon = EXPENSE_CATEGORY_ICONS[claim.category];
  const foreign = Boolean(claim.currency && claim.currency !== tenantCode);

  return (
    // The page sits on the patterned background, so the summary the eye lands
    // on first gets a solid card to read against.
    <Card>
      <CardContent className="flex flex-col gap-5 px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 text-[10px] uppercase tracking-wide"
              >
                <CategoryIcon className="h-3 w-3" aria-hidden />
                {EXPENSE_CATEGORY_LABELS[claim.category]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "px-2 py-0.5 text-[10px] font-medium",
                  expenseStatusStyle(claim),
                )}
              >
                {expenseStatusLabel(claim)}
              </Badge>
              {claim.reference && (
                <span className="font-mono text-xs text-muted-foreground">
                  {claim.reference}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {claim.title}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground sm:text-3xl">
              {amountLabel}
            </p>
            {foreign && (
              <p className="text-[11px] text-muted-foreground">
                Filed in {claim.currency} · reimbursed in {tenantCode}
              </p>
            )}
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}

interface ClaimDetailsCardProps {
  claim: ExpenseClaim;
  amountLabel: string;
  tenantCode: string;
  /** Who filed it — the claim's own submitter, never the viewer. */
  submitterName: string;
  /** Fallback when the claim has no recorded approver yet. */
  approverFallback: string;
}

export function ClaimDetailsCard({
  claim,
  amountLabel,
  tenantCode,
  submitterName,
  approverFallback,
}: ClaimDetailsCardProps) {
  const foreign = Boolean(claim.currency && claim.currency !== tenantCode);

  return (
    <Card>
      <CardHeader className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Claim details</h2>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Detail label="Reference">
            <span className="font-mono text-xs">
              {claim.reference ?? "Not issued until submitted"}
            </span>
          </Detail>
          <Detail label="Category">
            {EXPENSE_CATEGORY_LABELS[claim.category]}
          </Detail>
          <Detail label="Merchant">{claim.merchant || "—"}</Detail>
          <Detail label="Amount">{amountLabel}</Detail>
          <Detail label="Date of expense">
            {formatDate(claim.dateSubmitted)}
          </Detail>
          <Detail label="Currency">
            {claim.currency ?? tenantCode}
            {foreign && (
              <span className="text-muted-foreground"> (converted on payment)</span>
            )}
          </Detail>
          <Detail label="Submitted by">{submitterName}</Detail>
          <Detail
            label={claim.status === "rejected" ? "Rejected by" : "Approver"}
          >
            {claim.currentApproverName ?? claim.reviewer ?? approverFallback}
          </Detail>
        </dl>

        {claim.notes && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-foreground">
              {claim.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ClaimReceiptsCard({
  claim,
  missingWarning,
}: {
  claim: ExpenseClaim;
  /** Shown when a submitted claim has nothing attached; audience-specific. */
  missingWarning?: string;
}) {
  const attachments = claim.attachments ?? [];

  return (
    <Card>
      <CardHeader className="border-b border-border px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          Receipts ({attachments.length})
        </h2>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-4">
        {attachments.length === 0 ? (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border p-3 text-xs",
              missingWarning
                ? "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400"
                : "border-border text-muted-foreground",
            )}
          >
            {missingWarning ? (
              <>
                <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{missingWarning}</span>
              </>
            ) : (
              <span>Nothing attached yet.</span>
            )}
          </div>
        ) : (
          attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {file.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.dataUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm text-foreground">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatBytes(file.sizeBytes)} · {formatDate(file.uploadedAt)}
                  </span>
                </div>
              </div>
              <a
                href={file.dataUrl}
                target="_blank"
                rel="noreferrer"
                {...(isPreviewable(file.mimeType) ? {} : { download: file.name })}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Download className="h-3 w-3" />
                {isPreviewable(file.mimeType) ? "View" : "Download"}
              </a>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ClaimActivityCard({
  entries,
}: {
  entries: ExpenseHistoryEntry[];
}) {
  return (
    <Card>
      <CardHeader className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <ol className="space-y-4">
          {entries.map((item, i) => (
            <li key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                {i < entries.length - 1 && (
                  <span className="w-px flex-1 bg-border" aria-hidden />
                )}
              </div>
              <div className="pb-1">
                <p className="text-sm text-foreground">
                  {item.action}
                  {item.actor && (
                    <span className="text-muted-foreground"> · {item.actor}</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {/* Live entries carry a timestamp; inferred ones only have a
                      date, so don't imply a precision we lack. */}
                  {item.at.length > 10
                    ? formatDateTime(item.at)
                    : formatDate(item.at)}
                </p>
                {item.note && (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    “{item.note}”
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
