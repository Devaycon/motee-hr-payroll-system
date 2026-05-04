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
import {
  DEPARTMENT_OPTIONS,
  ONBOARDING_STAGE_LABELS,
  ONBOARDING_STATUS_LABELS,
} from "../data";
import type { OnboardingStage, OnboardingStatus } from "../types";

interface PipelineToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
  stageFilter: string;
  onStageFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onOpenMethodSelector: () => void;
}

export function PipelineToolbar({
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  stageFilter,
  onStageFilterChange,
  statusFilter,
  onStatusFilterChange,
  onOpenMethodSelector,
}: PipelineToolbarProps) {
  const activeFilters = [
    deptFilter !== "all",
    stageFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

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
            <Button variant="outline" size={"lg"}>
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
            <DropdownMenuLabel className="text-xs">Stage</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={stageFilter}
              onValueChange={onStageFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Stages
              </DropdownMenuRadioItem>
              {(Object.keys(ONBOARDING_STAGE_LABELS) as OnboardingStage[]).map(
                (s) => (
                  <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                    {ONBOARDING_STAGE_LABELS[s]}
                  </DropdownMenuRadioItem>
                ),
              )}
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
              {(
                Object.keys(ONBOARDING_STATUS_LABELS) as OnboardingStatus[]
              ).map((s) => (
                <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                  {ONBOARDING_STATUS_LABELS[s]}
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
                      onStageFilterChange("all");
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
        <Button
          size={"lg"}
          onClick={onOpenMethodSelector}
        >
          <Plus className="w-3.5 h-3.5" />
          Initiate Onboarding
        </Button>
      </div>
    </div>
  );
}
