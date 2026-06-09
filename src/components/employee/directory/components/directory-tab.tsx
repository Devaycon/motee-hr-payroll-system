"use client";

import { Search } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { EmployeeCard } from "./employee-card";
import { useDepartmentOptions } from "@/src/components/hr/employees/hooks";
import type { EmployeeRow } from "./data";

interface DirectoryTabProps {
  filtered: EmployeeRow[];
  search: string;
  deptFilter: string;
  setSearch: (v: string) => void;
  setDeptFilter: (v: string) => void;
  onSelect: (emp: EmployeeRow) => void;
}

export function DirectoryTab({
  filtered,
  search,
  deptFilter,
  setSearch,
  setDeptFilter,
  onSelect,
}: DirectoryTabProps) {
  const { data: deptOptions } = useDepartmentOptions();
  const depts = (deptOptions ?? ["all"]).filter((d) => d !== "all");

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, title, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {depts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No employees match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((emp) => (
            <EmployeeCard key={emp.id} emp={emp} onClick={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
