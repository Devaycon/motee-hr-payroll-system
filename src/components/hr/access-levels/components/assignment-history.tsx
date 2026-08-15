"use client";

import { useMemo, useState } from "react";
import { History, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { formatDateTime } from "@/src/lib/utils/format-date";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";
import type { RoleAssignmentEvent } from "../types";

interface AssignmentHistoryProps {
  events: RoleAssignmentEvent[];
}

/** Mirrors the columns on screen, so an export reads the same as the table. */
const EXPORT_COLUMNS: ReportColumn<RoleAssignmentEvent>[] = [
  { key: "employeeName", header: "Employee", value: (e) => e.employeeName },
  {
    key: "previousRoleName",
    header: "Previous Role",
    value: (e) => e.previousRoleName || "—",
  },
  { key: "newRoleName", header: "New Role", value: (e) => e.newRoleName },
  { key: "changedBy", header: "Changed By", value: (e) => e.changedBy },
  { key: "changedAt", header: "Date", value: (e) => formatDateTime(e.changedAt) },
  { key: "reason", header: "Reason", value: (e) => e.reason || "—" },
];

/**
 * Role assignment audit trail (client feedback §1.6). Answers "who gave this
 * person Finance access, when, and on whose authority" — the first question
 * asked in any access review.
 */
export function AssignmentHistory({ events }: AssignmentHistoryProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.employeeName.toLowerCase().includes(q) ||
        e.newRoleName.toLowerCase().includes(q) ||
        e.previousRoleName.toLowerCase().includes(q) ||
        e.changedBy.toLowerCase().includes(q) ||
        e.reason.toLowerCase().includes(q),
    );
  }, [events, search]);

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No role changes recorded yet
          </p>
          <p className="text-xs text-muted-foreground">
            Assigning a different access level to an employee logs it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative max-w-sm flex-1 min-w-56">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee, role, or who changed it…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <ExportMenu
          name="role-assignment-history"
          title="Role Assignment History"
          columns={EXPORT_COLUMNS}
          rows={filtered}
          variant="outline"
          buttonClassName="h-8 text-xs"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Employee",
                    "Previous Role",
                    "New Role",
                    "Changed By",
                    "Date",
                    "Reason",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {e.employeeName}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {e.previousRoleName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {e.newRoleName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {e.changedBy}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(e.changedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {e.reason || "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-xs text-muted-foreground"
                    >
                      No role changes match “{search.trim()}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
