"use client";

import { Search, SlidersHorizontal } from "lucide-react";
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
import { EMPLOYMENT_TYPE_LABELS } from "../data";
import { useDepartmentOptions } from "../hooks";

interface EmployeesToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
}

export function EmployeesToolbar({
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
}: EmployeesToolbarProps) {
  const { data: deptOptions } = useDepartmentOptions();
  const depts = deptOptions ?? ["all"];

  const hasActiveFilter =
    deptFilter !== "all" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="relative bg-pr flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or department..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              className="h-10 text-xs gap-1.5"
              data-active={hasActiveFilter}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilter && (
                <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold">
                  {
                    [
                      deptFilter !== "all",
                      typeFilter !== "all",
                      statusFilter !== "all",
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">
              Department
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={deptFilter}
              onValueChange={onDeptFilterChange}
            >
              {depts.map((d) => (
                <DropdownMenuRadioItem key={d} value={d} className="text-xs">
                  {d === "all" ? "All Departments" : d}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">
              Employment Type
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={typeFilter}
              onValueChange={onTypeFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Types
              </DropdownMenuRadioItem>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => (
                <DropdownMenuRadioItem key={k} value={k} className="text-xs">
                  {v}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={onStatusFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Statuses
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="active" className="text-xs">
                Active
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="on_leave" className="text-xs">
                On Leave
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="probation" className="text-xs">
                Probation
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
