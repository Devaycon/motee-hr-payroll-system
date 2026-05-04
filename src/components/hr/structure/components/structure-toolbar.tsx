"use client";

import { Search, GitFork, List, SlidersHorizontal } from "lucide-react";
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
import { DEPT_OPTIONS } from "../data";
import type { ViewMode } from "../types";

interface StructureToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
}

export function StructureToolbar({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
}: StructureToolbarProps) {
  const deptLabel = deptFilter === "all" ? "All Departments" : deptFilter;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, title or department..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-sm gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {deptLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">
              Filter by department
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={deptFilter}
              onValueChange={onDeptFilterChange}
            >
              {DEPT_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt}
                  value={opt}
                  className="text-xs"
                >
                  {opt === "all" ? "All Departments" : opt}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <Button
            variant={viewMode === "tree" ? "default" : "ghost"}
            size="sm"
            className="h-9 text-sm gap-1.5 rounded-none border-0"
            onClick={() => onViewModeChange("tree")}
          >
            <GitFork className="w-3.5 h-3.5" />
            Tree
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            className="h-9 text-sm gap-1.5 rounded-none border-0"
            onClick={() => onViewModeChange("table")}
          >
            <List className="w-3.5 h-3.5" />
            Table
          </Button>
        </div>
      </div>
    </div>
  );
}
