"use client";

import { useMemo, useState } from "react";
import {
  StatCards,
  matchesAuditCardFilter,
  AUDIT_CARD_FILTER_LABELS,
  type AuditCardFilter,
} from "./components/stat-cards";
import { AuditToolbar } from "./components/audit-toolbar";
import { AuditLog } from "./components/audit-log";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Button } from "@/src/components/ui/button";
import { computeAuditStats } from "./data";
import { useAuditEntries } from "./hooks";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";
import type { AuditEntry } from "./types";

export function AuditTrailPage() {
  const { data, loading } = useAuditEntries();
  const allEntries = useMemo(() => data ?? [], [data]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  /** Drill-down set by the KPI cards; "all" shows every entry. */
  const [cardFilter, setCardFilter] = useState<AuditCardFilter>("all");

  // "Slower than average" is relative to the whole log, not the current view,
  // so the threshold comes from the unfiltered set.
  const { avgResponseTime } = useMemo(
    () => computeAuditStats(allEntries),
    [allEntries],
  );

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
      // The card drill-down composes with search and the dropdowns.
      const matchCard = matchesAuditCardFilter(e, cardFilter, avgResponseTime);
      return (
        matchSearch && matchAction && matchModule && matchStatus && matchCard
      );
    });
  }, [
    allEntries,
    search,
    actionFilter,
    moduleFilter,
    statusFilter,
    cardFilter,
    avgResponseTime,
  ]);

  /** Columns for the Export menu — mirrors what the log shows on screen. */
  const exportColumns: ReportColumn<AuditEntry>[] = [
    { key: "timestamp", header: "Timestamp", value: (e) => e.timestamp },
    { key: "userName", header: "User", value: (e) => e.userName },
    { key: "userRole", header: "Role", value: (e) => e.userRole },
    { key: "actionType", header: "Action", value: (e) => e.actionType },
    { key: "module", header: "Module", value: (e) => e.module },
    { key: "description", header: "Description", value: (e) => e.description },
    { key: "httpMethod", header: "Method", value: (e) => e.httpMethod },
    { key: "endpoint", header: "Endpoint", value: (e) => e.endpoint },
    { key: "httpStatus", header: "Status", value: (e) => e.httpStatus },
    {
      key: "responseTimeMs",
      header: "Response (ms)",
      value: (e) => e.responseTimeMs,
    },
    { key: "ipAddress", header: "IP address", value: (e) => e.ipAddress },
    {
      key: "isSuspicious",
      header: "Suspicious",
      value: (e) => (e.isSuspicious ? "Yes" : "No"),
    },
  ];

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

      <StatCards
        entries={allEntries}
        cardFilter={cardFilter}
        onFilterChange={setCardFilter}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {AUDIT_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              ({filteredEntries.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All entries
          </Button>
        </div>
      )}

      <AuditToolbar
        search={search}
        onSearchChange={setSearch}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        moduleFilter={moduleFilter}
        onModuleFilterChange={setModuleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        exportMenu={
          <ExportMenu
            name="audit-trail"
            title="Audit Trail"
            columns={exportColumns}
            rows={filteredEntries}
            variant="outline"
            buttonClassName="h-9 text-xs"
          />
        }
        totalFiltered={filteredEntries.length}
        totalAll={allEntries.length}
      />

      <AuditLog entries={filteredEntries} />
    </div>
  );
}
