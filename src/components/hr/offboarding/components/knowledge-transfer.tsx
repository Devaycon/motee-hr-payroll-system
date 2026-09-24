"use client";

import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle,
  Hourglass,
  OctagonAlert,
  ArrowRight,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import {
  KNOWLEDGE_TRANSFER_STATUS_LABELS,
  KNOWLEDGE_TRANSFER_STATUS_STYLES,
  knowledgeTransferCleared,
  knowledgeTransferStatus,
  type KnowledgeTransferStatus,
} from "@/src/lib/offboarding/knowledge-transfer";
import type { OffboardingRecord } from "../types";

/** Exits that are going ahead — disapproved/reactivated ones need no handover. */
const TRACKED_STATUSES = new Set<OffboardingRecord["status"]>([
  "pending",
  "approved",
  "in_progress",
  "completed",
]);

type ViewFilter = "required" | "pending" | "blocking" | "complete" | "all";

const VIEW_FILTERS: { value: ViewFilter; label: string }[] = [
  { value: "required", label: "Required" },
  { value: "pending", label: "Pending" },
  { value: "blocking", label: "Blocking sign-off" },
  { value: "complete", label: "Complete" },
  { value: "all", label: "All exits" },
];

interface KtRow {
  record: OffboardingRecord;
  status: KnowledgeTransferStatus;
  done: number;
  total: number;
  /** Everything else is signed off — only the handover is holding the exit. */
  blocking: boolean;
}

/** "Knowledge Transfer ✓ Complete / Pending" cell (Offboarding feedback §3). */
export function KnowledgeTransferBadge({
  record,
}: {
  record: OffboardingRecord;
}) {
  const status = knowledgeTransferStatus(record);
  if (status === "not_required") {
    return <span className="text-xs text-muted-foreground">Not required</span>;
  }
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="w-3.5 h-3.5" />
        Complete
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        KNOWLEDGE_TRANSFER_STATUS_STYLES[status],
      )}
    >
      {KNOWLEDGE_TRANSFER_STATUS_LABELS[status]}
    </span>
  );
}

interface KnowledgeTransferTabProps {
  /** Records after the page's search / department / reason filters. */
  records: OffboardingRecord[];
  /** Opens the record's detail modal on its Knowledge Transfer tab. */
  onManage: (record: OffboardingRecord) => void;
}

/**
 * Knowledge Transfer dashboard (Offboarding feedback §3): which leavers owe a
 * handover, how far along each one is, and which exits it is holding up.
 */
