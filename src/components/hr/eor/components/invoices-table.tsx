"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { CheckCircle2, Plus } from "lucide-react";
import { RowActions } from "@/src/components/hr/employees/employee-detail/row-actions";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import type { EorInvoice } from "../types";
import {
  EOR_INVOICE_STATUS_LABELS,
  EOR_INVOICE_STATUS_STYLES,
  formatUsd,
} from "../data";

interface InvoicesTableProps {
  invoices: EorInvoice[];
  /** Signed in: add, edit, delete and mark invoices paid. */
  onNew?: () => void;
  onEdit?: (invoice: EorInvoice) => void;
  onDelete?: (invoice: EorInvoice) => void;
  onSettle?: (invoice: EorInvoice) => void;
}

export function InvoicesTable({ invoices, onNew, onEdit, onDelete, onSettle }: InvoicesTableProps) {
  const columns = useMemo<ColumnDef<EorInvoice>[]>(
    () => [
      {
        accessorKey: "providerName",
        header: sortableHeader("Provider"),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.providerName}</span>
        ),
      },
      {
        accessorKey: "period",
        header: sortableHeader("Period"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.period}</span>
        ),
      },
      {
        accessorKey: "workerCount",
        header: "Workers",
        cell: ({ row }) => <span className="text-sm">{row.original.workerCount}</span>,
      },
      {
        accessorKey: "grossPay",
        header: "Gross pay",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatUsd(row.original.grossPay)}
          </span>
        ),
      },
      {
        accessorKey: "managementFee",
        header: "Mgmt fee",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatUsd(row.original.managementFee)}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: sortableHeader("Total (USD)"),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{formatUsd(row.original.total)}</span>
        ),
      },
      {
        accessorKey: "dueAt",
        header: sortableHeader("Due"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.dueAt)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-xs", EOR_INVOICE_STATUS_STYLES[row.original.status])}
          >
            {EOR_INVOICE_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      ...(onEdit || onDelete || onSettle
        ? [
            {
              id: "actions",
              header: "",
              enableSorting: false,
              cell: ({ row }: { row: { original: EorInvoice } }) => (
                <div className="text-right">
                  <RowActions
                    label={`Actions for ${row.original.providerName} ${row.original.period}`}
                    onEdit={onEdit ? () => onEdit(row.original) : undefined}
                    onDelete={onDelete ? () => onDelete(row.original) : undefined}
                    extra={
                      onSettle && row.original.status !== "paid"
                        ? [{ label: "Mark as paid", icon: CheckCircle2, onSelect: () => onSettle(row.original) }]
                        : []
                    }
                  />
                </div>
              ),
            } as ColumnDef<EorInvoice>,
          ]
        : []),
    ],
    [onEdit, onDelete, onSettle],
  );

  return (
    <div className="flex flex-col gap-3">
      {onNew && (
        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5" onClick={onNew}>
            <Plus className="size-3.5" /> New Invoice
          </Button>
        </div>
      )}
      <DataTable
        exportTitle="EOR Invoices"
        columns={columns}
        data={invoices}
        getRowId={(i) => i.id}
        searchPlaceholder="Search invoices by provider or period..."
        emptyMessage="No invoices."
      />
    </div>
  );
}
