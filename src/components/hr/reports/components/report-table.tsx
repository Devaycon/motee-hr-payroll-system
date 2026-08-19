"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/src/components/shared/data-table";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import type { ReportColumn } from "@/src/lib/reports/types";

type Row = Record<string, unknown>;

export function ReportTable({
  columns,
  rows,
}: {
  columns: ReportColumn<Row>[];
  rows: Row[];
}) {
  const tableColumns = useMemo<ColumnDef<Row>[]>(
    () =>
      columns.map((c) => ({
        id: c.key,
        header: c.header,
        // The report def already knows how to read this column — hand it to
        // the exporter rather than letting it guess from the rendered cell.
        meta: { exportValue: c.value },
        cell: ({ row }) => {
          const raw = c.value(row.original);
          return (
            <span className="text-foreground whitespace-nowrap">
              {c.money ? formatMoneyLocale(Number(raw)) : String(raw)}
            </span>
          );
        },
      })),
    [columns],
  );

  return (
    <DataTable
      columns={tableColumns}
      data={rows}
      getRowId={(_row, index) => String(index)}
      pageSize={12}
      emptyMessage="No records match the current filters."
      // The report page has its own Export dialog with the filters and
      // per-report options — a second button here would compete with it.
      enableExport={false}
    />
  );
}
