"use client";

import { useRef, useState } from "react";
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import type { Department, DepartmentStatus } from "../types";

interface DepartmentCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (dept: Department) => void;
  onBulkSave: (depts: Department[]) => void;
}

const EMPTY_FORM = {
  name: "",
  code: "",
  head: "",
  description: "",
  budgetMonthly: "",
  status: "active" as DepartmentStatus,
};

const CSV_HEADERS = "name,code,head,description,budget_monthly,status";
const CSV_EXAMPLE =
  "Engineering,ENG,John Smith,Software and product engineering team,5000000,active\n" +
  "Marketing,MKT,Jane Doe,Brand and growth marketing,2200000,active\n" +
  "Finance,FIN,,Financial management and accounting,1800000,active";

function downloadTemplate() {
  const content = `${CSV_HEADERS}\n${CSV_EXAMPLE}`;
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "departments_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function parseCSVFile(text: string): {
  rows: Department[];
  errors: string[];
} {
  const lines = text
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2)
    return { rows: [], errors: ["File is empty or has no data rows."] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const requiredHeaders = ["name", "code"];
  const missing = requiredHeaders.filter((h) => !headers.includes(h));

  if (missing.length) {
    return {
      rows: [],
      errors: [`Missing required columns: ${missing.join(", ")}`],
    };
  }

  const errors: string[] = [];
  const rows: Department[] = [];

  lines.slice(1).forEach((line, idx) => {
    const values = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });

    if (!obj.name) {
      errors.push(`Row ${idx + 2}: Missing department name.`);
      return;
    }
    if (!obj.code) {
      errors.push(`Row ${idx + 2}: Missing department code.`);
      return;
    }

    const headName = obj.head?.trim() || null;
    rows.push({
      id: `dept-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: obj.name,
      code: obj.code.toUpperCase().slice(0, 6),
      head: headName,
      headInitials: headName ? getInitials(headName) : undefined,
      description: obj.description ?? "",
      budgetMonthly: obj.budget_monthly
        ? parseInt(obj.budget_monthly, 10)
        : undefined,
      status: obj.status === "inactive" ? "inactive" : "active",
      employeeCount: 0,
      openPositions: 0,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
  });

  return { rows, errors };
}

interface ModalState {
  activeTab: string;
  form: typeof EMPTY_FORM;
  parsedRows: Department[];
  parseErrors: string[];
  fileName: string | null;
}

const INITIAL_STATE: ModalState = {
  activeTab: "single",
  form: EMPTY_FORM,
  parsedRows: [],
  parseErrors: [],
  fileName: null,
};

export function DepartmentCreateModal({
  open,
  onClose,
  onSave,
  onBulkSave,
}: DepartmentCreateModalProps) {
  const [state, setState] = useState<ModalState>(INITIAL_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { activeTab, form, parsedRows, parseErrors, fileName } = state;

  const setField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setState((p) => ({ ...p, form: { ...p.form, [key]: value } }));

  const setActiveTab = (tab: string) =>
    setState((p) => ({ ...p, activeTab: tab }));

  const setUploadState = (
    update: Partial<
      Pick<ModalState, "parsedRows" | "parseErrors" | "fileName">
    >,
  ) => setState((p) => ({ ...p, ...update }));

  function handleSingle() {
    if (!form.name.trim() || !form.code.trim()) return;
    const budget = form.budgetMonthly
      ? parseInt(form.budgetMonthly, 10)
      : undefined;
    const headName = form.head.trim() || null;
    onSave({
      id: `dept-${Date.now()}`,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      head: headName,
      headInitials: headName ? getInitials(headName) : undefined,
      employeeCount: 0,
      openPositions: 0,
      budgetMonthly: budget ?? undefined,
      status: form.status,
      description: form.description.trim(),
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
    onClose();
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setUploadState({
        parseErrors: ["Only CSV files are supported."],
        parsedRows: [],
        fileName: null,
      });
      return;
    }
    setUploadState({ fileName: file.name });
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, errors } = parseCSVFile(text);
      setUploadState({ parsedRows: rows, parseErrors: errors });
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleBulkImport() {
    if (parsedRows.length === 0) return;
    onBulkSave(parsedRows);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setState(INITIAL_STATE);
          setIsDragging(false);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>
            Create a single department or import multiple departments via CSV.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 h-8">
            <TabsTrigger value="single" className="text-xs">
              Single Department
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs">
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">
                  Department Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Engineering"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">
                  Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. ENG"
                  value={form.code}
                  onChange={(e) =>
                    setField("code", e.target.value.toUpperCase())
                  }
                  className="h-8 text-sm"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Department Head</Label>
              <Input
                placeholder="Full name of head"
                value={form.head}
                onChange={(e) => setField("head", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                placeholder="Brief description of this department's function..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">
                  Monthly Budget (₦)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 2000000"
                  value={form.budgetMonthly}
                  onChange={(e) => setField("budgetMonthly", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setField("status", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-sm">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="text-sm">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2 flex-row gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleSingle}
                disabled={!form.name.trim() || !form.code.trim()}
              >
                Create Department
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">CSV Template</p>
                  <p className="text-xs text-muted-foreground">
                    Download and fill in the provided template
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={downloadTemplate}
              >
                <Download className="w-3 h-3" />
                Download
              </Button>
            </div>

            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/20",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground text-center">
                {fileName ? (
                  <span className="font-medium text-foreground">
                    {fileName}
                  </span>
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      Click to upload
                    </span>{" "}
                    or drag and drop a CSV file
                  </>
                )}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {parseErrors.length > 0 && (
              <div className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {parseErrors.length}{" "}
                    {parseErrors.length === 1 ? "error" : "errors"} found
                  </span>
                </div>
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive/80 pl-5">
                    {err}
                  </p>
                ))}
              </div>
            )}

            {parsedRows.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-medium">
                    {parsedRows.length} department
                    {parsedRows.length > 1 ? "s" : ""} ready to import
                  </span>
                </div>
                <ScrollArea className="max-h-36 rounded-lg border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Code
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Head
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium">{row.name}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.code}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {row.head ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs capitalize",
                                row.status === "active"
                                  ? "border-green-500/30 bg-green-500/10 text-green-600"
                                  : "border-muted text-muted-foreground",
                              )}
                            >
                              {row.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )}

            <DialogFooter className="pt-2 flex-row gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleBulkImport}
                disabled={parsedRows.length === 0}
              >
                Import{" "}
                {parsedRows.length > 0
                  ? `${parsedRows.length} Department${parsedRows.length > 1 ? "s" : ""}`
                  : "Departments"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
