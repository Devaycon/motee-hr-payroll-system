"use client";

import { useMemo } from "react";
import {
  MoreHorizontal,
  ClipboardList,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Progress } from "@/src/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import {
  OFFBOARDING_STATUS_LABELS,
  OFFBOARDING_STATUS_STYLES,
  EXIT_REASON_LABELS,
  EXIT_REASON_STYLES,
} from "../data";
import type { OffboardingRecord } from "../types";

interface PipelineTableProps {
  records: OffboardingRecord[];
  onViewDetails: (record: OffboardingRecord) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PipelineTable({
  records,
  onViewDetails,
  onComplete,
  onDelete,
}: PipelineTableProps) {
  const columns = useMemo<ColumnDef<OffboardingRecord>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              name={row.original.employeeName}
              initials={row.original.employeeInitials}
              className="h-7 w-7"
              fallbackClassName="text-[10px] font-semibold bg-destructive/10 text-destructive"
            />
            <div>
              <p className="text-sm font-medium text-foreground leading-none">
                {row.original.employeeName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {row.original.jobTitle}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <p className="text-xs text-muted-foreground">
            {row.original.department}
          </p>
        ),
      },
      {
        accessorKey: "lastWorkingDate",
        header: sortableHeader("Last Working Day"),
        cell: ({ row }) => (
          <p className="text-xs text-muted-foreground tabular-nums">
            {row.original.lastWorkingDate}
          </p>
        ),
      },
      {
        accessorKey: "exitReason",
        header: sortableHeader("Exit Reason"),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              EXIT_REASON_STYLES[row.original.exitReason],
            )}
          >
            {EXIT_REASON_LABELS[row.original.exitReason]}
          </span>
        ),
      },
      {
        id: "clearance",
        header: "Clearance",
        cell: ({ row }) => {
          const clearedCount = row.original.clearanceItems.filter(
            (c) => c.completed,
          ).length;
          const totalClearance = row.original.clearanceItems.length;
          const clearancePct =
            totalClearance > 0
              ? Math.round((clearedCount / totalClearance) * 100)
              : 0;
          return (
            <div className="flex flex-col gap-1 min-w-32">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {clearedCount}/{totalClearance} items
                </span>
                <span className="text-xs font-medium text-foreground">
                  {clearancePct}%
                </span>
              </div>
              <Progress value={clearancePct} className="h-1.5" />
            </div>
          );
        },
      },
      {
        id: "exitInterview",
        header: "Exit Interview",
        cell: ({ row }) =>
          row.original.exitInterviewCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Completed
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Pending</span>
          ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              OFFBOARDING_STATUS_STYLES[row.original.status],
            )}
          >
            {OFFBOARDING_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      actionsColumn<OffboardingRecord>((record) => {
        const clearedCount = record.clearanceItems.filter(
          (c) => c.completed,
        ).length;
        const allClearanceDone = clearedCount === record.clearanceItems.length;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={() => onViewDetails(record)}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                View Details
              </DropdownMenuItem>
              {record.status !== "completed" && allClearanceDone && (
                <DropdownMenuItem
                  className="text-xs gap-2 text-emerald-600 focus:text-emerald-600 dark:text-emerald-400"
                  onClick={() => onComplete(record.id)}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-xs gap-2 text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Remove Offboarding Record
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove the offboarding record for{" "}
                      <span className="font-semibold text-foreground">
                        {record.employeeName}
                      </span>
                      ?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(record.id)}
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }),
    ],
    [onViewDetails, onComplete, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={records}
      getRowId={(r) => r.id}
      emptyMessage="No offboarding records found."
    />
  );
}
