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
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_VALUES,
} from "@/src/lib/constants/employment-types";
import { useBranchOptions } from "@/src/lib/branches/use-branch";
import { useDepartmentOptions } from "@/src/components/hr/employees/hooks";
import {
  ALL,
  LENS_LIFECYCLES,
  type LensFilters,
  type LensLifecycle,
} from "@/src/lib/workforce-lens/group";

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-36 flex-1 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

export function LensFilterBar({
  filters,
  onChange,
}: {
  filters: LensFilters;
  onChange: (next: LensFilters) => void;
}) {
  const { data: deptOptions } = useDepartmentOptions();
  const branches = useBranchOptions();
  const set = <K extends keyof LensFilters>(key: K, value: LensFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
      <FilterSelect
        label="Lifecycle"
        value={filters.lifecycle}
        onChange={(v) => set("lifecycle", v as LensLifecycle)}
      >
        {LENS_LIFECYCLES.map((l) => (
          <SelectItem key={l.value} value={l.value} className="text-xs">
            {l.label}
          </SelectItem>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Employment"
        value={filters.employmentType}
        onChange={(v) => set("employmentType", v)}
      >
        <SelectItem value={ALL} className="text-xs">
          Any
        </SelectItem>
        {EMPLOYMENT_TYPE_VALUES.map((t) => (
          <SelectItem key={t} value={t} className="text-xs">
            {EMPLOYMENT_TYPE_LABELS[t]}
          </SelectItem>
        ))}
      </FilterSelect>

      {/* A single-site tenant has nothing to choose between. */}
      {branches.length > 1 && (
        <FilterSelect
          label="Location"
          value={filters.branch}
          onChange={(v) => set("branch", v)}
        >
          <SelectItem value={ALL} className="text-xs">
            All locations
          </SelectItem>
          {branches.map((b) => (
            <SelectItem key={b.id} value={b.id} className="text-xs">
              {b.name}
            </SelectItem>
          ))}
        </FilterSelect>
      )}

      <FilterSelect
        label="Team"
        value={filters.department}
        onChange={(v) => set("department", v)}
      >
        {(deptOptions ?? [ALL]).map((d) => (
          <SelectItem key={d} value={d} className="text-xs">
            {d === ALL ? "All teams" : d}
          </SelectItem>
        ))}
      </FilterSelect>

      <div className="relative min-w-48 flex-1">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
          placeholder="Search name, title or team…"
          aria-label="Search people"
          className="h-8 pl-8 text-xs"
        />
      </div>
    </div>
  );
}
