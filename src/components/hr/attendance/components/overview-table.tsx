"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Plus, MoreHorizontal, Pencil } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";
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
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_STYLES,
  DEPARTMENT_OPTIONS,
} from "../data";
import type { AttendanceRecord, AttendanceStatus } from "../types";

interface OverviewTableProps {
  records: AttendanceRecord[];
  onEdit: (record: AttendanceRecord) => void;
  onLogAttendance: () => void;
}

export function OverviewTable({
  records,
  onEdit,
  onLogAttendance,
}: OverviewTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const presentCount = records.filter((r) =>
    ["present", "late", "early_departure"].includes(r.status),
  ).length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const onLeaveCount = records.filter((r) => r.status === "on_leave").length;
  const earlyCount = records.filter(
    (r) => r.status === "early_departure",
  ).length;

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.employeeName.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.jobTitle.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || r.department === deptFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const activeFilters = [deptFilter !== "all", statusFilter !== "all"].filter(
    Boolean,
  ).length;

  const identity = useEmployeeIdentity();
  const columns = useMemo<ColumnDef<AttendanceRecord>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
              {row.original.employeeInitials}
            </div>
            <div>
              <p className="text-xs font-medium leading-none">
                {row.original.employeeName}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {row.original.jobTitle}
              </p>
            </div>
          </div>
        ),
      },
      ...employeeIdColumns<AttendanceRecord>({
        identity,
        name: (r) => r.employeeName,
      }),
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "clockIn",
        header: "Clock In",
        cell: ({ row }) => (
          <span className="text-xs font-mono">{row.original.clockIn ?? "—"}</span>
        ),
      },
      {
        accessorKey: "clockOut",
        header: "Clock Out",
        cell: ({ row }) =>
          row.original.clockOut ? (
            <span className="text-xs font-mono">{row.original.clockOut}</span>
          ) : row.original.clockIn ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "totalHours",
        header: sortableHeader("Hours"),
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.totalHours ? `${row.original.totalHours}h` : "—"}
          </span>
        ),
      },
      {
        accessorKey: "overtimeHours",
        header: sortableHeader("Overtime"),
        cell: ({ row }) => (
          <span
            className={`text-xs font-medium ${
              row.original.overtimeHours > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
            }`}
          >
            {row.original.overtimeHours > 0
              ? `+${row.original.overtimeHours}h`
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ATTENDANCE_STATUS_STYLES[row.original.status]}`}
            >
              {ATTENDANCE_STATUS_LABELS[row.original.status]}
            </span>
            {row.original.location && (
              <span className="text-[10px] text-muted-foreground">
                {row.original.location}
              </span>
            )}
          </div>
        ),
      },
      actionsColumn<AttendanceRecord>((record) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(record)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit, identity],
  );

  const summaryBadges = [
    {
      label: `${presentCount} Present`,
      style: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: `${lateCount} Late`,
      style: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: `${absentCount} Absent`,
      style: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    {
      label: `${onLeaveCount} On Leave`,
      style: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    ...(earlyCount > 0
      ? [
          {
            label: `${earlyCount} Early Departure`,
            style: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, title or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilters > 0 && (
                  <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">
                Department
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={deptFilter}
                onValueChange={setDeptFilter}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Departments
                </DropdownMenuRadioItem>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <DropdownMenuRadioItem key={d} value={d} className="text-xs">
                    {d}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Statuses
                </DropdownMenuRadioItem>
                {(
                  [
                    "present",
                    "late",
                    "absent",
                    "early_departure",
                    "on_leave",
                  ] as AttendanceStatus[]
                ).map((s) => (
                  <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                    {ATTENDANCE_STATUS_LABELS[s]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              {activeFilters > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-full text-xs text-muted-foreground"
                      onClick={() => {
                        setDeptFilter("all");
                        setStatusFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="lg"
            onClick={onLogAttendance}
          >
            <Plus className="w-3.5 h-3.5" />
            Log Attendance
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          exportTitle="Attendance"
          columns={columns}
          initialColumnVisibility={HIDE_SYSTEM_ID}
          enableColumnVisibility
          data={filtered}
          getRowId={(r) => r.id}
          emptyMessage="No records found."
        />
      </div>
    </>
  );
}
