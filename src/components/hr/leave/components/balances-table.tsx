"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
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
} from "@/src/components/ui/dropdown-menu";
import {
  DataTable,
  sortableHeader,
} from "@/src/components/shared/data-table";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  DEPARTMENT_OPTIONS,
  LEAVE_TYPE_OPTIONS,
} from "../data";
import type { LeaveBalance, LeaveTypeName } from "../types";

interface BalancesTableProps {
  balances: LeaveBalance[];
}

export function BalancesTable({ balances }: BalancesTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = balances.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.employeeName.toLowerCase().includes(q) ||
      b.department.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || b.department === deptFilter;
    const matchType = typeFilter === "all" || b.leaveType === typeFilter;
    return matchSearch && matchDept && matchType;
  });

  const activeFilters = [deptFilter !== "all", typeFilter !== "all"].filter(
    Boolean,
  ).length;

  function getRemaining(b: LeaveBalance) {
    return Math.max(0, b.totalEntitlement - b.daysUsed - b.daysPending);
  }

  function getProgressPercent(b: LeaveBalance) {
    if (b.totalEntitlement === 0) return 0;
    return Math.min(
      100,
      Math.round(((b.daysUsed + b.daysPending) / b.totalEntitlement) * 100),
    );
  }

  function getProgressColor(b: LeaveBalance) {
    const pct = getProgressPercent(b);
    if (pct >= 85) return "bg-red-500";
    if (pct >= 60) return "bg-amber-500";
    return "bg-emerald-500";
  }

  function getRemainingColor(b: LeaveBalance) {
    const pct = getProgressPercent(b);
    if (pct >= 85) return "text-red-600 dark:text-red-400";
    if (pct >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  }

  const columns = useMemo<ColumnDef<LeaveBalance>[]>(
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
              <p className="text-xs font-medium leading-tight">
                {row.original.employeeName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {row.original.department}
              </p>
            </div>
          </div>
        ),
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
        accessorKey: "totalEntitlement",
        header: sortableHeader("Entitlement"),
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {row.original.totalEntitlement}d
          </span>
        ),
      },
      {
        accessorKey: "daysUsed",
        header: sortableHeader("Used"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.daysUsed}d
          </span>
        ),
      },
      {
        accessorKey: "daysPending",
        header: sortableHeader("Pending"),
        cell: ({ row }) => (
          <span
            className={`text-xs ${row.original.daysPending > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}
          >
            {row.original.daysPending > 0 ? `${row.original.daysPending}d` : "—"}
          </span>
        ),
      },
      {
        id: "remaining",
        header: "Remaining",
        cell: ({ row }) => (
          <span
            className={`text-xs font-semibold ${getRemainingColor(row.original)}`}
          >
            {getRemaining(row.original)}d
          </span>
        ),
      },
      {
        id: "balance",
        header: "Balance",
        cell: ({ row }) => {
          const pct = getProgressPercent(row.original);
          return (
            <div className="space-y-1 w-40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {pct}% used
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(row.original)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(b) => b.id}
          emptyMessage="No balances found."
        />
      </div>
    </>
  );
}
