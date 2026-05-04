"use client";

import { Search, Plus, SlidersHorizontal } from "lucide-react";
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
import { DEPARTMENT_OPTIONS, REQUISITION_STATUS_LABELS } from "../data";
import type { RequisitionStatus } from "../types";

interface RequisitionsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onAdd: () => void;
}

const STATUS_OPTIONS: RequisitionStatus[] = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "closed",
];

export function RequisitionsToolbar({
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  statusFilter,
  onStatusFilterChange,
  onAdd,
}: RequisitionsToolbarProps) {
  const hasActiveFilter = deptFilter !== "all" || statusFilter !== "all";

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by title or department..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilter && (
                <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold">
                  {
                    [deptFilter !== "all", statusFilter !== "all"].filter(
                      Boolean,
                    ).length
                  }
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
              onValueChange={onDeptFilterChange}
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
              onValueChange={onStatusFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Statuses
              </DropdownMenuRadioItem>
              {STATUS_OPTIONS.map((s) => (
                <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                  {REQUISITION_STATUS_LABELS[s]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {hasActiveFilter && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-xs text-muted-foreground"
                    onClick={() => {
                      onDeptFilterChange("all");
                      onStatusFilterChange("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          New Requisition
        </Button>
      </div>
    </div>
  );
}
