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
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import type { BulkOnboardingRow } from "../types";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  getOnboardingTemplates,
  getDefaultOnboardingTemplate,
} from "../instantiate";

const TEMPLATE_HEADERS = [
  "employeeId",
  "firstName",
  "surname",
  "email",
  "jobTitle",
  "department",
  "startDate",
  "employmentType",
  "manager",
  "allergies",
  "conditions",
  "medications",
  "dietaryRequirements",
  "accessibilityNeeds",
  "assetTag",
  "assetName",
  "assetCategory",
  "assetSerialNumber",
  "assetAssignedDate",
];

const TEMPLATE_ROWS = [
  [
    "EMP-1001",
    "Chidi",
    "Okonkwo",
    "chidi.okonkwo@example.com",
    "Software Engineer",
    "Engineering",
    "2026-05-01",
    "Full Time",
    "Jane Smith",
    "Peanuts",
    "",
    "",
    "Halal",
    "",
    "AST-1001",
    "MacBook Pro 14",
    "Laptop",
    "C02ABC123",
    "2026-05-01",
  ],
  [
    "",
    "Amara",
    "Nwosu",
    "amara.nwosu@example.com",
    "Product Manager",
    "Product",
    "2026-05-15",
    "Full Time",
    "Alice Johnson",
    "",
    "Asthma",
    "Ventolin",
    "Vegetarian",
    "",
    "AST-1002",
    "iPhone 15",
    "Phone",
    "F2LXYZ789",
    "2026-05-15",
  ],
  [
    "EMP-1003",
    "Funmi",
    "Adeyemi",
    "funmi.adeyemi@example.com",
    "UX Designer",
    "Design",
    "2026-06-01",
    "Contract",
    "David Osei",
    "",
    "",
    "",
    "",
    "Step-free access",
    "AST-1003",
    "Dell XPS 13",
    "Laptop",
    "DXPS13-456",
    "2026-06-01",
  ],
];

const CSV_TEMPLATE =
  TEMPLATE_HEADERS.join(",") +
  "\n" +
  TEMPLATE_ROWS.map((r) => r.join(",")).join("\n");

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "onboarding_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): BulkOnboardingRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      return {
        employeeId: obj.employeeId ?? "",
        firstName: obj.firstName ?? "",
        lastName: obj.surname ?? obj.lastName ?? "",
        email: obj.email ?? "",
        jobTitle: obj.jobTitle ?? "",
        department: obj.department ?? "",
        startDate: obj.startDate ?? "",
        employmentType: obj.employmentType ?? "",
        manager: obj.manager ?? "",
        allergies: obj.allergies ?? "",
        conditions: obj.conditions ?? "",
        medications: obj.medications ?? "",
        dietaryRequirements: obj.dietaryRequirements ?? "",
        accessibilityNeeds: obj.accessibilityNeeds ?? "",
        assetTag: obj.assetTag ?? "",
        assetName: obj.assetName ?? "",
        assetCategory: obj.assetCategory ?? "",
        assetSerialNumber: obj.assetSerialNumber ?? "",
        assetAssignedDate: obj.assetAssignedDate ?? "",
      };
    })
    .filter((r) => r.firstName || r.email);
}

function isRowValid(row: BulkOnboardingRow): boolean {
  return !!(
    row.firstName &&
    row.lastName &&
    row.email &&
    row.jobTitle &&
    row.department &&
    row.startDate
  );
}

interface BulkOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: BulkOnboardingRow[]) => void;
}

export function BulkOnboardingModal({
  open,
  onClose,
  onImport,
}: BulkOnboardingModalProps) {
  const templates = useAppSelector((s) => s.approvals.templates);
  const onboardingTemplates = getOnboardingTemplates(templates);
  const defaultTemplate = getDefaultOnboardingTemplate(templates);

  const [phase, setPhase] = useState<"upload" | "preview">("upload");
  const [rows, setRows] = useState<BulkOnboardingRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [workflowId, setWorkflowId] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedWorkflowId = workflowId || defaultTemplate?.id || "";
  const validRows = rows.filter(isRowValid);
  const invalidCount = rows.length - validRows.length;

  const handleFileLoad = (file: File) => {
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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileLoad(file);
  };

  const handleConfirm = () =>
    onImport(
      validRows.map((r) => ({ ...r, workflowTemplateId: selectedWorkflowId })),
    );

  const handleReset = () => {
    setPhase("upload");
    setRows([]);
    setFileName("");
    setParseError("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

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
                  ? "Bulk Onboarding Upload"
                  : `Preview — ${rows.length} row${rows.length !== 1 ? "s" : ""} imported`}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {phase === "upload"
                  ? "Download our CSV template, fill it in, then upload to onboard multiple employees."
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
                      onboarding_template.csv
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Columns: firstName, surname, email, jobTitle, department,
                      startDate, employmentType, manager, plus optional
                      employeeId, medical (allergies, conditions,
                      medications, dietaryRequirements, accessibilityNeeds) &amp;
                      asset (assetTag, assetName, assetCategory,
                      assetSerialNumber, assetAssignedDate)
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
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                        Job Title
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                        Department
                      </th>
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                        Start Date
                      </th>
                      <th className="text-left py-2 font-medium text-muted-foreground">
                        Type
                      </th>
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
                          <td className="py-2.5 pr-3 font-medium text-foreground">
                            <div className="flex items-center gap-1.5">
                              {!valid && (
                                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                              )}
                              {row.firstName} {row.lastName}
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {row.email || (
                              <span className="text-destructive">Missing</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {row.jobTitle || (
                              <span className="text-destructive">Missing</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {row.department || (
                              <span className="text-destructive">Missing</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {row.startDate || (
                              <span className="text-destructive">Missing</span>
                            )}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {row.employmentType || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            <div className="px-6 pt-4 flex items-center gap-2">
              <Label className="text-xs font-medium shrink-0">
                Onboarding Workflow
              </Label>
              <Select value={selectedWorkflowId} onValueChange={setWorkflowId}>
                <SelectTrigger className="h-8 text-sm w-72">
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent>
                  {onboardingTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-sm">
                      {t.name}
                      {t.isDefault ? " (Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[11px] text-muted-foreground">
                Applied to all imported hires
              </span>
            </div>

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
                onClick={handleConfirm}
                disabled={validRows.length === 0}
              >
                Import {validRows.length} Employee
                {validRows.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
