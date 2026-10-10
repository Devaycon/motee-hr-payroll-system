"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { formatDateTime } from "@/src/lib/utils/format-date";
import {
  useGetApprovalQuery,
  useGetApprovalsForSubjectQuery,
} from "@/src/store/services/approvals";
import {
  APPROVER_LABELS,
  StatusBadge,
  humanise,
  useApprovalActions,
} from "./shared";

/** One approval: its steps, its history, and whatever can be done to it. */
export function LiveApprovalDetailPage({
  id,
  basePath,
}: {
  id: string;
  basePath: string;
}) {
  const router = useRouter();
  const { data, isLoading } = useGetApprovalQuery(id);
  const approval = data?.data;
  // Every approval raised against the same record, e.g. an earlier round.
  const { data: related } = useGetApprovalsForSubjectQuery(
    {
      subjectType: approval?.subjectType ?? "",
      subjectId: approval?.subjectId ?? "",
    },
    { skip: !approval },
  );
  const { decide, resubmit, reresolve, cancel, busy } = useApprovalActions();
  const [note, setNote] = useState("");

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  if (!approval) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-sm text-muted-foreground">
          This approval could not be found.
        </p>
        <Button variant="outline" onClick={() => router.push(basePath)}>
          Back to approvals
        </Button>
      </div>
    );
  }

  const can = (action: (typeof approval.availableActions)[number]) =>
    approval.availableActions.includes(action);
  const steps = [...approval.steps].sort((a, b) => a.sequence - b.sequence);
  const others = (related?.data ?? []).filter((a) => a.id !== approval.id);

  async function handleDecide(decision: "approved" | "rejected" | "returned") {
    if (approval && (await decide(approval, decision, note))) setNote("");
  }

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-1.5 text-muted-foreground"
        onClick={() => router.push(basePath)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to approvals
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {humanise(approval.documentType)}
              </h1>
              <p className="text-xs text-muted-foreground">
                Round {approval.round}
                {approval.submittedAt
                  ? ` · Submitted ${formatDateTime(approval.submittedAt)}`
                  : ""}
                {approval.decidedAt
                  ? ` · Decided ${formatDateTime(approval.decidedAt)}`
                  : ""}
              </p>
            </div>
            <StatusBadge status={approval.status} />
          </div>

          {approval.isBlocked && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Blocked: {approval.blockedReason ?? "no approver could be found."}
            </p>
          )}

          {(can("approve") || can("reject") || can("return")) && (
            <div className="flex flex-col gap-2">
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (required to reject or return)"
                className="text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {can("approve") && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => handleDecide("approved")}
                  >
                    Approve
                  </Button>
                )}
                {can("return") && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => handleDecide("returned")}
                  >
                    Return for changes
                  </Button>
                )}
                {can("reject") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    disabled={busy}
                    onClick={() => handleDecide("rejected")}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {can("resubmit") && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => resubmit(approval)}
              >
                Resubmit
              </Button>
            )}
            {approval.status === "inProgress" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => reresolve(approval)}
              >
                Refresh approvers
              </Button>
            )}
            {can("cancel") && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => cancel(approval, note)}
              >
                Cancel approval
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-semibold text-foreground">Steps</h2>
            <ol className="flex flex-col gap-2">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm text-foreground">
                      {step.sequence}. {step.label}
                      {!step.required && (
                        <span className="text-muted-foreground"> (optional)</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {step.resolvedName ?? APPROVER_LABELS[step.approver]}
                      {step.delegation
                        ? ` · covering for ${step.delegation.fromName}`
                        : ""}
                      {step.decidedAt
                        ? ` · ${formatDateTime(step.decidedAt)}`
                        : ""}
                    </span>
                    {step.note && (
                      <span className="text-xs text-foreground">
                        “{step.note}”
                      </span>
                    )}
                  </div>
                  <StatusBadge status={step.status} />
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-semibold text-foreground">History</h2>
            {approval.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {approval.history.map((event) => (
                  <li key={event.id} className="flex flex-col">
                    <span className="text-sm text-foreground">
                      {humanise(event.type)}
                      {event.actorName ? ` by ${event.actorName}` : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.at)}
                      {event.note ? ` · ${event.note}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {approval.attachments.length > 0 && (
              <>
                <h2 className="pt-2 text-sm font-semibold text-foreground">
                  Attachments
                </h2>
                <ul className="flex flex-col gap-1">
                  {approval.attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      {file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {file.fileName}
                        </a>
                      ) : (
                        file.fileName
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {others.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Other approvals for this record
            </h2>
            <ul className="divide-y divide-border rounded-md border border-border">
              {others.map((other) => (
                <li
                  key={other.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <Link
                    href={`${basePath}/${other.id}`}
                    className="text-sm text-foreground hover:underline"
                  >
                    {humanise(other.documentType)} · round {other.round}
                  </Link>
                  <StatusBadge status={other.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
