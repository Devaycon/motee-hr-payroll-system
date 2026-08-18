"use client";

import { Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  ACTION_TYPE_OPTIONS,
  MODULE_OPTIONS,
  HTTP_STATUS_OPTIONS,
} from "../data";

interface AuditToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  actionFilter: string;
  onActionFilterChange: (v: string) => void;
  moduleFilter: string;
  onModuleFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  /** The Export menu, supplied by the page so it can own the columns. */
  exportMenu: React.ReactNode;
  totalFiltered: number;
  totalAll: number;
}

export function AuditToolbar({
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  moduleFilter,
  onModuleFilterChange,
  statusFilter,
  onStatusFilterChange,
  exportMenu,
  totalFiltered,
  totalAll,
}: AuditToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3  justify-between sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-65 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user, description, endpoint..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="shrink-0">{exportMenu}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={actionFilter} onValueChange={onActionFilterChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={onModuleFilterChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="HTTP Status" />
          </SelectTrigger>
          <SelectContent>
            {HTTP_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {totalFiltered} of {totalAll} entries
        </span>
      </div>
    </div>
  );
}
