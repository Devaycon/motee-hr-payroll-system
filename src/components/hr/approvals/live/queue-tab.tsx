"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CornerUpLeft, Inbox, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { formatDateTime } from "@/src/lib/utils/format-date";
import { useGetMyApprovalQueueQuery } from "@/src/store/services/approvals";
import type { ApprovalDto } from "@/src/types/common";
import { StatusBadge, humanise, useApprovalActions } from "./shared";

const PAGE_SIZE = 20;

function QueueRow({
  approval,
  basePath,
}: {
  approval: ApprovalDto;
  basePath: string;
}) {
  const { decide, busy } = useApprovalActions();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const can = (action: ApprovalDto["availableActions"][number]) =>
    approval.availableActions.includes(action);

  async function handle(decision: "approved" | "rejected" | "returned") {
    if (await decide(approval, decision, note)) {
      setNote("");
      setOpen(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <Link
            href={`${basePath}/${approval.id}`}
            className="text-sm font-medium text-foreground hover:underline"
          >
            {humanise(approval.documentType)}
          </Link>
          <span className="text-xs text-muted-foreground">
            {approval.currentStep
              ? `Waiting on: ${approval.currentStep.label}`
              : "No step waiting"}
            {approval.submittedAt
              ? ` · Submitted ${formatDateTime(approval.submittedAt)}`
              : ""}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={approval.status} />
          {can("approve") && (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={busy}
              onClick={() => handle("approved")}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
          )}
          {(can("reject") || can("return")) && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Reject / return"}
            </Button>
          )}
        </div>
      </div>

      {approval.isBlocked && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Blocked: {approval.blockedReason ?? "no approver could be found."}
        </p>
      )}

      {open && (
        <div className="flex flex-col gap-2">
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What needs to change, or why it is being rejected"
            className="text-sm"
          />
          <div className="flex gap-2">
            {can("return") && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                disabled={busy}
                onClick={() => handle("returned")}
              >
                <CornerUpLeft className="h-3.5 w-3.5" />
                Return for changes
              </Button>
            )}
            {can("reject") && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs text-destructive"
                disabled={busy}
                onClick={() => handle("rejected")}
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/** Approvals waiting on the signed-in user. */
export function QueueTab({ basePath }: { basePath: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetMyApprovalQueueQuery({
    Page: page,
    PageSize: PAGE_SIZE,
  });
  const queue = data?.data;

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (!queue?.items.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nothing is waiting on you.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {queue.items.map((approval) => (
              <QueueRow
                key={approval.id}
                approval={approval}
                basePath={basePath}
              />
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {queue.totalItems} waiting · page {queue.page}
          {queue.totalPages ? ` of ${queue.totalPages}` : ""}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={!queue.hasNextPage || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
