"use client";

import {
  Download,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  exportCsv,
  exportPng,
  exportXlsx,
  printPdf,
  PNG_MAX_ROWS,
} from "@/src/lib/reports/export";
import type { ReportColumn } from "@/src/lib/reports/types";

interface ExportMenuProps<T> {
  /** Base file name, without extension. */
  name: string;
  /** Heading used on the printed page and the image. */
  title: string;
  columns: ReportColumn<T>[];
  rows: T[];
  /** Menu heading, e.g. "Export 42 employees". Defaults to "Export {n} rows". */
  label?: string;
  buttonClassName?: string;
  variant?: "default" | "outline";
}

/**
 * The Export dropdown shared by table toolbars: CSV, Excel, PNG and print.
 * Reports use the richer ExportModal instead.
 */
export function ExportMenu<T>({
  name,
  title,
  columns,
  rows,
  label,
  buttonClassName,
  variant = "default",
}: ExportMenuProps<T>) {
  function handlePng() {
    exportPng(name, title, columns, rows);
    if (rows.length > PNG_MAX_ROWS) {
      toast.warning(
        `Exported the first ${PNG_MAX_ROWS} of ${rows.length} rows as an image`,
        { description: "Use CSV or Excel to export every row." },
      );
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="lg" className={buttonClassName}>
          <Download className="w-3.5 h-3.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">
          {label ?? `Export ${rows.length} row${rows.length === 1 ? "" : "s"}`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-xs gap-2"
          onClick={() => exportCsv(name, columns, rows)}
        >
          <FileText className="w-3.5 h-3.5" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs gap-2"
          onClick={() => exportXlsx(name, columns, rows)}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs gap-2" onClick={handlePng}>
          <ImageIcon className="w-3.5 h-3.5" /> Image (PNG)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs gap-2"
          onClick={() => printPdf(title, columns, rows)}
        >
          <Printer className="w-3.5 h-3.5" /> Print / PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
