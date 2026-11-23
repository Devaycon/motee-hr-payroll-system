"use client";

import { useMemo, useRef, useState } from "react";
import { Calculator, Eye, FileSpreadsheet, Loader2, Search, TriangleAlert, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { writeTable, type ExportFormat } from "@/src/lib/payroll/exports";
import { calculateSalary, type SalaryCalculations } from "@/src/lib/payroll-calculator/tax-calculations";
import { NIGERIA_TEMPLATE, nigeriaResults, parseNigeriaRow, type EmployeeData } from "@/src/lib/payroll-calculator/nigeria-bulk";
import { createRowReader, downloadWorkbook, readSheetRows } from "@/src/lib/payroll-calculator/spreadsheet";
import { cn } from "@/src/lib/utils";
import { DetailModal, DownloadMenu, RowActions } from "../payroll/components/row-actions";
import { CalculationResult, calculationTable, naira } from "./result-panels";

interface BulkRow {
  index: number;
  id: string;
  data: EmployeeData;
  c: SalaryCalculations;
}

/**
 * Bulk: the website's spreadsheet template, upload and results workbook —
 * every employee in one table, with a detail modal per row and "open in
 * the calculator" to work on one person.
 */
export function BulkCalculator({ onOpen }: { onOpen: (data: EmployeeData, label: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [busy, setBusy] = useState<"upload" | "template" | "results" | null>(null);
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<BulkRow | null>(null);

  const upload = async (file: File) => {
    setBusy("upload");
    try {
      const parsed = readSheetRows(new Uint8Array(await file.arrayBuffer())).map((r) => parseNigeriaRow(createRowReader(r)));
      if (!parsed.length) {
        toast.error("No employee rows found", { description: "Use the template: one employee per row under the header." });
        return;
      }
      setRows(parsed.map((data, i) => ({ index: i, id: data.employeeId || `Employee ${i + 1}`, data, c: calculateSalary(data) })));
      setFileName(file.name);
      toast.success(`${parsed.length} employee${parsed.length === 1 ? "" : "s"} calculated`);
    } catch {
      toast.error("Couldn't read that file", { description: "Please make sure it follows the template format (.xlsx, .xls or .csv)." });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const clear = () => {
    setRows([]);
    setFileName(null);
    setQ("");
  };

  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) => !needle || r.id.toLowerCase().includes(needle));
  const noSalary = rows.filter((r) => r.c.monthlyGross <= 0);
  const minTax = rows.filter((r) => r.c.isMinimumTaxApplied && r.c.monthlyGross > 0);
  const total = useMemo(() => {
    const s = (f: (c: SalaryCalculations) => number) => rows.reduce((t, r) => t + f(r.c), 0);
    return {
      gross: s((c) => c.monthlyGross),
      pension: s((c) => c.employeePension + c.voluntaryPension),
      nhf: s((c) => c.nhf),
      nhis: s((c) => c.employeeNHIS),
      paye: s((c) => c.monthlyPAYE),
      net: s((c) => c.monthlyNetPay),
      employer: s((c) => c.totalEmployerContributions),
      ctc: s((c) => c.totalEmployerCost),
    };
  }, [rows]);

  const downloadResults = async (f: ExportFormat) => {
    const sheet = nigeriaResults(rows.map((r) => r.data));
    if (f === "xlsx") {
      setBusy("results");
      try {
        await downloadWorkbook("Nigeria_Payroll_Results.xlsx", "Results", sheet);
      } finally {
        setBusy(null);
      }
      return;
    }
    writeTable("Nigeria_Payroll_Results", "Results", { preamble: [["Payroll calculator — bulk results"], [fileName ? `From ${fileName}` : ""], []], headers: sheet.columns.map((c) => c.header), data: sheet.rows.map((row) => sheet.columns.map((c) => row[c.header] ?? "")) }, f);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Step n={1} title="Download the template" text="One employee per row. Yes/No and basis columns have dropdowns; header notes explain each field.">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={busy === "template"}
            onClick={async () => {
              setBusy("template");
              try {
                await downloadWorkbook("Nigeria_Payroll_Template.xlsx", "Employee Salaries", NIGERIA_TEMPLATE);
              } finally {
                setBusy(null);
              }
            }}
          >
            {busy === "template" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />} Excel template
          </Button>
        </Step>
        <Step n={2} title="Upload the completed sheet" text="Excel (.xlsx, .xls) or CSV. Renamed headers are matched by name, so small edits still work.">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          {fileName ? (
            <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-800 dark:text-emerald-300">
              <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{fileName}</span>
              <button type="button" aria-label="Remove uploaded file" onClick={clear}><X className="h-3.5 w-3.5" /></button>
            </span>
          ) : (
            <Button size="sm" className="gap-1.5" disabled={busy === "upload"} onClick={() => fileRef.current?.click()}>
              {busy === "upload" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload file
            </Button>
          )}
        </Step>
        <Step n={3} title="Review and download" text="Every employee is calculated exactly as in the single calculator. Download the results as Excel, CSV or PDF.">
          <DownloadMenu label={busy === "results" ? "Preparing…" : "Results"} disabled={!rows.length || busy === "results"} onDownload={(f) => void downloadResults(f)} />
        </Step>
      </div>

      {rows.length > 0 && (
        <>
          {(noSalary.length > 0 || minTax.length > 0) && (
            <div className="space-y-1 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
              {noSalary.length > 0 && <p className="flex items-center gap-1.5"><TriangleAlert className="h-3.5 w-3.5" /> {noSalary.length} row{noSalary.length === 1 ? " has" : "s have"} no salary: {noSalary.slice(0, 5).map((r) => r.id).join(", ")}{noSalary.length > 5 ? "…" : ""}. Check the sheet.</p>}
              {minTax.length > 0 && <p className="flex items-center gap-1.5"><TriangleAlert className="h-3.5 w-3.5" /> Minimum tax (1% of gross) applies to {minTax.length} employee{minTax.length === 1 ? "" : "s"}.</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Employees" value={String(rows.length)} />
            <Tile label="Monthly gross" value={naira(total.gross)} />
            <Tile label="Monthly net pay" value={naira(total.net)} />
            <Tile label="Monthly cost to company" value={naira(total.ctc)} sub={`${naira(total.ctc * 12)} a year`} />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Results</p>
                <p className="text-[11px] text-muted-foreground">{shown.length} of {rows.length} employees · monthly figures</p>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="h-8 w-56 pl-7 text-xs" placeholder="Search employee ID" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-xs">
                <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Employee</th>
                    {["Gross", "Pension", "NHF", "NHIS", "PAYE", "Net pay", "Employer contrib.", "Cost to company"].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 text-right font-medium">{h}</th>)}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.index} className={cn("border-t", r.c.monthlyGross <= 0 && "bg-amber-500/5")}>
                      <td className="px-4 py-2">
                        <span className="font-medium">{r.id}</span>
                        <span className="block text-[10px] text-muted-foreground">{r.c.effectiveTaxRate.toFixed(1)}% effective tax{r.c.isMinimumTaxApplied && r.c.monthlyGross > 0 ? " · minimum tax" : ""}</span>
                      </td>
                      <Num v={r.c.monthlyGross} />
                      <Num v={r.c.employeePension + r.c.voluntaryPension} />
                      <Num v={r.c.nhf} />
                      <Num v={r.c.employeeNHIS} />
                      <Num v={r.c.monthlyPAYE} />
                      <Num v={r.c.monthlyNetPay} strong />
                      <Num v={r.c.totalEmployerContributions} />
                      <Num v={r.c.totalEmployerCost} />
                      <td className="px-2 py-2">
                        <RowActions
                          label={`${r.id} actions`}
                          actions={[
                            { label: "View details", icon: Eye, onSelect: () => setDetail(r) },
                            { label: "Open in calculator", icon: Calculator, onSelect: () => onOpen(r.data, r.id) },
                            {
                              label: "Download this employee",
                              download: { onDownload: (f) => writeTable(`payroll-calculation-${r.id.replace(/\W+/g, "-").toLowerCase()}`, "Calculation", calculationTable(r.data, r.c, `Payroll calculation — ${r.id}`), f) },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                  {!shown.length && <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No employee matches “{q}”.</td></tr>}
                </tbody>
                <tfoot className="border-t-2 font-semibold">
                  <tr>
                    <td className="px-4 py-2.5">Total · {rows.length}</td>
                    <Num v={total.gross} />
                    <Num v={total.pension} />
                    <Num v={total.nhf} />
                    <Num v={total.nhis} />
                    <Num v={total.paye} />
                    <Num v={total.net} />
                    <Num v={total.employer} />
                    <Num v={total.ctc} />
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {!rows.length && (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          Download the template, fill in one employee per row, then upload it to calculate everyone at once.
        </div>
      )}

      {detail && (
        <DetailModal
          wide
          open
          onClose={() => setDetail(null)}
          title={detail.id}
          description={`Row ${detail.index + 1} of ${fileName ?? "the uploaded sheet"}`}
          actions={
            <>
              <DownloadMenu label="Download" onDownload={(f) => writeTable(`payroll-calculation-${detail.id.replace(/\W+/g, "-").toLowerCase()}`, "Calculation", calculationTable(detail.data, detail.c, `Payroll calculation — ${detail.id}`), f)} />
              <Button size="sm" className="gap-1.5" onClick={() => { const d = detail; setDetail(null); onOpen(d.data, d.id); }}><Calculator className="h-3.5 w-3.5" /> Open in calculator</Button>
            </>
          }
        >
          <CalculationResult inputs={detail.data} c={detail.c} compact />
        </DetailModal>
      )}
    </div>
  );
}

function Step({ n, title, text, children }: { n: number; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">{n}</span>{title}</p>
      <p className="flex-1 text-xs text-muted-foreground">{text}</p>
      <div>{children}</div>
    </div>
  );
}

function Num({ v, strong }: { v: number; strong?: boolean }) {
  return <td className={cn("whitespace-nowrap px-3 py-2 text-right tabular-nums", strong && "font-semibold")}>{naira(v)}</td>;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-base font-semibold tabular-nums">{value}</p>
      {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
