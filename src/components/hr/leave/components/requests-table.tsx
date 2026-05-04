"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  CalendarOff,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
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
      month: "short",
      year: "numeric",
    });
  }

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
          <Button
            size="lg"
            onClick={onNewRequest}
          >
            <Plus className="w-3.5 h-3.5" />
            New Request
          </Button>
        </div>
      </div>

      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Employee
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Leave Type
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Date Range
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Duration
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Submitted
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Status
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CalendarOff className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">
                          No leave requests found
                        </p>
                        <p className="text-xs">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => {
                    const isOnLeaveNow =
                      req.status === "approved" &&
                      req.startDate <= today &&
                      req.endDate >= today;
                    return (
                      <tr
                        key={req.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                              {req.employeeInitials}
                              {isOnLeaveNow && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500 ring-1 ring-background" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium leading-tight">
                                {req.employeeName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {req.department}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_TYPE_STYLES[req.leaveType as LeaveTypeName]}`}
                          >
                            {LEAVE_TYPE_LABELS[req.leaveType as LeaveTypeName]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs">
                            {formatDate(req.startDate)}
                            {req.startDate !== req.endDate && (
                              <> – {formatDate(req.endDate)}</>
                            )}
                          </span>
                          {req.isHalfDay && req.halfDayPeriod && (
                            <p className="text-[10px] text-muted-foreground capitalize">
                              {req.halfDayPeriod} half
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium">
                            {req.totalDays === 0.5
                              ? "½ day"
                              : `${req.totalDays} day${req.totalDays !== 1 ? "s" : ""}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(req.submittedAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_STATUS_STYLES[req.status]}`}
                          >
                            {LEAVE_STATUS_LABELS[req.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
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
                              {req.status === "pending" && (
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
