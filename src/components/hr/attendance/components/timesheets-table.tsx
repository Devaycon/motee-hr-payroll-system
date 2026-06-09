"use client";

import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_STYLES,
  DEPARTMENT_OPTIONS,
} from "../data";
import type { TimesheetRecord, TimesheetStatus } from "../types";

interface TimesheetsTableProps {
  timesheets: TimesheetRecord[];
  onView: (ts: TimesheetRecord) => void;
  onApprove: (id: string) => void;
  onRejectClick: (ts: TimesheetRecord) => void;
}

export function TimesheetsTable({
  timesheets,
  onView,
  onApprove,
  onRejectClick,
}: TimesheetsTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = timesheets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.employeeName.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || t.department === deptFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const activeFilters = [deptFilter !== "all", statusFilter !== "all"].filter(
    Boolean,
  ).length;

  function formatWeekRange(weekStart: string, weekEnd: string) {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const startStr = start.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
    });
    const endStr = end.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  }

  const columns = useMemo<ColumnDef<TimesheetRecord>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
              {row.original.employeeInitials}
            </div>
            <span className="text-xs font-medium">
              {row.original.employeeName}
            </span>
          </div>
        ),
      },
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
        id: "week",
        header: "Week",
        cell: ({ row }) => (
          <span className="text-xs">
            {formatWeekRange(row.original.weekStart, row.original.weekEnd)}
          </span>
        ),
      },
      {
        id: "days",
        header: "Days",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-[10px] font-medium">
            <span className="text-emerald-600 dark:text-emerald-400">
              {row.original.daysPresent}P
            </span>
            {row.original.daysLate > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {row.original.daysLate}L
              </span>
            )}
            {row.original.daysAbsent > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {row.original.daysAbsent}A
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "totalHours",
        header: sortableHeader("Total Hours"),
        cell: ({ row }) => (
          <span className="text-xs font-medium">{row.original.totalHours}h</span>
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
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${TIMESHEET_STATUS_STYLES[row.original.status]}`}
          >
            {TIMESHEET_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      actionsColumn<TimesheetRecord>((ts) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onView(ts)}
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
            </DropdownMenuItem>
            {ts.status === "submitted" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs gap-2 text-emerald-600 focus:text-emerald-600"
                  onClick={() => onApprove(ts.id)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Quick Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs gap-2 text-destructive focus:text-destructive"
                  onClick={() => onRejectClick(ts)}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onView, onApprove, onRejectClick],
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by employee or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg">
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
                  "pending",
                  "submitted",
                  "approved",
                  "rejected",
                ] as TimesheetStatus[]
              ).map((s) => (
                <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                  {TIMESHEET_STATUS_LABELS[s]}
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
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(t) => t.id}
          emptyMessage="No timesheets found."
        />
      </div>
    </>
  );
}
