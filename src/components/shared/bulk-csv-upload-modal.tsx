"use client";

import { useRef, useState } from "react";
import { AlertCircle, Download, FileText, Upload, X } from "lucide-react";
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
  columns: PreviewColumn<T>[];
  onImport: (rows: T[]) => void;
  /** Singular noun used in the import button, e.g. "leave request". */
  entityNoun: string;
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
  columns,
  onImport,
  entityNoun,
}: BulkCsvUploadModalProps<T>) {
  const [phase, setPhase] = useState<"upload" | "preview">("upload");
  const [rows, setRows] = useState<T[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter(isRowValid);
  const invalidCount = rows.length - validRows.length;

  const csvTemplate =
    headers.join(",") + "\n" + sampleRows.map((r) => r.join(",")).join("\n");

  function downloadTemplate() {
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCSV(text: string): T[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const head = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      head.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      return parseRow(obj);
    });
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
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const valid = isRowValid(row);
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
