import { Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ANNOUNCEMENT_TYPE_LABELS } from "./data";
import type { AnnouncementType } from "./data";

interface SearchFilterProps {
  search: string;
  typeFilter: AnnouncementType | "all";
  onSearchChange: (v: string) => void;
  onTypeFilterChange: (v: AnnouncementType | "all") => void;
}

export function SearchFilter({
  search,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
}: SearchFilterProps) {
  return (
    <div className="flex gap-3 flex-col sm:flex-row">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search announcements..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        value={typeFilter}
        onValueChange={(v) => onTypeFilterChange(v as AnnouncementType | "all")}
      >
        <SelectTrigger size="lg">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {(
            Object.entries(ANNOUNCEMENT_TYPE_LABELS) as [
              AnnouncementType,
              string,
            ][]
          ).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
