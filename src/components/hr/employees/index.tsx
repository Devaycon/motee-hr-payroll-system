"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import type { EmployeeRow } from "./types";
import { StatCards } from "./components/stat-cards";
import { EmployeesToolbar } from "./components/employees-toolbar";
import { AdvancedEmployeesTable } from "./components/advanced-employees-table";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useEmployees } from "./hooks";
import { PermissionGate } from "@/src/components/shared/permission-gate";
import { useAppSelector } from "@/src/lib/stores/hooks";

export function EmployeesPage() {
  const router = useRouter();
  const { data, loading } = useEmployees();
  // Hires cleared from completed onboarding workflows.
  const cleared = useAppSelector((s) => s.onboardingRecords.cleared);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [prevData, setPrevData] = useState<EmployeeRow[] | null>(null);
  const [prevCleared, setPrevCleared] = useState<EmployeeRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sync local list when locale data resolves or a hire is cleared
  // (no effect — adjust state during render).
  if (data && (data !== prevData || cleared !== prevCleared)) {
    setPrevData(data);
    setPrevCleared(cleared);
    setEmployees(cleared.length ? [...cleared, ...data] : data);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q);
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      const matchType = typeFilter === "all" || e.employmentType === typeFilter;
      return matchSearch && matchDept && matchType;
    });
  }, [employees, search, deptFilter, typeFilter]);

  function handleDelete(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading && !employees.length) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your workforce, track employee details and reporting lines.
          </p>
        </div>
        <PermissionGate module="organization.employees" action="create">
          <Button
            className="mt-1 gap-1.5"
            onClick={() => router.push("/talent/onboarding")}
          >
            <UserPlus className="w-4 h-4" />
            Onboard Employee
          </Button>
        </PermissionGate>
      </div>

      <StatCards employees={employees} />

      <EmployeesToolbar
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <AdvancedEmployeesTable employees={filtered} onDelete={handleDelete} />
    </div>
  );
}
