"use client";

import { useState } from "react";
import {
  Search,
  MapPin,
  Mail,
  BriefcaseBusiness,
  SlidersHorizontal,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ChatPanel } from "@/src/components/shared/chat-panel";
import { DEPARTMENT_CONFIG, DIRECTORY_DEPARTMENT_OPTIONS } from "../data";
import type { DirectoryEmployee } from "../types";

interface DirectoryProps {
  employees: DirectoryEmployee[];
}

export function Directory({ employees }: DirectoryProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [chatTarget, setChatTarget] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.jobTitle.toLowerCase().includes(q) ||
      e.skills.some((s) => s.toLowerCase().includes(q)) ||
      e.location.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    const matchType = typeFilter === "all" || e.employmentType === typeFilter;
    return matchSearch && matchDept && matchType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const onLeave = employees.filter((e) => e.isOnLeave).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, title, skill, or location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={deptFilter}
            onValueChange={handleFilterChange(setDeptFilter)}
          >
            <SelectTrigger className="w-44">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DIRECTORY_DEPARTMENT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={handleFilterChange(setTypeFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          {filtered.length} of {employees.length} employees
        </span>
        {onLeave > 0 && (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            {onLeave} on leave
          </span>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            No employees found
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Try a different search or filter
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginated.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onMessage={(name) => setChatTarget(name)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === safePage ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ChatPanel
        key={chatTarget ?? "closed"}
        isOpen={!!chatTarget}
        onClose={() => setChatTarget(null)}
        openToName={chatTarget ?? undefined}
      />
    </div>
  );
}

interface EmployeeCardProps {
  employee: DirectoryEmployee;
  onMessage: (name: string) => void;
}

function EmployeeCard({ employee, onMessage }: EmployeeCardProps) {
  const deptLabel =
    DEPARTMENT_CONFIG[employee.department]?.label ?? employee.department;

  return (
    <div
      className={`rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md ${
        employee.isOnLeave
          ? "border-amber-200 dark:border-amber-800/60"
          : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          {employee.initials}
          {employee.isOnLeave && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-amber-400 text-[8px] font-bold text-white">
              OOO
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {employee.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {employee.jobTitle}
          </p>
          {employee.isOnLeave && (
            <span className="mt-0.5 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-px text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
              On Leave
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{deptLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{employee.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{employee.email}</span>
        </div>
      </div>

      {employee.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {employee.skills.slice(0, 3).map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="px-1.5 py-px text-[10px]"
            >
              {skill}
            </Badge>
          ))}
          {employee.skills.length > 3 && (
            <Badge variant="secondary" className="px-1.5 py-px text-[10px]">
              +{employee.skills.length - 3}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-3 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
        {employee.employmentType} · Since {employee.startDate}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full h-8 text-xs"
        onClick={() => onMessage(employee.name)}
      >
        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
        Message
      </Button>
    </div>
  );
}
