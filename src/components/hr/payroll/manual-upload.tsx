"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleAlert, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_HREF, PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { downloadTemplate } from "@/src/lib/payroll/exports";
import { usePayrollActions, useRun } from "@/src/lib/payroll/use-payroll";
import type { PayElement, PayslipLine } from "@/src/lib/payroll/types";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { cn } from "@/src/lib/utils";
import { money } from "./components/shared";

/**
 * Manual pathway: figures calculated outside MOTEE (a consultant, a one-off
 * correction, a client not ready to trust auto-calc yet). Any spreadsheet
 * the client already uses can be mapped — they aren't forced onto our
 * template. Nothing touches the run until the staged preview is confirmed,
 * and the same validation runs afterwards as for auto-calculated pay.
 */

type Layout = "long" | "wide";
const IGNORE = "__ignore";

interface Staged {
  employeeId: string;
  name: string;
  lines: PayslipLine[];
  errors: string[];
}

function guess(header: string, elements: PayElement[]): string {
  const h = header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const byCode = elements.find((e) => e.code.toLowerCase().replace(/_/g, "") === h);
  if (byCode) return byCode.code;
  const byName = elements.find((e) => e.name.toLowerCase().replace(/[^a-z0-9]/g, "") === h);
  if (byName) return byName.code;
  const loose = elements.find((e) => h.length > 3 && e.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(h));
  return loose?.code ?? IGNORE;
}