export function KnowledgeTransferTab({
  records,
  onManage,
}: KnowledgeTransferTabProps) {
  const [view, setView] = useState<ViewFilter>("required");

  const rows = useMemo<KtRow[]>(
    () =>
      records
        .filter((r) => TRACKED_STATUSES.has(r.status))
        .map((record) => {
          const items = record.knowledgeTransfer?.items ?? [];
          return {
            record,
            status: knowledgeTransferStatus(record),
            done: items.filter((i) => i.completed).length,
            total: items.length,
            blocking:
              record.status !== "completed" &&
              record.exitInterviewCompleted &&
              record.clearanceItems.every((c) => c.completed) &&
              !knowledgeTransferCleared(record),
          };
        }),
    [records],
  );

  const required = rows.filter((r) => r.status !== "not_required");
  const complete = rows.filter((r) => r.status === "complete");
  const pending = required.filter((r) => r.status !== "complete");
  const blocking = rows.filter((r) => r.blocking);
  const noSuccessor = pending.filter(
    (r) => !r.record.knowledgeTransfer?.successorName,
  ).length;

  const stats: HrStatCardItem[] = [
    {
      label: "Handover Required",
      value: required.length,
      sub: "Leadership & specialist exits",
      zeroSub: "No exits need a handover",
      icon: BookOpenCheck,
      tone: "violet",
      active: view === "required",
      onClick: () => setView("required"),
    },
    {
      label: "Pending",
      value: pending.length,
      sub:
        noSuccessor > 0
          ? `${noSuccessor} with no successor named`
          : "Handover still under way",
      zeroSub: "Nothing outstanding",
      icon: Hourglass,
      tone: "amber",
      active: view === "pending",
      onClick: () => setView("pending"),
    },
    {
      label: "Blocking Sign-off",
      value: blocking.length,
      sub: "Cleared except for handover",
      zeroSub: "Not holding up any exit",
      icon: OctagonAlert,
      tone: "red",
      active: view === "blocking",
      onClick: () => setView("blocking"),
    },
    {
      label: "Complete",
      value: complete.length,
      sub: "Handover signed off",
      icon: CheckCircle,
      tone: "emerald",
      active: view === "complete",
      onClick: () => setView("complete"),
    },
  ];

  const visible =
    view === "all"
      ? rows
      : view === "required"
        ? required
        : view === "pending"
          ? pending
          : view === "blocking"
            ? blocking
            : complete;

  const columns = useMemo<ColumnDef<KtRow>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (r) => r.record.employeeName,
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              name={row.original.record.employeeName}
              initials={row.original.record.employeeInitials}
              className="h-7 w-7"
              fallbackClassName="text-[10px] font-semibold bg-destructive/10 text-destructive"
            />
            <div>
              <p className="text-sm font-medium text-foreground leading-none">
                {row.original.record.employeeName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {row.original.record.jobTitle}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "successor",
        accessorFn: (r) => r.record.knowledgeTransfer?.successorName ?? "",
        header: sortableHeader("Successor"),
        cell: ({ row }) => {
          const name = row.original.record.knowledgeTransfer?.successorName;
          return name ? (
            <span className="text-sm text-foreground">{name}</span>
          ) : (
            <span
              className={cn(
                "text-xs",
                row.original.status === "not_required" ||
                  row.original.status === "complete"
                  ? "text-muted-foreground"
                  : "text-amber-600 dark:text-amber-400",
              )}
            >
              Not named
            </span>
          );
        },
      },
      {
        id: "progress",
        accessorFn: (r) => (r.total ? r.done / r.total : 0),
        header: sortableHeader("Handover"),
        cell: ({ row }) => {
          const { done, total } = row.original;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <div className="flex flex-col gap-1 min-w-32">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {done}/{total} steps
                </span>
                <span className="text-xs font-medium text-foreground">
                  {pct}%
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        },
      },
      {
        id: "status",
        accessorFn: (r) => KNOWLEDGE_TRANSFER_STATUS_LABELS[r.status],
        header: sortableHeader("Knowledge Transfer"),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <KnowledgeTransferBadge record={row.original.record} />
            {row.original.blocking && (
              <span className="text-[11px] text-red-600 dark:text-red-400">
                Holding up sign-off
              </span>
            )}
          </div>
        ),
      },
      {
        id: "lastWorkingDate",
        accessorFn: (r) => r.record.lastWorkingDate,
        header: sortableHeader("Last Working Day"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.original.record.lastWorkingDate}
          </span>
        ),
      },
      actionsColumn<KtRow>((r) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => onManage(r.record)}
        >
          Manage
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )),
    ],
    [onManage],
  );

  return (
    <div className="flex flex-col gap-4">
      <HrStatCardsGrid stats={stats} columns={4} />
      <DataTable
        exportTitle="Knowledge Transfer"
        columns={columns}
        data={visible}
        getRowId={(r) => r.record.id}
        toolbarActions={
          <div className="flex items-center rounded-md border border-border p-0.5">
            {VIEW_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={view === f.value}
                onClick={() => setView(f.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs transition-colors",
                  view === f.value
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
        emptyMessage={
          view === "blocking"
            ? "No exits are waiting on a handover."
            : "No exits in this view."
        }
      />
    </div>
  );
}
