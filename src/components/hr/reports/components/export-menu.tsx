"use client";

import { Download, FileSpreadsheet, FileText, FileJson, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  exportCsv,
  exportXlsx,
  exportJson,
  printPdf,
} from "@/src/lib/reports/export";
import type { ReportColumn, ReportStat } from "@/src/lib/reports/types";

export function ExportMenu({
  baseName,
  title,
  columns,
  rows,
  stats,
}: {
  baseName: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ReportColumn<any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  stats: ReportStat[];
}) {
  const name = `${baseName}-${new Date().toISOString().slice(0, 10)}`;

  function run(fn: () => void, label: string) {
    if (rows.length === 0) {
      toast.error("Nothing to export — no rows match the filters.");
      return;
    }
    fn();
    toast.success(`Exported ${rows.length} rows as ${label}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-1.5">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          className="gap-2"
          onClick={() => run(() => exportCsv(name, columns, rows), "CSV")}
        >
          <FileText className="w-3.5 h-3.5" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => run(() => exportXlsx(name, columns, rows), "Excel")}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => run(() => exportJson(name, columns, rows), "JSON")}
        >
          <FileJson className="w-3.5 h-3.5" /> JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onClick={() => run(() => printPdf(title, columns, rows, stats), "PDF")}
        >
          <Printer className="w-3.5 h-3.5" /> PDF (print)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
