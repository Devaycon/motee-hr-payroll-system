"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal,
  Pencil,
  UserCheck,
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
                    Department
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Clock In
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Clock Out
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Hours
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Overtime
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
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UserCheck className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">No records found</p>
                        <p className="text-xs">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                            {record.employeeInitials}
                          </div>
                          <div>
                            <p className="text-xs font-medium leading-none">
                              {record.employeeName}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {record.jobTitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {record.department}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono">
                          {record.clockIn ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {record.clockOut ? (
                          <span className="text-xs font-mono">
                            {record.clockOut}
                          </span>
                        ) : record.clockIn ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs">
                          {record.totalHours ? `${record.totalHours}h` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            record.overtimeHours > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {record.overtimeHours > 0
                            ? `+${record.overtimeHours}h`
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ATTENDANCE_STATUS_STYLES[record.status]}`}
                          >
                            {ATTENDANCE_STATUS_LABELS[record.status]}
                          </span>
                          {record.location && (
                            <span className="text-[10px] text-muted-foreground">
                              {record.location}
                            </span>
                          )}
                        </div>
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
