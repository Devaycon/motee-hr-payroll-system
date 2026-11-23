"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/components/ui/dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/src/components/shared/data-table";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import type { ReportColumn, ReportRowAction } from "@/src/lib/reports/types";

type Row = Record<string, unknown>;

export function ReportTable({
  columns,
  rows,
  rowActions,
}: {
  columns: ReportColumn<Row>[];
  rows: Row[];
  /** ⋯ menu per row — drill-downs such as the employee's profile. */
  rowActions?: (row: Row) => ReportRowAction[];
}) {
  const tableColumns = useMemo<ColumnDef<Row>[]>(
    () =>
      columns.map((c): ColumnDef<Row> => ({
        id: c.key,
        header: c.header,
        // The report def already knows how to read this column — hand it to
        // the exporter rather than letting it guess from the rendered cell.
        meta: { exportValue: c.value },
        cell: ({ row }) => {
          const raw = c.value(row.original);
          const text = c.money ? formatMoneyLocale(Number(raw)) : String(raw);
          const href = c.href?.(row.original);
          return href ? (
            <Link href={href} className="whitespace-nowrap font-medium text-foreground hover:text-primary hover:underline">
              {text}
            </Link>
          ) : (
            <span className="text-foreground whitespace-nowrap">{text}</span>
          );
        },
      })).concat(
        rowActions
          ? [
              {
                id: "__actions",
                header: "",
                enableSorting: false,
                cell: ({ row }) => {
                  const items = rowActions(row.original);
                  if (!items.length) return null;
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Row actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {items.map((a) => (
                          <DropdownMenuItem key={a.label} asChild className="text-xs">
                            <Link href={a.href}>{a.label}</Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                },
              } as ColumnDef<Row>,
            ]
          : [],
      ),
    [columns, rowActions],
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
