"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Printer,
  ImageIcon,
  RotateCcw,
  SlidersHorizontal,
  Columns3,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  exportCsv,
  exportXlsx,
  exportJson,
  exportPng,
  printPdf,
  PNG_MAX_ROWS,
} from "@/src/lib/reports/export";
import type {
  ReportColumn,
  ReportExportParam,
  ReportStat,
} from "@/src/lib/reports/types";
import { cn } from "@/src/lib/utils";

type Format = "csv" | "xlsx" | "json" | "png" | "pdf";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumn = ReportColumn<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const FORMATS: { value: Format; label: string; icon: typeof FileText }[] = [
  { value: "csv", label: "CSV", icon: FileText },
  { value: "xlsx", label: "Excel", icon: FileSpreadsheet },
  { value: "json", label: "JSON", icon: FileJson },
  { value: "png", label: "Image", icon: ImageIcon },
  { value: "pdf", label: "PDF", icon: Printer },
];

/** Orange brand active state, shared across the reports module tabs. */
const TAB_ACTIVE =
  "data-[state=active]:bg-[#ff8b2d]! data-[state=active]:text-white! data-[state=active]:shadow-none!";

export function ExportModal({
  baseName,
  title,
  columns,
  rows,
  allRows,
  params = [],
  stats,
}: {
  baseName: string;
  title: string;
  columns: AnyColumn[];
  /** Rows after the page's on-screen search/filters. */
  rows: Row[];
  /** The full, unfiltered dataset for the report. */
  allRows: Row[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: ReportExportParam<any>[];
  stats: ReportStat[];
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("csv");
  const [scope, setScope] = useState<"filtered" | "all">("filtered");
  const [fileName, setFileName] = useState("");
  const [include, setInclude] = useState<Record<string, boolean>>({});
  const [enabledParams, setEnabledParams] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<string>("none");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState<string>("");

  const defaultName = `${baseName}-${new Date().toISOString().slice(0, 10)}`;

  const colByKey = useMemo(
    () => Object.fromEntries(columns.map((c) => [c.key, c])),
    [columns],
  );

  function resetParams() {
    setFormat("csv");
    setScope("filtered");
    setFileName(defaultName);
    setInclude(Object.fromEntries(columns.map((c) => [c.key, true])));
    setEnabledParams({});
    setSortKey("none");
    setSortDir("asc");
    setLimit("");
  }

  function handleOpenChange(next: boolean) {
    if (next) resetParams();
    setOpen(next);
  }

  // ── apply every parameter to produce the rows that will be exported ─────────
  const resultRows = useMemo(() => {
    let working = scope === "all" ? allRows : rows;

    for (const p of params) {
      if (enabledParams[p.key]) working = working.filter((r) => p.predicate(r));
    }

    if (sortKey !== "none" && colByKey[sortKey]) {
      const col = colByKey[sortKey];
      const dir = sortDir === "asc" ? 1 : -1;
      working = [...working].sort((a, b) => {
        const av = col.value(a);
        const bv = col.value(b);
        if (typeof av === "number" && typeof bv === "number")
          return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }

    const n = Number(limit);
    if (limit && !Number.isNaN(n) && n > 0) working = working.slice(0, n);

    return working;
  }, [scope, allRows, rows, params, enabledParams, colByKey, sortKey, sortDir, limit]);

  const selectedColumns = useMemo(
    () => columns.filter((c) => include[c.key]),
    [columns, include],
  );
  const allChecked = selectedColumns.length === columns.length;

  /** Images are capped — a canvas that tall stops being readable (and encodable). */
  const pngTruncated = format === "png" && resultRows.length > PNG_MAX_ROWS;

  const activeFilterCount = useMemo(
    () => params.filter((p) => enabledParams[p.key]).length,
    [params, enabledParams],
  );

  function toggleInclude(key: string) {
    setInclude((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function toggleAll() {
    const next = !allChecked;
    setInclude(Object.fromEntries(columns.map((c) => [c.key, next])));
  }

  function handleExport() {
    if (resultRows.length === 0) {
      toast.error("Nothing to export — no rows match the selected parameters.");
      return;
    }
    if (selectedColumns.length === 0) {
      toast.error("Select at least one column to export.");
      return;
    }
    const name = fileName.trim() || defaultName;
    switch (format) {
      case "csv":
        exportCsv(name, selectedColumns, resultRows);
        break;
      case "xlsx":
        exportXlsx(name, selectedColumns, resultRows);
        break;
      case "json":
        exportJson(name, selectedColumns, resultRows);
        break;
      case "png":
        exportPng(name, title, selectedColumns, resultRows, stats);
        break;
      case "pdf":
        printPdf(title, selectedColumns, resultRows, stats);
        break;
    }
    const label = FORMATS.find((f) => f.value === format)?.label ?? format;
    if (pngTruncated) {
      toast.warning(
        `Exported the first ${PNG_MAX_ROWS} of ${resultRows.length} rows as an image`,
        { description: "Use CSV or Excel to export every row." },
      );
    } else {
      toast.success(`Exported ${resultRows.length} rows as ${label}`);
    }
    setOpen(false);
  }

  const hasQuickFilters = params.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl flex flex-col gap-0 p-0 max-h-[88vh]">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>Export {title}</DialogTitle>
          <DialogDescription>
            Pick a format and export. Use Columns and Filters to refine what
            goes in the file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
          <div className="px-6 shrink-0">
            <TabsList className="w-full">
              <TabsTrigger value="general" className={cn("flex-1", TAB_ACTIVE)}>
                <Settings2 className="mr-1.5" />
                General
              </TabsTrigger>
              <TabsTrigger value="columns" className={cn("flex-1", TAB_ACTIVE)}>
                <Columns3 className="mr-1.5" />
                Columns
                <span className="ml-1 text-xs opacity-70">
                  ({selectedColumns.length}/{columns.length})
                </span>
              </TabsTrigger>
              {hasQuickFilters && (
                <TabsTrigger value="filters" className={cn("flex-1", TAB_ACTIVE)}>
                  <SlidersHorizontal className="mr-1.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4">
            {/* ── General options ───────────────────────────────────────── */}
            <TabsContent value="general" className="mt-0 space-y-6 pb-4">
              <section className="space-y-2">
                <Label>Format</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {FORMATS.map((f) => {
                    const Icon = f.icon;
                    const active = format === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFormat(f.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                {pngTruncated && (
                  <p className="text-xs text-muted-foreground">
                    Images are capped at {PNG_MAX_ROWS} rows — only the first{" "}
                    {PNG_MAX_ROWS} of {resultRows.length} will be drawn. Use CSV or
                    Excel for the full dataset.
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <Label>Records to export</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope("filtered")}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      scope === "filtered"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <span className="font-medium text-foreground">
                      Current view
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {rows.length} rows (on-screen filters)
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope("all")}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      scope === "all"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <span className="font-medium text-foreground">
                      All records
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {allRows.length} rows (ignore filters)
                    </p>
                  </button>
                </div>
              </section>

              <section className="space-y-1.5">
                <Label htmlFor="export-filename">File name</Label>
                <Input
                  id="export-filename"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder={defaultName}
                />
              </section>

              <section className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Sort by</Label>
                  <Select value={sortKey} onValueChange={setSortKey}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No sorting</SelectItem>
                      {columns.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Direction</Label>
                  <Select
                    value={sortDir}
                    onValueChange={(v) => setSortDir(v as "asc" | "desc")}
                  >
                    <SelectTrigger className="h-9 w-full" disabled={sortKey === "none"}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="export-limit">Max rows</Label>
                  <Input
                    id="export-limit"
                    type="number"
                    min={1}
                    placeholder="All"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="h-9"
                  />
                </div>
              </section>
            </TabsContent>

            {/* ── Column selection ──────────────────────────────────────── */}
            <TabsContent value="columns" className="mt-0 space-y-3 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Choose which columns appear in the file.
                </p>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {allChecked ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 text-sm text-foreground cursor-pointer"
                  >
                    <Checkbox
                      checked={!!include[c.key]}
                      onCheckedChange={() => toggleInclude(c.key)}
                    />
                    <span className="truncate">{c.header}</span>
                  </label>
                ))}
              </div>
            </TabsContent>

            {/* ── Quick filters ─────────────────────────────────────────── */}
            {hasQuickFilters && (
              <TabsContent value="filters" className="mt-0 space-y-3 pb-4">
                <p className="text-sm text-muted-foreground">
                  Toggle a filter to narrow the records you export.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {params.map((p) => (
                    <label
                      key={p.key}
                      className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-sm cursor-pointer hover:border-primary/40"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={!!enabledParams[p.key]}
                        onCheckedChange={() =>
                          setEnabledParams((prev) => ({
                            ...prev,
                            [p.key]: !prev[p.key],
                          }))
                        }
                      />
                      <span>
                        <span className="font-medium text-foreground">
                          {p.label}
                        </span>
                        {p.description && (
                          <span className="block text-xs text-muted-foreground">
                            {p.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>

        <DialogFooter className="flex-row items-center justify-between gap-3 px-6 py-4 border-t shrink-0 sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={resetParams}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <span className="text-xs text-muted-foreground">
              {resultRows.length} row{resultRows.length === 1 ? "" : "s"} ·{" "}
              {selectedColumns.length} column
              {selectedColumns.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="gap-1.5" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
