"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { RowActions } from "@/src/components/hr/employees/employee-detail/row-actions";
import { PromptDialog, type PromptRequest } from "@/src/components/shared/prompt-dialog";
import { getApiErrorMessage } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  useGetPlatformVerificationsQuery,
  useReviewTenantVerificationMutation,
} from "@/src/store/services/platform-verifications";
import type { ReviewQueueItemDto, VerificationStage } from "@/src/types/platform-verifications";

const STAGE_LABEL: Record<VerificationStage, string> = {
  draft: "Draft",
  submitted: "Submitted",
  underReview: "Under review",
  verified: "Verified",
  rejected: "Rejected",
};

/**
 * Platform → Verifications: company registration and tax documents tenants
 * have submitted, oldest first. GET /platform/verifications, and
 * POST /platform/tenants/{tenantId}/verification/{kind}/review to move one on.
 */
export function VerificationsTab() {
  const { data, isLoading } = useGetPlatformVerificationsQuery();
  const [review] = useReviewTenantVerificationMutation();
  const [prompt, setPrompt] = useState<PromptRequest | null>(null);
  const items = [...(data?.data ?? [])].sort((a, b) => b.daysWaiting - a.daysWaiting);

  async function decide(item: ReviewQueueItemDto, stage: VerificationStage, note?: string) {
    try {
      await review({
        tenantId: item.tenantId,
        kind: item.kind,
        body: { stage, note: note || null },
      }).unwrap();
      toast.success(`${item.companyName}: ${item.label} ${STAGE_LABEL[stage].toLowerCase()}`);
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not record the review."));
      return false;
    }
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <Card>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No verifications are waiting for review.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Document</th>
                <th className="px-4 py-2.5 font-medium">Number</th>
                <th className="px-4 py-2.5 font-medium">Submitted</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={`${v.tenantId}-${v.kind}`} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/tenants/${v.tenantId}`} className="font-medium hover:underline">
                      {v.companyName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{v.countryName}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    {v.label}
                    <p className="text-[11px] text-muted-foreground">{v.authority}</p>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{v.number ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {v.submittedOn ? formatDate(v.submittedOn) : "—"}
                    <p className={v.daysWaiting > 3 ? "text-amber-600" : ""}>
                      waiting {v.daysWaiting} day{v.daysWaiting === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px]">
                      {STAGE_LABEL[v.stage]}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <RowActions
                      label={`Review ${v.companyName}'s ${v.label}`}
                      extra={[
                        ...(v.stage === "submitted"
                          ? [{ label: "Start review", icon: Eye, onSelect: () => void decide(v, "underReview") }]
                          : []),
                        {
                          label: "Verify",
                          icon: CheckCircle2,
                          onSelect: () =>
                            setPrompt({
                              title: `Verify ${v.companyName}'s ${v.label}?`,
                              inputLabel: "Note (optional)",
                              optional: true,
                              confirmLabel: "Verify",
                              onConfirm: (note) => decide(v, "verified", note),
                            }),
                        },
                        {
                          label: "Reject",
                          icon: XCircle,
                          destructive: true,
                          onSelect: () =>
                            setPrompt({
                              title: `Reject ${v.companyName}'s ${v.label}?`,
                              inputLabel: "What needs fixing?",
                              multiline: true,
                              confirmLabel: "Reject",
                              destructive: true,
                              onConfirm: (note) => decide(v, "rejected", note),
                            }),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
      <PromptDialog request={prompt} onClose={() => setPrompt(null)} />
    </Card>
  );
}
