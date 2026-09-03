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
import { useBranchOptions } from "@/src/lib/branches/use-branch";

// Export lives on the employees table itself (DataTable renders an ExportMenu
// from its visible columns and current sort/filter). This toolbar used to
// carry a second one, which put two Export buttons on the page exporting the
// same rows.

interface EmployeesToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  workModeFilter: string;
  onWorkModeFilterChange: (v: string) => void;
  /** Branch id, or "all". Narrows within whatever the navbar switcher shows. */
  branchFilter: string;
  onBranchFilterChange: (v: string) => void;
}

/** Matches the display values produced by `toEmployeeRow` in ../hooks.ts. */
const WORK_MODE_LABELS: Record<string, string> = {
  Remotely: "Remote",
  Hybrid: "Hybrid",
  "At Office": "At Office",
};

export function EmployeesToolbar({
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  typeFilter,
  onTypeFilterChange,
  workModeFilter,
  onWorkModeFilterChange,
  branchFilter,
  onBranchFilterChange,
}: EmployeesToolbarProps) {
  const { data: deptOptions } = useDepartmentOptions();
  const depts = deptOptions ?? ["all"];
  const branches = useBranchOptions();

  // Status is not a filter here — it is the tab strip above the table
  // (client feedback §1.1); a second status control fought with it.
  const activeFilters = [
    deptFilter !== "all",
    typeFilter !== "all",
    workModeFilter !== "all",
    branchFilter !== "all",
  ].filter(Boolean).length;
  const hasActiveFilter = activeFilters > 0;

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
                  {activeFilters}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {/* Only worth showing for a multi-site company — a single-branch
                tenant already sees everyone. */}
            {branches.length > 1 && (
              <>
                <DropdownMenuLabel className="text-xs">Branch</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={branchFilter}
                  onValueChange={onBranchFilterChange}
                >
                  <DropdownMenuRadioItem value="all" className="text-xs">
                    All Branches
                  </DropdownMenuRadioItem>
                  {branches.map((b) => (
                    <DropdownMenuRadioItem
                      key={b.id}
                      value={b.id}
                      className="text-xs"
                    >
                      {b.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
              </>
            )}

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
            <DropdownMenuLabel className="text-xs">Work Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={workModeFilter}
              onValueChange={onWorkModeFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Work Modes
              </DropdownMenuRadioItem>
              {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                <DropdownMenuRadioItem key={value} value={value} className="text-xs">
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
