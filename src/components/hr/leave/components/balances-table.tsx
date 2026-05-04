"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Users } from "lucide-react";
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
} from "@/src/components/ui/dropdown-menu";
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
                    Entitlement
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Used
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Pending
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Remaining
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs w-40">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">No balances found</p>
                        <p className="text-xs">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => {
                    const remaining = getRemaining(b);
                    const pct = getProgressPercent(b);
                    return (
                      <tr
                        key={b.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                              {b.employeeInitials}
                            </div>
                            <div>
                              <p className="text-xs font-medium leading-tight">
                                {b.employeeName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {b.department}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_TYPE_STYLES[b.leaveType as LeaveTypeName]}`}
                          >
                            {LEAVE_TYPE_LABELS[b.leaveType as LeaveTypeName]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium">
                            {b.totalEntitlement}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {b.daysUsed}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs ${b.daysPending > 0 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}
                          >
                            {b.daysPending > 0 ? `${b.daysPending}d` : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-semibold ${getRemainingColor(b)}`}
                          >
                            {remaining}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">
                                {pct}% used
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getProgressColor(b)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
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
