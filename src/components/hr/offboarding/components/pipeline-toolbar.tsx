"use client";

import { Search, SlidersHorizontal, Plus } from "lucide-react";
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
import { DEPARTMENT_OPTIONS, EXIT_REASON_LABELS } from "../data";
import type { ExitReason } from "../types";

interface PipelineToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
  reasonFilter: string;
  onReasonFilterChange: (v: string) => void;
  onInitiate: () => void;
}

export function PipelineToolbar({
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  reasonFilter,
  onReasonFilterChange,
  onInitiate,
}: PipelineToolbarProps) {
  // Status is not a filter here — it is the tab strip below (§2.1).
  const activeFilters = [deptFilter !== "all", reasonFilter !== "all"].filter(
    Boolean,
  ).length;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, title or department..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size={"lg"} className="gap-2" onClick={() => {}}>
              <SlidersHorizontal className="w-4 h-4" />
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
            <DropdownMenuLabel className="text-xs">
              Exit Reason
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={reasonFilter}
              onValueChange={onReasonFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Reasons
              </DropdownMenuRadioItem>
              {(Object.keys(EXIT_REASON_LABELS) as ExitReason[]).map((r) => (
                <DropdownMenuRadioItem key={r} value={r} className="text-xs">
                  {EXIT_REASON_LABELS[r]}
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
                      onDeptFilterChange("all");
                      onReasonFilterChange("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="gap-2" size={"lg"} onClick={onInitiate}>
          <Plus className="w-4 h-4" />
          Initiate Offboarding
        </Button>
      </div>
    </div>
  );
}
