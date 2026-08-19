"use client";

import { useMemo } from "react";
import {
  MoreHorizontal,
  ClipboardList,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShieldOff,
  CalendarClock,
  FileDown,
  Pencil,
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
import {
  employeeIdColumns,
  HIDE_SYSTEM_ID,
} from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import { cn } from "@/src/lib/utils";
import {
  OFFBOARDING_STATUS_LABELS,
  OFFBOARDING_STATUS_STYLES,
  EXIT_REASON_LABELS,
  EXIT_REASON_STYLES,
} from "../data";
import { isActionEnabled, type OffboardingAction } from "../actions";
import type { OffboardingRecord } from "../types";

export interface PipelineHandlers {
  onViewDetails: (record: OffboardingRecord) => void;
  onEdit: (record: OffboardingRecord) => void;
  onApprove: (record: OffboardingRecord) => void;
  onDisapprove: (record: OffboardingRecord) => void;
  onReactivate: (record: OffboardingRecord) => void;
  onRevokeAccess: (record: OffboardingRecord) => void;
  onScheduleInterview: (record: OffboardingRecord) => void;
  onGenerateDocuments: (record: OffboardingRecord) => void;
  onDelete: (id: string) => void;
}

interface PipelineTableProps extends PipelineHandlers {
  records: OffboardingRecord[];
  emptyMessage?: string;
}

export function PipelineTable({
  records,
  emptyMessage = "No offboarding records found.",
  onViewDetails,
  onEdit,
  onApprove,
  onDisapprove,
  onReactivate,
  onRevokeAccess,
  onScheduleInterview,
  onGenerateDocuments,
  onDelete,
}: PipelineTableProps) {
  const identity = useEmployeeIdentity();
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
      ...employeeIdColumns<OffboardingRecord>({
        identity,
        systemId: (r) => r.employeeId,
        name: (r) => r.employeeName,
      }),
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
        const can = (a: OffboardingAction) => isActionEnabled(a, record.status);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="text-xs gap-2"
                disabled={!can("viewChecklist")}
                onClick={() => onViewDetails(record)}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                View Offboarding Checklist
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2"
                disabled={!can("edit")}
                onClick={() => onEdit(record)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Offboarding Details
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-xs gap-2 text-emerald-600 focus:text-emerald-600 dark:text-emerald-400"
                disabled={!can("approve")}
                onClick={() => onApprove(record)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve Offboarding
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2 text-destructive focus:text-destructive"
                disabled={!can("disapprove")}
                onClick={() => onDisapprove(record)}
              >
                <XCircle className="w-3.5 h-3.5" />
                Disapprove Offboarding
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2"
                disabled={!can("reactivate")}
                onClick={() => onReactivate(record)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reactivate Employee
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-xs gap-2"
                disabled={!can("revokeAccess")}
                onClick={() => onRevokeAccess(record)}
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Revoke System Access
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2"
                disabled={!can("scheduleInterview")}
                onClick={() => onScheduleInterview(record)}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Schedule Exit Interview
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2"
                disabled={!can("generateDocuments")}
                onClick={() => onGenerateDocuments(record)}
              >
                <FileDown className="w-3.5 h-3.5" />
                Generate Exit Documents
              </DropdownMenuItem>

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
    [onViewDetails,
      onEdit,
      onApprove,
      onDisapprove,
      onReactivate,
      onRevokeAccess,
      onScheduleInterview,
      onGenerateDocuments,
      onDelete, identity],
  );

  return (
    <DataTable
      exportTitle="Offboarding Pipeline"
      columns={columns}
      initialColumnVisibility={HIDE_SYSTEM_ID}
      enableColumnVisibility
      data={records}
      getRowId={(r) => r.id}
      emptyMessage={emptyMessage}
    />
  );
}
