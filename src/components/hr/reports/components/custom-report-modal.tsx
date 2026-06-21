"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { ALL_REPORTS, getReport } from "@/src/lib/reports/registry";
import { exportCsv, exportXlsx } from "@/src/lib/reports/export";
import type { ReportColumn } from "@/src/lib/reports/types";

interface CustomReportModalProps {
  open: boolean;
  onClose: () => void;
  /** Report ids the current user is allowed to use as a base dataset. */
  allowedReportIds: string[];
}

export function CustomReportModal({
  open,
  onClose,
  allowedReportIds,
}: CustomReportModalProps) {
  const { data: bundle } = useLocaleSection<LocaleBundle>((b) => b);

  const bases = ALL_REPORTS.filter((r) => allowedReportIds.includes(r.id));
  const [baseId, setBaseId] = useState<string>(bases[0]?.id ?? "");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [reportName, setReportName] = useState("");

  const def = getReport(baseId);

  // When the base dataset changes, default to selecting all of its columns.
  const [prevBase, setPrevBase] = useState<string>("");
  if (baseId !== prevBase) {
    setPrevBase(baseId);
    setSelectedKeys(new Set(def?.columns.map((c) => c.key) ?? []));
    if (def) setReportName(`${def.label} (custom)`);
  }

  const rows = useMemo(
    () => (bundle && def ? def.select(bundle) : []),
    [bundle, def],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !def?.searchText) return rows;
    return rows.filter((r) => def.searchText!(r).toLowerCase().includes(q));
  }, [rows, def, search]);

  const selectedColumns: ReportColumn<unknown>[] = useMemo(
    () => (def?.columns ?? []).filter((c) => selectedKeys.has(c.key)),
    [def, selectedKeys],
  );

  function toggleKey(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const fileName = (reportName || "custom-report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const canExport = selectedColumns.length > 0 && filteredRows.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            Build a Custom Report
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Pick a dataset, choose the columns you need, and export.
          </p>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 pb-2">
          <div className="space-y-1.5">
            <Label>Report Name</Label>
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g. Engineering headcount"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Base Dataset</Label>
            <Select value={baseId} onValueChange={setBaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a dataset" />
              </SelectTrigger>
              <SelectContent>
                {bases.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Search (optional)</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter rows by text..."
              disabled={!def?.searchText}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Columns</Label>
              <span className="text-xs text-muted-foreground">
                {selectedColumns.length} selected · {filteredRows.length} rows
              </span>
            </div>
            <ScrollArea className="max-h-48 rounded-lg border border-border/60">
              <div className="grid grid-cols-2 gap-1 p-2">
                {(def?.columns ?? []).map((c) => (
                  <label
                    key={c.key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedKeys.has(c.key)}
                      onCheckedChange={() => toggleKey(c.key)}
                    />
                    <span className="truncate">{c.header}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canExport}
            onClick={() => exportCsv(fileName, selectedColumns, filteredRows)}
          >
            <FileText className="mr-2 size-4" />
            CSV
          </Button>
          <Button
            size="sm"
            disabled={!canExport}
            onClick={() => exportXlsx(fileName, selectedColumns, filteredRows)}
          >
            <FileSpreadsheet className="mr-2 size-4" />
            Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