export function ManualUploadPage({ runId }: { runId: string }) {
  const router = useRouter();
  const { run, data, bundle, loading } = useRun(runId);
  const actions = usePayrollActions();
  const canEdit = useCan(PAYROLL_MODULE, "edit");
  const [layout, setLayout] = useState<Layout>("wide");
  const [fileName, setFileName] = useState("");
  const [grid, setGrid] = useState<(string | number)[][]>([]);
  const [idCol, setIdCol] = useState(0);
  const [codeCol, setCodeCol] = useState(2);
  const [amountCol, setAmountCol] = useState(3);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [statutory, setStatutory] = useState<"recalculate" | "as_uploaded">("recalculate");

  const elements = useMemo(() => (data?.elements ?? []).filter((e) => e.active && e.category !== "employer"), [data]);
  const elMap = useMemo(() => new Map(elements.map((e) => [e.code, e])), [elements]);
  const people = useMemo(() => bundle?.employees ?? [], [bundle]);
  const headers = useMemo(() => grid[0]?.map(String) ?? [], [grid]);
  const body = useMemo(() => grid.slice(1).filter((r) => r.some((c) => String(c ?? "").trim() !== "")), [grid]);

  const staged = useMemo<Staged[]>(() => {
    if (!body.length) return [];
    const byEmp = new Map<string, Staged>();
    const find = (v: string): LocaleEmployee | undefined =>
      people.find((p) => p.employeeNumber.toLowerCase() === v.toLowerCase() || p.id.toLowerCase() === v.toLowerCase());
    const add = (rawId: string, code: string, rawAmount: unknown, rowNo: number) => {
      const emp = find(rawId);
      const key = emp?.id ?? `?${rawId}`;
      const s = byEmp.get(key) ?? { employeeId: emp?.id ?? rawId, name: emp?.fullName ?? rawId, lines: [], errors: [] };
      if (!emp) s.errors.push(`Row ${rowNo}: no employee with ID “${rawId}”.`);
      else if (emp.status === "terminated" && !run?.employees.some((x) => x.employeeId === emp.id))
        s.errors.push(`Row ${rowNo}: ${emp.fullName} is no longer employed. Pay a leaver through an off-cycle run.`);
      const el = elMap.get(code);
      const amount = typeof rawAmount === "number" ? rawAmount : Number(String(rawAmount ?? "").replace(/[₦,\s]/g, ""));
      if (String(rawAmount ?? "").trim() === "") {
        byEmp.set(key, s);
        return;
      }
      if (!el) s.errors.push(`Row ${rowNo}: unknown pay element “${code}”.`);
      else if (!Number.isFinite(amount)) s.errors.push(`Row ${rowNo}: “${rawAmount}” isn't a number.`);
      else if (s.lines.some((l) => l.code === code)) s.errors.push(`Row ${rowNo}: ${el.name} appears twice for this employee.`);
      else if (amount !== 0)
        s.lines.push({ code, name: el.name, category: el.category, group: el.group, amount: Math.round(amount * 100) / 100, source: "manual", statutory: el.statutory, taxable: el.taxable });
      byEmp.set(key, s);
    };
    if (layout === "long") {
      body.forEach((r, i) => add(String(r[idCol] ?? "").trim(), String(r[codeCol] ?? "").trim().toUpperCase(), r[amountCol], i + 2));
    } else {
      const seen = new Set<string>();
      body.forEach((r, i) => {
        const id = String(r[idCol] ?? "").trim();
        if (seen.has(id)) {
          const s = byEmp.get(people.find((p) => p.employeeNumber === id || p.id === id)?.id ?? `?${id}`);
          s?.errors.push(`Row ${i + 2}: duplicate row for this employee.`);
          return;
        }
        seen.add(id);
        headers.forEach((_, c) => {
          const code = mapping[c];
          if (c === idCol || !code || code === IGNORE) return;
          add(id, code, r[c], i + 2);
        });
      });
    }
    for (const s of byEmp.values()) {
      if (!s.errors.length && !s.lines.some((l) => l.category === "earning")) s.errors.push("No earnings — at least basic pay is needed.");
    }
    return [...byEmp.values()];
  }, [body, layout, idCol, codeCol, amountCol, mapping, headers, people, elMap]);

  if (loading || !data || !bundle) return <Skeleton className="h-[500px] w-full rounded-xl" />;
  if (!run) return <p className="py-20 text-center text-sm text-muted-foreground">Run not found.</p>;
  if (run.status !== "draft" || !canEdit)
    return <p className="py-20 text-center text-sm text-muted-foreground">Figures can only be uploaded to a draft run you can edit.</p>;

  const valid = staged.filter((s) => !s.errors.length);
  const invalid = staged.filter((s) => s.errors.length);
  const templateCodes = ["BASIC", "HOUSING", "TRANSPORT", "UTILITY", "MEAL", "PERFORMANCE_BONUS", "PAYE", "PENSION_EE", "NHF"];

  async function onFile(f: File) {
    let rows: (string | number)[][];
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("empty");
      rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, raw: true, defval: "" });
    } catch {
      toast.error(`Couldn't read ${f.name}`, { description: "Save it as .csv or .xlsx and try again." });
      return;
    }
    if (rows.length < 2) {
      toast.error(`${f.name} has no data rows`, { description: "The first row should be headers, with one row per employee or line below it." });
      return;
    }
    setFileName(f.name);
    setGrid(rows);
    const hdr = (rows[0] ?? []).map(String);
    const idIdx = Math.max(0, hdr.findIndex((h) => /employee\s*(id|no|number)|staff\s*(id|no)/i.test(h)));
    setIdCol(idIdx);
    const looksLong = hdr.some((h) => /element|code/i.test(h)) && hdr.some((h) => /amount/i.test(h));
    setLayout(looksLong ? "long" : "wide");
    if (looksLong) {
      setCodeCol(Math.max(0, hdr.findIndex((h) => /element|code/i.test(h))));
      setAmountCol(Math.max(0, hdr.findIndex((h) => /amount/i.test(h))));
    }
    const m: Record<number, string> = {};
    hdr.forEach((h, i) => {
      if (i === idIdx || /^name$|employee name|full name/i.test(h)) m[i] = IGNORE;
      else m[i] = guess(h, elements);
    });
    setMapping(m);
  }

  function commit() {
    actions.applyManualUpload(run!.id, valid.map((s) => ({ employeeId: s.employeeId, lines: s.lines })), statutory, fileName || "upload");
    toast.success(`${valid.length} employee${valid.length === 1 ? "" : "s"} switched to uploaded figures`, {
      description: "The run was recalculated and re-validated — the same checks as auto-calculated pay.",
    });
    router.push(`${PAYROLL_HREF}/${run!.id}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`${PAYROLL_HREF}/${run.id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {run.title}
        </Link>
        <h1 className="mt-1 text-3xl font-semibold">Upload payroll figures</h1>
        <p className="text-xs text-muted-foreground">
          Use our template or your own spreadsheet. Uploaded employees switch to <b>manual</b>; everyone else stays auto-calculated in the same run.
        </p>
      </div>

      {/* Step 1 */}
      <Step n={1} title="Get a template (optional)">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadTemplate("wide", people.filter((p) => p.status !== "terminated"), templateCodes)}>
            <Download className="h-3.5 w-3.5" /> Wide — one row per employee
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadTemplate("long", people.filter((p) => p.status !== "terminated"), templateCodes)}>
            <Download className="h-3.5 w-3.5" /> Long — one row per pay element
          </Button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Columns use pay element codes (BASIC, HOUSING, PAYE…). Employee ID is the staff number (e.g. NG1003).</p>
      </Step>

      {/* Step 2 */}
      <Step n={2} title="Upload your file">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition hover:bg-muted/40">
          <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">{fileName || "Choose a CSV or Excel file"}</span>
          <span className="text-[11px] text-muted-foreground">{fileName ? `${body.length} data rows read` : ".csv, .xlsx — first sheet is used"}</span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              // Clear it so choosing the same file again (after fixing it) still loads.
              e.target.value = "";
              if (f) void onFile(f);
            }}
          />
        </label>
      </Step>

      {grid.length > 0 && (
        <Step n={3} title="Map your columns">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Layout</Label>
              <Select value={layout} onValueChange={(v) => setLayout(v as Layout)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wide">Wide — a column per element</SelectItem>
                  <SelectItem value="long">Long — element + amount columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ColPick label="Employee ID column" headers={headers} value={idCol} onChange={setIdCol} />
            {layout === "long" && (
              <>
                <ColPick label="Pay element code column" headers={headers} value={codeCol} onChange={setCodeCol} />
                <ColPick label="Amount column" headers={headers} value={amountCol} onChange={setAmountCol} />
              </>
            )}
          </div>
          {layout === "wide" && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {headers.map((h, i) =>
                i === idCol ? null : (
                  <div key={i} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{h || `Column ${i + 1}`}</span>
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <Select value={mapping[i] ?? IGNORE} onValueChange={(v) => setMapping((m) => ({ ...m, [i]: v }))}>
                      <SelectTrigger className={cn("h-7 w-44 text-[11px]", (mapping[i] ?? IGNORE) === IGNORE && "text-muted-foreground")}><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value={IGNORE} className="text-xs">Ignore this column</SelectItem>
                        {elements.map((e) => <SelectItem key={e.code} value={e.code} className="text-xs">{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ),
              )}
            </div>
          )}
        </Step>
      )}

      {staged.length > 0 && (
        <Step n={4} title="Check the preview — nothing is saved yet">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> {valid.length} ready</Badge>
            {invalid.length > 0 && <Badge variant="outline" className="gap-1 border-rose-500/30 text-rose-600"><CircleAlert className="h-3 w-3" /> {invalid.length} with errors — skipped</Badge>}
          </div>
          <div className="overflow-hidden rounded-xl border">
            {staged.map((s) => {
              const gross = s.lines.filter((l) => l.category === "earning").reduce((a, l) => a + l.amount, 0);
              const ded = s.lines.filter((l) => l.category === "deduction").reduce((a, l) => a + l.amount, 0);
              return (
                <div key={s.employeeId} className={cn("border-b px-4 py-2.5 text-xs last:border-0", s.errors.length && "bg-rose-500/5")}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{s.name}</p>
                    <p className="tabular-nums text-muted-foreground">
                      {s.lines.length} lines · gross {money(gross)}
                      {statutory === "as_uploaded" && ` · deductions ${money(ded)}`}
                    </p>
                  </div>
                  {s.errors.map((e, i) => (
                    <p key={i} className="mt-0.5 flex items-center gap-1 text-[11px] text-rose-600"><AlertTriangle className="h-3 w-3" /> {e}</p>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Statutory deductions</Label>
              <Select value={statutory} onValueChange={(v) => setStatutory(v as typeof statutory)}>
                <SelectTrigger className="h-8 w-[22rem] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recalculate" className="text-xs">Recalculate PAYE, pension &amp; NHF from the uploaded pay (recommended)</SelectItem>
                  <SelectItem value="as_uploaded" className="text-xs">Use the PAYE / pension / NHF in the file exactly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-1.5" disabled={!valid.length} onClick={commit}>
              <Upload className="h-4 w-4" /> Apply {valid.length} employee{valid.length === 1 ? "" : "s"} to the run
            </Button>
          </div>
        </Step>
      )}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{n}</span>
        {title}
      </p>
      {children}
    </section>
  );
}

function ColPick({ label, headers, value, onChange }: { label: string; headers: string[]; value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {headers.map((h, i) => <SelectItem key={i} value={String(i)} className="text-xs">{h || `Column ${i + 1}`}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
