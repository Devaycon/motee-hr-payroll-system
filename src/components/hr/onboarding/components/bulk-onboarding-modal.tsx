"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, AlertTriangle, CheckCircle2, Download, FileText, Upload, Wallet, X } from "lucide-react";
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
import type { BulkOnboardingRow, BulkPayrollFields } from "../types";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { importCtxFor, useCurrentActor, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { hrHiresFrom, stageHandover } from "@/src/lib/payroll/onboarding-handover";
import { nubanCheckDigit } from "@/src/lib/payroll/run-builder";
import type { StagedRow } from "@/src/lib/payroll/starter-import";
import { bulkRowToRecord, hasPayrollDetails } from "../bulk";
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

/**
 * Optional payroll columns (Nigeria). Whatever is filled travels with the hire
 * and is set up in payroll when onboarding hands them over — blanks are
 * completed by payroll later, they never block onboarding.
 */
const PAYROLL_COLUMNS: { header: string; key: keyof BulkPayrollFields }[] = [
  { header: "annualSalary", key: "salary" },
  { header: "monthlyBasic", key: "monthlyBasic" },
  { header: "monthlyHousing", key: "monthlyHousing" },
  { header: "monthlyTransport", key: "monthlyTransport" },
  { header: "stateOfResidence", key: "state" },
  { header: "tin", key: "taxId" },
  { header: "pfa", key: "pfaName" },
  { header: "rsaPin", key: "rsaPin" },
  { header: "nhfNumber", key: "nhfNumber" },
  { header: "bankName", key: "bankName" },
  { header: "bankCode", key: "bankCode" },
  { header: "accountNumber", key: "accountNumber" },
  { header: "accountName", key: "accountName" },
  { header: "bvn", key: "bvn" },
];

/** Example payroll values for the three template rows (valid NUBANs, licensed PFAs). */
function payrollExamples(): string[][] {
  const nuban = (code: string, first9: string) => first9 + nubanCheckDigit(code, first9);
  return [
    ["", "350000", "175000", "70000", "Lagos", "23456789-0001", "Stanbic IBTC Pension Managers", "PEN100234567890", "", "GTBank", "058", nuban("058", "012345678"), "Chidi Okonkwo", "22123456789"],
    ["9600000", "", "", "", "Lagos", "23456789-0002", "ARM Pension Managers", "PEN100234567891", "", "Access Bank", "044", nuban("044", "069876543"), "Amara Nwosu", "22123456780"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ];
}

function templateCsv(withPayroll: boolean): string {
  const headers = withPayroll ? [...TEMPLATE_HEADERS, ...PAYROLL_COLUMNS.map((c) => c.header)] : TEMPLATE_HEADERS;
  const examples = payrollExamples();
  // NG company departments, so the examples pass the payroll checks as they stand.
  const rows = TEMPLATE_ROWS.map((r, i) => {
    const row = [...r];
    if (withPayroll) row[5] = ["Engineering", "Product & Design", "Product & Design"][i];
    return withPayroll ? [...row, ...examples[i]] : row;
  });
  const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

function downloadTemplate(withPayroll: boolean) {
  const blob = new Blob([templateCsv(withPayroll)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "onboarding_template.csv";
  a.click();
  // Revoking straight away can cancel the download before the browser starts it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads the CSV (or an .xlsx saved from it). Quoted commas and leading zeros survive. */
function parseSheet(wb: XLSX.WorkBook): BulkOnboardingRow[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const objs = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
  return objs
    .map((raw) => {
      const obj: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw)) obj[k.trim()] = String(v ?? "").trim();
      const payroll = Object.fromEntries(PAYROLL_COLUMNS.map((c) => [c.key, obj[c.header] ?? ""])) as unknown as BulkPayrollFields;
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
        payroll: Object.values(payroll).some((v) => v) ? payroll : undefined,
      };
    })
    .filter((r) => r.firstName || r.email);
}

function missingFields(row: BulkOnboardingRow): boolean {
  return !(
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
  const isNg = useAppSelector((s) => s.locale.country) === "ng";
  const canPayroll = useCan(PAYROLL_MODULE, "view");
  const people = useAppSelector((s) => s.locale.data?.employees);
  const onbRecords = useAppSelector((s) => s.onboardingRecords.records);
  const cleared = useAppSelector((s) => s.onboardingRecords.cleared);
  const payrollView = useTenantPayroll({ enabled: open && isNg && canPayroll });
  const actor = useCurrentActor();

  const [phase, setPhase] = useState<"upload" | "preview">("upload");
  const [rows, setRows] = useState<BulkOnboardingRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [workflowId, setWorkflowId] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * The same person must not be onboarded twice: match each row's email and
   * Employee ID against employees, payroll's imported staff, everyone already
   * in onboarding, and the other rows in the file.
   */
  const duplicates = useMemo(() => {
    const known = new Map<string, string>();
    const add = (who: string, ...keys: (string | undefined)[]) => {
      for (const key of keys) if (key && !known.has(key.toLowerCase())) known.set(key.toLowerCase(), who);
    };
    for (const e of people ?? []) add(`${e.fullName} (employee)`, e.email, e.employeeNumber);
    for (const b of payrollView.data?.imports ?? []) for (const e of b.employees) add(`${e.fullName} (payroll)`, e.email, e.employeeNumber);
    for (const r of onbRecords) add(`${r.employeeName} (onboarding)`, r.email, r.referenceId);
    for (const c of cleared) add(`${c.name} (onboarded)`, c.email, c.referenceId);
    const seen = new Map<string, number>();
    return rows.map((r, i) => {
      const hits: string[] = [];
      for (const [label, v] of [["Email", r.email], ["Employee ID", r.employeeId]] as const) {
        if (!v) continue;
        const k = v.toLowerCase();
        if (known.has(k)) hits.push(`${label} ${v} already belongs to ${known.get(k)}`);
        else if (seen.has(k)) hits.push(`${label} ${v} is also on row ${seen.get(k)! + 1}`);
        else seen.set(k, i);
      }
      return hits;
    });
  }, [rows, people, payrollView.data, onbRecords, cleared]);

  /** The payroll import's own checks, run on what each row will hand over. */
  const payrollChecks = useMemo<(StagedRow | null)[]>(() => {
    const ctx = isNg && canPayroll ? importCtxFor(payrollView, actor.name) : null;
    if (!ctx || !rows.length) return rows.map(() => null);
    const today = new Date().toISOString().slice(0, 10);
    const hires = hrHiresFrom(rows.map((r, i) => bulkRowToRecord(r, `preview-${i}`, today)), []);
    const staged = stageHandover(hires, { ...ctx, period: ctx.period });
    return rows.map((_, i) => staged[i] ?? null);
  }, [rows, isNg, canPayroll, payrollView, actor.name]);

  const selectedWorkflowId = workflowId || defaultTemplate?.id || "";
  const blocked = (i: number) => missingFields(rows[i]) || duplicates[i]?.length > 0;
  const validRows = rows.filter((_, i) => !blocked(i));
  const invalidCount = rows.length - validRows.length;
  const payrollReady = rows.filter((r, i) => !blocked(i) && hasPayrollDetails(r) && payrollChecks[i]?.record).length;
  const showPayroll = isNg && rows.some(hasPayrollDetails);

  const handleFileLoad = (file: File) => {
    setFileName(file.name);
    setParseError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer;
        // raw: keep every cell as typed — an account number like 0123456789 keeps its leading 0.
        const wb = file.name.toLowerCase().endsWith(".csv")
          ? XLSX.read(new TextDecoder().decode(buf), { type: "string", raw: true })
          : XLSX.read(buf, { type: "array", raw: true });
        const parsed = parseSheet(wb);
        if (parsed.length === 0) {
          setParseError("No valid rows found. Make sure the file follows the template format.");
          return;
        }
        setRows(parsed);
        setPhase("preview");
      } catch {
        setParseError("That file couldn't be read. Upload the template as .csv or .xlsx.");
      }
    };
    reader.readAsArrayBuffer(file);
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
      <DialogContent className={cn("p-0 gap-0", showPayroll ? "max-w-4xl sm:max-w-4xl" : "max-w-2xl")}>
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
                  : `${validRows.length} valid • ${invalidCount} with missing fields or duplicates${showPayroll ? ` • ${payrollReady} ready for payroll` : ""}`}
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
                      {isNg && (
                        <>
                          {" "}&amp; payroll (annualSalary or monthlyBasic / monthlyHousing / monthlyTransport,
                          stateOfResidence, tin, pfa, rsaPin, nhfNumber, bankName, bankCode, accountNumber,
                          accountName, bvn)
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 shrink-0"
                  onClick={() => downloadTemplate(isNg)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
              </div>

              {isNg && (
                <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">For new hires.</span> Fill the payroll columns and each hire arrives in Payroll ready to pay
                    once onboarding hands them over — anything left blank is completed by payroll later. Moving existing staff from another payroll
                    (with year-to-date)? Use <span className="font-medium text-foreground">Payroll → Import starters</span> instead.
                  </p>
                </div>
              )}

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
                    Accepts .csv (or .xlsx) files
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileLoad(f);
                    e.target.value = "";
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
                      <th className="text-left py-2 pr-3 font-medium text-muted-foreground">
                        Type
                      </th>
                      {showPayroll && (
                        <th className="text-left py-2 font-medium text-muted-foreground min-w-56">
                          Payroll
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const valid = !blocked(i);
                      const dup = duplicates[i] ?? [];
                      return (
                        <tr
                          key={i}
                          className={cn(
                            "border-b border-border last:border-0 align-top",
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
                            {dup.map((d) => (
                              <p key={d} className="mt-0.5 text-[10px] font-normal text-destructive">
                                {d} — not imported.
                              </p>
                            ))}
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
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {row.employmentType || "—"}
                          </td>
                          {showPayroll && (
                            <td className="py-2.5">
                              <PayrollCell row={row} check={payrollChecks[i]} />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            {showPayroll && (
              <p className="px-6 pt-3 text-[11px] text-muted-foreground">
                Payroll checks are the same ones payroll runs on its own uploads. They never block onboarding — each hire appears in Payroll →
                Import starters when onboarding hands them over, and anything flagged is completed there.
              </p>
            )}

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

/** What payroll will make of the row: ready to pay, or what's still to complete. */
function PayrollCell({ row, check }: { row: BulkOnboardingRow; check: StagedRow | null }) {
  if (!hasPayrollDetails(row)) return <span className="text-muted-foreground">Not given — payroll completes it</span>;
  if (!check) return <span className="text-muted-foreground">—</span>;
  // The name/department/start checks are onboarding's own; show the payroll-specific ones.
  const issues = [...check.errors.map((e) => ({ ...e, error: true })), ...check.warnings.map((w) => ({ ...w, error: false }))].filter(
    (x) => !/^(First name|Surname|Work email|Job title|Department|Start date)$/.test(x.column ?? ""),
  );
  return (
    <div className="flex flex-col gap-0.5">
      {check.record ? (
        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Ready for payroll
        </span>
      ) : (
        <span className="text-amber-700 dark:text-amber-400">To complete in payroll</span>
      )}
      {issues.slice(0, 3).map((x, i) => (
        <span key={i} className={cn("flex gap-1 text-[10px]", x.error ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
          <AlertTriangle className="mt-0.5 h-2.5 w-2.5 shrink-0" />
          <span>
            {x.column && <span className="font-medium">{x.column}: </span>}
            {x.message}
          </span>
        </span>
      ))}
      {issues.length > 3 && <span className="text-[10px] text-muted-foreground">+{issues.length - 3} more</span>}
    </div>
  );
}
