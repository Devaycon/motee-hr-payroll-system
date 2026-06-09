"use client";

import { useMemo } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Badge } from "@/src/components/ui/badge";
import {
  DataTable,
  sortableHeader,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import {
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  type ApprovalRequest,
} from "@/src/lib/types/approvals";
import { formatRelativeDate } from "../utils";

interface QueueTableProps {
  requests: ApprovalRequest[];
  basePath?: string;
  emptyLabel?: string;
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
          return (
            <div className="flex flex-col">
              <span className="text-foreground">
                {currentStep?.label ?? "—"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {currentStep?.resolvedEmployeeName ?? "Unassigned"}
              </span>
            </div>
          );
        },
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
    ],
    [basePath],
  );

  return (
    <DataTable
      columns={columns}
      data={requests}
      getRowId={(r) => r.id}
      emptyMessage={emptyLabel}
    />
  );
}
