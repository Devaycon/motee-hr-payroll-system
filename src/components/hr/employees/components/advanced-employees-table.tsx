"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Card } from "@/src/components/ui/card";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { employeeIdColumns } from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import { cn } from "@/src/lib/utils";
import { leaveTypeTone } from "@/src/lib/utils/active-leave";
import {
  STATUS_STYLES,
  STATUS_LABELS,
  EMPLOYMENT_TYPE_STYLES,
  EMPLOYMENT_TYPE_LABELS,
  formatDate,
} from "../data";
import {
  EmployeeRowActions,
  type EmployeeRowHandlers,
} from "./employee-row-actions";
import type { EmployeeRow } from "../types";

interface AdvancedEmployeesTableProps extends EmployeeRowHandlers {
  employees: EmployeeRow[];
  emptyMessage?: string;
}

/**
 * The Employees table body. Tabs live at page level (see `../index.tsx`) — this
 * component renders whatever pre-filtered rows it is handed.
 */
export function AdvancedEmployeesTable({
  employees,
  emptyMessage = "No employees found.",
  ...handlers
}: AdvancedEmployeesTableProps) {
  const router = useRouter();
  const identity = useEmployeeIdentity();

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Employee"),
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonAvatar
              name={row.original.name}
              initials={row.original.initials}
              gender={row.original.gender}
              className="size-8 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
            />
            <div>
              <button
                className="text-sm font-medium text-foreground hover:text-primary hover:underline text-left"
                onClick={() =>
                  router.push(`/organization/employees/${row.original.id}`)
                }
              >
                {row.original.name}
              </button>
              <p className="text-[11px] text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      ...employeeIdColumns<EmployeeRow>({
        identity,
        systemId: (e) => e.id,
        employeeId: (e) => e.referenceId,
        name: (e) => e.name,
      }),
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "branchName",
        header: sortableHeader("Branch"),
        cell: ({ row }) =>
          row.original.branchName ? (
            <span className="text-sm text-foreground">
              {row.original.branchName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          ),
      },
      {
        accessorKey: "jobTitle",
        header: sortableHeader("Job Title"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.jobTitle}
          </span>
        ),
      },
      {
        accessorKey: "employmentType",
        header: sortableHeader("Employment Type"),
        cell: ({ row }) => (
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              EMPLOYMENT_TYPE_STYLES[row.original.employmentType] ?? "",
            )}
          >
            {EMPLOYMENT_TYPE_LABELS[row.original.employmentType] ??
              row.original.employmentType}
          </span>
        ),
      },
      {
        accessorKey: "managerName",
        header: sortableHeader("Line Manager"),
        cell: ({ row }) =>
          row.original.managerName ? (
            <span className="text-sm text-foreground">
              {row.original.managerName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          ),
      },
      {
        accessorKey: "directReportCount",
        header: sortableHeader("Line Manager Status"),
        cell: ({ row }) => {
          const count = row.original.directReportCount ?? 0;
          return count > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 whitespace-nowrap">
              Active Line Manager
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Not a Manager</span>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: sortableHeader("Start Date"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.startDate)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                STATUS_STYLES[row.original.status] ?? "",
              )}
            >
              {STATUS_LABELS[row.original.status] ?? row.original.status}
            </span>
            {/* Which kind of leave, not just that they're away (§C1). */}
            {row.original.status === "on_leave" && row.original.leaveTypeLabel && (
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap",
                  leaveTypeTone(row.original.leaveType),
                )}
                title={
                  row.original.leaveReturnDate
                    ? `Back on ${formatDate(row.original.leaveReturnDate)}`
                    : undefined
                }
              >
                {row.original.leaveTypeLabel}
              </span>
            )}
          </div>
        ),
      },
      actionsColumn<EmployeeRow>((e) => (
        <EmployeeRowActions employee={e} {...handlers} />
      )),
    ],
    // `handlers` is a fresh object each render; the individual callbacks it
    // holds are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      router,
      identity,
      handlers.onView,
      handlers.onEdit,
      handlers.onSendCredentials,
      handlers.onSendKudos,
      handlers.onDeactivate,
      handlers.onReactivate,
      handlers.onExit,
      handlers.onDelete,
      handlers.onRestore,
    ],
  );

  return (
    <Card className="flex flex-col p-4">
      <DataTable
        exportTitle="Employees"
        columns={columns}
        data={employees}
        getRowId={(e) => e.id}
        enableSelection
        enableDnd
        enableColumnVisibility
        // Off by default: most tenants run one site, and the navbar switcher
        // already says which branch you are looking at. Turn it on from the
        // column menu when comparing across branches.
        initialColumnVisibility={{ branchName: false }}
        pageSize={10}
        emptyMessage={emptyMessage}
      />
    </Card>
  );
}
