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
import { BRANCH_KIND_OPTIONS, BRANCH_STATUS_OPTIONS } from "../data";

interface BranchesToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  kindFilter: string;
  onKindFilterChange: (v: string) => void;
  onAdd: () => void;
}

export function BranchesToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  kindFilter,
  onKindFilterChange,
  onAdd,
}: BranchesToolbarProps) {
  const activeFilters = [statusFilter !== "all", kindFilter !== "all"].filter(
    Boolean,
  ).length;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="relative flex-1 max-w-sm min-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by name, code or city..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-sm gap-1.5"
              data-active={activeFilters > 0}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilters > 0 && (
                <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold">
                  {activeFilters}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={onStatusFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Statuses
              </DropdownMenuRadioItem>
              {BRANCH_STATUS_OPTIONS.map(([value, label]) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  className="text-xs"
                >
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={kindFilter}
              onValueChange={onKindFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All Types
              </DropdownMenuRadioItem>
              {BRANCH_KIND_OPTIONS.map(([value, label]) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  className="text-xs"
                >
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button size="sm" className="h-9 text-sm gap-1.5" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Branch
        </Button>
      </div>
    </div>
  );
}
