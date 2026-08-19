"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Badge } from "@/src/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import {
  DataTable,
  sortableHeader,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  type ApprovalRequest,
} from "@/src/lib/types/approvals";
import { daysWaiting, formatRelativeDate, lastUpdatedAt } from "../utils";
import { ApprovalChainMeter, ApprovalChainProgress } from "./chain-progress";

interface QueueTableProps {
  requests: ApprovalRequest[];
  basePath?: string;
  emptyLabel?: string;
}

/**
 * Phone rendering of the queue. A six-column table forced into 375px is
 * unreadable, so below `md` each submission becomes a card that expands to show
 * the columns the summary leaves out (client feedback — mobile considerations).
 */
function SubmissionCards({
  requests,
  basePath,
  emptyLabel,
}: Required<QueueTableProps>) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {requests.map((req) => {
        const currentStep = req.steps[req.currentStepIndex];
        return (
          <li key={req.id}>
            <Collapsible className="rounded-xl border border-border bg-card">
              <div className="flex flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`${basePath}/${req.id}`}
                    className="min-w-0 flex-1"
                  >
                    <span className="block truncate text-sm font-medium text-foreground">
                      {req.documentTitle}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {req.documentSummary}
                    </span>
                  </Link>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 px-2 py-0.5 text-[10px] font-medium",
                      STATUS_STYLES[req.status],
                    )}
                  >
                    {STATUS_LABELS[req.status]}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <PersonAvatar
                    name={req.submittedBy.name}
                    initials={req.submittedBy.initials}
                    className="size-6 shrink-0"
                    fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {req.submittedBy.name} ·{" "}
                    {formatRelativeDate(req.submittedAt)}
                  </span>
                </div>

                <ApprovalChainMeter request={req} />

                <CollapsibleTrigger className="group flex items-center gap-1 self-start text-xs font-medium text-primary">
                  <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
                  Details
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="flex flex-col gap-2 border-t border-border px-3 py-3 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground">
                    {DOCUMENT_TYPE_LABELS[req.documentType] ?? req.documentType}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">On whose desk</span>
                  <span className="text-right text-foreground">
                    {req.status === "in_progress"
                      ? `${currentStep?.label ?? "—"}${
                          currentStep?.resolvedEmployeeName
                            ? ` · ${currentStep.resolvedEmployeeName}`
                            : ""
                        }`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Days waiting</span>
                  <span className="text-foreground">
                    {daysWaiting(req)} {daysWaiting(req) === 1 ? "day" : "days"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Last updated</span>
                  <span className="text-foreground">
                    {formatRelativeDate(lastUpdatedAt(req))}
                  </span>
                </div>
                <ApprovalChainProgress request={req} className="pt-1" />
              </CollapsibleContent>
            </Collapsible>
          </li>
        );
      })}
    </ul>
  );
}

export function QueueTable({
  requests,
  basePath = "/hr-action-center/submissions",
  emptyLabel = "No submissions here",
}: QueueTableProps) {
  const columns = useMemo<ColumnDef<ApprovalRequest>[]>(
    () => [
      {
        accessorKey: "documentTitle",
        header: sortableHeader("Submission"),
        cell: ({ row }) => (
          <Link
            href={`${basePath}/${row.original.id}`}
            className="flex flex-col gap-0.5"
          >
            <span className="font-medium text-foreground hover:underline">
              {row.original.documentTitle}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.documentSummary}
            </span>
          </Link>
        ),
      },
      {
        accessorKey: "documentType",
        header: sortableHeader("Type"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wide"
          >
            {DOCUMENT_TYPE_LABELS[row.original.documentType]}
          </Badge>
        ),
      },
      {
        id: "submitter",
        header: "Submitter",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <PersonAvatar
              name={row.original.submittedBy.name}
              initials={row.original.submittedBy.initials}
              className="size-7 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-foreground">
                {row.original.submittedBy.name}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {row.original.submittedBy.departmentName}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "desk",
        header: "On whose desk",
        cell: ({ row }) => {
          const req = row.original;
          const currentStep = req.steps[req.currentStepIndex];
          if (req.status === "approved")
            return <span className="text-muted-foreground">Complete</span>;
          if (req.status === "rejected")
            return <span className="text-muted-foreground">Halted</span>;
          if (req.status === "cancelled")
            return <span className="text-muted-foreground">Cancelled</span>;
          const approverName = currentStep?.resolvedEmployeeName;
          return (
            <div className="flex items-center gap-2">
              {/* People are found far faster by face than by name (client
                  feedback), so the approver gets an avatar like the submitter. */}
              {approverName && (
                <PersonAvatar
                  name={approverName}
                  className="size-7 shrink-0"
                  fallbackClassName="bg-amber-500/10 text-amber-600 text-xs font-semibold"
                />
              )}
              <div className="flex flex-col leading-tight">
                <span className="text-foreground">
                  {currentStep?.label ?? "—"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {approverName ?? "Unassigned"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "stage",
        header: "Stage",
        cell: ({ row }) => (
          <HoverCard openDelay={150}>
            <HoverCardTrigger asChild>
              <div className="cursor-help">
                <ApprovalChainMeter request={row.original} />
              </div>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-auto max-w-xl">
              <ApprovalChainProgress request={row.original} />
            </HoverCardContent>
          </HoverCard>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 font-medium",
              STATUS_STYLES[row.original.status],
            )}
          >
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "submittedAt",
        header: sortableHeader("Submitted"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(row.original.submittedAt)}
          </span>
        ),
      },
      // Below: columns larger organisations asked for, off by default so the
      // table stays readable, switchable from the table's own columns menu.
      {
        id: "submissionId",
        header: "Submission ID",
        accessorFn: (r) => r.id,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.id}
          </span>
        ),
      },
      {
        id: "daysWaiting",
        header: sortableHeader("Days Waiting"),
        accessorFn: (r) => daysWaiting(r),
        cell: ({ row }) => {
          const days = daysWaiting(row.original);
          const open = row.original.status === "in_progress";
          return (
            <span
              className={cn(
                "text-xs tabular-nums",
                open && days >= 7
                  ? "font-semibold text-amber-600"
                  : "text-muted-foreground",
              )}
            >
              {days} {days === 1 ? "day" : "days"}
            </span>
          );
        },
      },
      {
        id: "lastUpdated",
        header: sortableHeader("Last Updated"),
        accessorFn: (r) => lastUpdatedAt(r),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(lastUpdatedAt(row.original))}
          </span>
        ),
      },
    ],
    [basePath],
  );

  return (
    <>
      <div className="md:hidden">
        <SubmissionCards
          requests={requests}
          basePath={basePath}
          emptyLabel={emptyLabel}
        />
      </div>
      <div className="hidden md:block">
        <DataTable
          exportTitle="Submissions"
          columns={columns}
          data={requests}
          getRowId={(r) => r.id}
          emptyMessage={emptyLabel}
          initialColumnVisibility={{
            submissionId: false,
            daysWaiting: false,
            lastUpdated: false,
          }}
        />
      </div>
    </>
  );
}
