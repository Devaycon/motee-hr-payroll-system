"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  History,
  Upload,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export interface PreviewColumn<T> {
  label: string;
  /** Cell value for a parsed row. */
  get: (row: T) => string;
  /** When true, an empty value flags the row as invalid in the preview. */
  required?: boolean;
}

interface BulkCsvUploadModalProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  templateFileName: string;
  headers: string[];
  sampleRows: string[][];
  /** Map a raw header→value record into the typed row. */
  parseRow: (obj: Record<string, string>) => T;
  isRowValid: (row: T) => boolean;
  /**
   * Per-row problems for the validation report. Return an empty array when the
   * row is fine. Falls back to `isRowValid` when omitted.
   */
  validateRow?: (row: T) => string[];
  columns: PreviewColumn<T>[];
  onImport: (rows: T[]) => void;
  /** Singular noun used in the import button, e.g. "leave request". */
  entityNoun: string;
}

/** One completed import, kept for the session so users can see what they ran. */
interface UploadHistoryEntry {
  id: string;
  fileName: string;
  at: string;
  imported: number;
  skipped: number;
}

export function BulkCsvUploadModal<T>({
  open,
  onClose,
  title,
  description,
  templateFileName,
  headers,
  sampleRows,
  parseRow,
  isRowValid,
  validateRow,
  columns,
  onImport,
  entityNoun,
}: BulkCsvUploadModalProps<T>) {
  const [phase, setPhase] = useState<"upload" | "preview">("upload");
  const [rows, setRows] = useState<T[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [history, setHistory] = useState<UploadHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter(isRowValid);
  const invalidCount = rows.length - validRows.length;

  /** Row-level problems, used for the validation report and error summary. */
  const rowIssues = useMemo(
    () =>
      rows.map((row) =>
        validateRow
          ? validateRow(row)
          : isRowValid(row)
            ? []
            : ["Required fields are missing"],
      ),
    [rows, validateRow, isRowValid],
  );

  /** Distinct problems with counts, so users see the pattern not 200 rows. */
  const errorSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const issues of rowIssues) {
      for (const issue of issues) counts.set(issue, (counts.get(issue) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rowIssues]);

  // Unparsed by papaparse so sample values containing commas are quoted.
  const csvTemplate = Papa.unparse({ fields: headers, data: sampleRows });

  function downloadTemplate() {
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Parsed with papaparse rather than splitting on commas — the naive split
   * corrupted any quoted field containing a comma (e.g. a reason like
   * "Wedding, then honeymoon").
   */
  function parseCSV(text: string): T[] {
    const result = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
    });
    return result.data.map((obj) => parseRow(obj));
  }

  function handleFileLoad(file: File) {
    setFileName(file.name);
    setParseError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setParseError(
          "No valid rows found. Make sure the file follows the template format.",
        );
        return;
      }
      setRows(parsed);
      setPhase("preview");
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileLoad(file);
  }

  function handleReset() {
    setPhase("upload");
    setRows([]);
    setFileName("");
    setParseError("");
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 shrink-0">
              <Upload className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {phase === "upload"
                  ? title
                  : `Preview — ${rows.length} row${rows.length !== 1 ? "s" : ""} parsed`}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {phase === "upload"
                  ? description
                  : `${validRows.length} valid • ${invalidCount} with missing fields`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {phase === "upload" ? (
          <>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {templateFileName}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Columns: {headers.join(", ")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 shrink-0"
                  onClick={downloadTemplate}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>

              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40 hover:bg-muted/20",
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {fileName || "Drop your CSV file here or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Accepts .csv files only
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileLoad(f);
                  }}
                />
              </div>

              {parseError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs">{parseError}</p>
                </div>
              )}

              {/* Upload history for this session (§F10). */}
              {history.length > 0 && (
                <div className="rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
                  >
                    <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <History className="w-3.5 h-3.5 text-muted-foreground" />
                      Upload history ({history.length})
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {showHistory ? "Hide" : "Show"}
                    </span>
                  </button>
                  {showHistory && (
                    <ul className="border-t border-border divide-y divide-border">
                      {history.map((h) => (
                        <li
                          key={h.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {h.fileName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{h.at}</p>
                          </div>
                          <p className="text-[10px] whitespace-nowrap">
                            <span className="text-emerald-600 font-medium">
                              {h.imported} imported
                            </span>
                            {h.skipped > 0 && (
                              <span className="text-muted-foreground">
                                {" "}
                                · {h.skipped} skipped
                              </span>
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <ScrollArea className="max-h-[55vh]">
              {/* Validation report — what's wrong, and how often (§F10). */}
              <div className="px-6 pt-4">
                <div
                  className={cn(
                    "flex items-start gap-2 rounded-lg px-3 py-2.5",
                    invalidCount === 0
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  )}
                >
                  {invalidCount === 0 ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <p className="font-medium">
                      {invalidCount === 0
                        ? `All ${rows.length} row${rows.length === 1 ? "" : "s"} passed validation.`
                        : `${validRows.length} of ${rows.length} rows can be imported — ${invalidCount} will be skipped.`}
                    </p>
                    {errorSummary.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {errorSummary.map(([issue, count]) => (
                          <li key={issue}>
                            • {issue}{" "}
                            <span className="opacity-70">
                              ({count} row{count === 1 ? "" : "s"})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 overflow-x-auto">
                <table className="w-full text-xs min-w-150">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-8">
                        #
                      </th>
                      {columns.map((c) => (
                        <th
                          key={c.label}
                          className="text-left py-2 pr-3 font-medium text-muted-foreground"
                        >
                          {c.label}
                        </th>
                      ))}
                      <th className="text-left py-2 font-medium text-muted-foreground">
                        Issues
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const valid = isRowValid(row);
                      const issues = rowIssues[i] ?? [];
                      return (
                        <tr
                          key={i}
                          className={cn(
                            "border-b border-border last:border-0",
                            !valid && "bg-destructive/5",
                          )}
                        >
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {i + 1}
                          </td>
                          {columns.map((c, ci) => {
                            const value = c.get(row);
                            return (
                              <td
                                key={c.label}
                                className={cn(
                                  "py-2.5 pr-3",
                                  ci === 0
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground",
                                )}
                              >
                                <div className="flex items-center gap-1.5">
                                  {ci === 0 && !valid && (
                                    <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                                  )}
                                  {value ||
                                    (c.required ? (
                                      <span className="text-destructive">
                                        Missing
                                      </span>
                                    ) : (
                                      "—"
                                    ))}
                                </div>
                              </td>
                            );
                          })}
                          <td className="py-2.5">
                            {issues.length === 0 ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <span className="text-destructive">
                                {issues.join("; ")}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t border-border gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 mr-auto"
                onClick={handleReset}
              >
                <X className="w-3.5 h-3.5" />
                Change File
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  onImport(validRows);
                  setHistory((prev) => [
                    {
                      id: `UP-${Date.now()}`,
                      fileName,
                      at: new Date().toLocaleString(undefined, {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                      imported: validRows.length,
                      skipped: invalidCount,
                    },
                    ...prev,
                  ]);
                  handleClose();
                }}
                disabled={validRows.length === 0}
              >
                Import {validRows.length} {entityNoun}
                {validRows.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
