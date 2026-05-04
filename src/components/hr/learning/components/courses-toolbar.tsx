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
  COURSE_CATEGORY_LABELS,
  DELIVERY_MODE_LABELS,
  COURSE_STATUS_LABELS,
} from "../data";
import type {
  CourseCategory,
  CourseDeliveryMode,
  CourseStatus,
} from "../types";

interface CoursesToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  modeFilter: string;
  onModeFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onAddCourse: () => void;
}

export function CoursesToolbar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  modeFilter,
  onModeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onAddCourse,
}: CoursesToolbarProps) {
  const activeFilters = [
    categoryFilter !== "all",
    modeFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by title or provider..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
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
            <DropdownMenuLabel className="text-xs">Category</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={categoryFilter}
              onValueChange={onCategoryFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Categories
              </DropdownMenuRadioItem>
              {(Object.keys(COURSE_CATEGORY_LABELS) as CourseCategory[]).map(
                (c) => (
                  <DropdownMenuRadioItem key={c} value={c} className="text-xs">
                    {COURSE_CATEGORY_LABELS[c]}
                  </DropdownMenuRadioItem>
                ),
              )}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">
              Delivery Mode
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={modeFilter}
              onValueChange={onModeFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Modes
              </DropdownMenuRadioItem>
              {(Object.keys(DELIVERY_MODE_LABELS) as CourseDeliveryMode[]).map(
                (m) => (
                  <DropdownMenuRadioItem key={m} value={m} className="text-xs">
                    {DELIVERY_MODE_LABELS[m]}
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
              {(Object.keys(COURSE_STATUS_LABELS) as CourseStatus[]).map(
                (s) => (
                  <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                    {COURSE_STATUS_LABELS[s]}
                  </DropdownMenuRadioItem>
                ),
              )}
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
                      onCategoryFilterChange("all");
                      onModeFilterChange("all");
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
        <Button size="lg" onClick={onAddCourse}>
          <Plus className="w-3.5 h-3.5" />
          Add Course
        </Button>
      </div>
    </div>
  );
}
