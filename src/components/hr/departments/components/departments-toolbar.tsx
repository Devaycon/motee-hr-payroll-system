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

interface DepartmentsToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onAdd: () => void;
}

export function DepartmentsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAdd,
}: DepartmentsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search departments..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-sm gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {statusFilter === "all"
                ? "All Statuses"
                : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">
              Filter by status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={onStatusFilterChange}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="active" className="text-xs">
                Active
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="inactive" className="text-xs">
                Inactive
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" className="h-9 text-sm gap-1.5" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Department
        </Button>
      </div>
    </div>
  );
}
