"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import type { EorWorker, EorComplianceKey, EorComplianceStatus } from "../types";
import { EOR_COMPLIANCE_LABELS, EOR_COMPLIANCE_STYLES } from "../data";

const COMPLIANCE_COLUMNS: { key: EorComplianceKey; label: string }[] = [
  { key: "contract", label: "Contract" },
  { key: "work_permit", label: "Work permit" },
  { key: "tax_registration", label: "Tax reg." },
  { key: "statutory_benefits", label: "Benefits" },
  { key: "local_id", label: "Local ID" },
];

function statusFor(worker: EorWorker, key: EorComplianceKey): EorComplianceStatus {
  return worker.compliance.find((c) => c.key === key)?.status ?? "pending";
}

function ComplianceBadge({ status }: { status: EorComplianceStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px]", EOR_COMPLIANCE_STYLES[status])}
    >
      {EOR_COMPLIANCE_LABELS[status]}
    </Badge>
  );
}

interface ComplianceTableProps {
  workers: EorWorker[];
  onView: (worker: EorWorker) => void;
}

export function ComplianceTable({ workers, onView }: ComplianceTableProps) {
  const columns = useMemo<ColumnDef<EorWorker>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Worker"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              name={row.original.name}
              initials={row.original.initials}
              gender={row.original.gender}
              size="sm"
              fallbackClassName="bg-primary/10 text-primary font-semibold"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.original.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {row.original.country}
              </p>
            </div>
          </div>
        ),
      },
      ...COMPLIANCE_COLUMNS.map<ColumnDef<EorWorker>>((col) => ({
        id: col.key,
        header: col.label,
        cell: ({ row }) => <ComplianceBadge status={statusFor(row.original, col.key)} />,
      })),
    ],
    [],
  );

  return (
    <DataTable
      exportTitle="EOR Compliance"
      columns={columns}
      data={workers}
      getRowId={(w) => w.id}
      searchPlaceholder="Search workers..."
      onRowClick={(w) => onView(w)}
      emptyMessage="No compliance records."
    />
  );
}
