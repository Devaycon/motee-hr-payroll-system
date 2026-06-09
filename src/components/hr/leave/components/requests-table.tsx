"use client";

import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
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
import { useCan } from "@/src/lib/permissions/use-can";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import {
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  DEPARTMENT_OPTIONS,
  LEAVE_TYPE_OPTIONS,
} from "../data";
import type { LeaveRequest, LeaveStatus, LeaveTypeName } from "../types";

interface RequestsTableProps {
  requests: LeaveRequest[];
  onView: (request: LeaveRequest) => void;
  onApprove: (id: string) => void;
  onRejectClick: (request: LeaveRequest) => void;
  onNewRequest: () => void;
}

export function RequestsTable({
  requests,
  onView,
  onApprove,
  onRejectClick,
  onNewRequest,
}: RequestsTableProps) {
  const canApprove = useCan("time-payroll.leave", "approve");
  const canCreate = useCan("time-payroll.leave", "create");
  const today = new Date().toISOString().slice(0, 10);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.employeeName.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || r.department === deptFilter;
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType = typeFilter === "all" || r.leaveType === typeFilter;
    return matchSearch && matchDept && matchStatus && matchType;
  });

  const activeFilters = [
    deptFilter !== "all",
    statusFilter !== "all",
    typeFilter !== "all",
  ].filter(Boolean).length;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => {
          const isOnLeaveNow =
            row.original.status === "approved" &&
            row.original.startDate <= today &&
            row.original.endDate >= today;
          return (
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                {row.original.employeeInitials}
                {isOnLeaveNow && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 ring-1 ring-background" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium leading-tight">
                  {row.original.employeeName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {row.original.department}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "leaveType",
        header: sortableHeader("Leave Type"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_TYPE_STYLES[row.original.leaveType as LeaveTypeName]}`}
          >
            {LEAVE_TYPE_LABELS[row.original.leaveType as LeaveTypeName]}
          </span>
        ),
      },
      {
        id: "dateRange",
        header: "Date Range",
        cell: ({ row }) => (
          <div>
            <span className="text-xs">
              {formatDate(row.original.startDate)}
              {row.original.startDate !== row.original.endDate && (
                <> – {formatDate(row.original.endDate)}</>
              )}
            </span>
            {row.original.isHalfDay && row.original.halfDayPeriod && (
              <p className="text-[10px] text-muted-foreground capitalize">
                {row.original.halfDayPeriod} half
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "totalDays",
        header: sortableHeader("Duration"),
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {row.original.totalDays === 0.5
              ? "½ day"
              : `${row.original.totalDays} day${row.original.totalDays !== 1 ? "s" : ""}`}
          </span>
        ),
      },
      {
        accessorKey: "submittedAt",
        header: sortableHeader("Submitted"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.submittedAt)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_STATUS_STYLES[row.original.status]}`}
          >
            {LEAVE_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      actionsColumn<LeaveRequest>((req) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onView(req)}
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
            </DropdownMenuItem>
            {req.status === "pending" && canApprove && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs gap-2 text-emerald-600 focus:text-emerald-600"
                  onClick={() => onApprove(req.id)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Quick Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs gap-2 text-destructive focus:text-destructive"
                  onClick={() => onRejectClick(req)}
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
    [today, canApprove, onView, onApprove, onRejectClick],
  );

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative min-w-48 max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by employee or department..."
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
            <DropdownMenuContent align="end" className="w-56">
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
              <DropdownMenuLabel className="text-xs">
                Leave Type
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <DropdownMenuRadioItem value="all" className="text-xs">
                  All Types
                </DropdownMenuRadioItem>
                {LEAVE_TYPE_OPTIONS.map((t) => (
                  <DropdownMenuRadioItem key={t} value={t} className="text-xs">
                    {LEAVE_TYPE_LABELS[t]}
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
                    "approved",
                    "rejected",
                    "cancelled",
                  ] as LeaveStatus[]
                ).map((s) => (
                  <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                    {LEAVE_STATUS_LABELS[s]}
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
                        setTypeFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate && (
            <Button size="lg" onClick={onNewRequest}>
              <Plus className="w-3.5 h-3.5" />
              New Request
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(r) => r.id}
          emptyMessage="No leave requests found."
        />
      </div>
    </>
  );
}
