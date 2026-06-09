"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatCards } from "./components/stat-cards";
import { AuditToolbar } from "./components/audit-toolbar";
import { AuditLog } from "./components/audit-log";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAuditEntries } from "./hooks";

export function AuditTrailPage() {
  const { data, loading } = useAuditEntries();
  const allEntries = useMemo(() => data ?? [], [data]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return allEntries.filter((e) => {
      const matchSearch =
        !q ||
        e.userName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.endpoint.toLowerCase().includes(q) ||
        e.ipAddress.includes(q);
      const matchAction =
        actionFilter === "all" || e.actionType === actionFilter;
      const matchModule = moduleFilter === "all" || e.module === moduleFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "2xx" && e.httpStatus >= 200 && e.httpStatus < 300) ||
        (statusFilter === "4xx" && e.httpStatus >= 400 && e.httpStatus < 500) ||
        (statusFilter === "5xx" && e.httpStatus >= 500);
      return matchSearch && matchAction && matchModule && matchStatus;
    });
  }, [allEntries, search, actionFilter, moduleFilter, statusFilter]);

  function handleExport() {
    toast.success("Audit log exported", {
      description: `${filteredEntries.length} entries exported as CSV`,
    });
  }

  if (loading && !allEntries.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Complete log of all system activities with user details
          </p>
        </div>
      </div>

      <StatCards entries={allEntries} />

      <AuditToolbar
        search={search}
        onSearchChange={setSearch}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        moduleFilter={moduleFilter}
        onModuleFilterChange={setModuleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onExport={handleExport}
        totalFiltered={filteredEntries.length}
        totalAll={allEntries.length}
      />

      <AuditLog entries={filteredEntries} />
    </div>
  );
}
