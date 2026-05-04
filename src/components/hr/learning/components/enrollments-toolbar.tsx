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
import { ENROLLMENT_STATUS_LABELS, DEPARTMENT_OPTIONS } from "../data";
import type { EnrollmentStatus } from "../types";
import type { Course } from "../types";

interface EnrollmentsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
  courseFilter: string;
  onCourseFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  courses: Course[];
  onEnroll: () => void;
}

export function EnrollmentsToolbar({
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  courseFilter,
  onCourseFilterChange,
  statusFilter,
  onStatusFilterChange,
  courses,
  onEnroll,
}: EnrollmentsToolbarProps) {
  const activeFilters = [
    deptFilter !== "all",
    courseFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by employee or course..."
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
            <DropdownMenuLabel className="text-xs">Course</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={courseFilter}
              onValueChange={onCourseFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Courses
              </DropdownMenuRadioItem>
              {courses.map((c) => (
                <DropdownMenuRadioItem
                  key={c.id}
                  value={c.id}
                  className="text-xs"
                >
                  {c.title}
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
              {(
                Object.keys(ENROLLMENT_STATUS_LABELS) as EnrollmentStatus[]
              ).map((s) => (
                <DropdownMenuRadioItem key={s} value={s} className="text-xs">
                  {ENROLLMENT_STATUS_LABELS[s]}
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
                      onCourseFilterChange("all");
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
        <Button size="lg" onClick={onEnroll}>
          <Plus className="w-3.5 h-3.5" />
          Enroll Employee
        </Button>
      </div>
    </div>
  );
}
