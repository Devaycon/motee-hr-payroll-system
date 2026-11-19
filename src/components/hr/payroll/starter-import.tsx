"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Download, FileSpreadsheet, Scale, Undo2, Upload, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_HREF, PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { STARTER_SAMPLE_ROWS } from "@/src/lib/payroll/starter-import-sample";
import { buildStarterWorkbook, parseStarterWorkbook, type ImportCtx, type ParseResult, type StagedRow } from "@/src/lib/payroll/starter-import";
import { earliestOpenRun, importCtxFor, useCurrentActor, useOnboardingHandover, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { handoverWorkbook, type HrHire } from "@/src/lib/payroll/onboarding-handover";
import type { PayrollRun } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { NotSupported, fmtDate, money } from "./components/shared";

type Filter = "all" | "errors" | "warnings" | "ready";

/**
 * `/time-payroll/payroll/import` — bring a team onto payroll in one upload.
 * Download the template (or the 24-person sample), fill it, upload it, read
 * the checks row by row, then import the rows that passed and add them to
 * the open pay run. Each import gets its own reconciliation page.
 */
export function StarterImportPage() {
  const router = useRouter();
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const actor = useCurrentActor();
  const canCreate = useCan(PAYROLL_MODULE, "create");
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [addToRun, setAddToRun] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [undo, setUndo] = useState<string | null>(null);

  // The earliest open regular run is the month starters join.
  const openRun = useMemo<PayrollRun | null>(() => earliestOpenRun(data), [data]);
  const handover = useOnboardingHandover();

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !bundle) return <Skeleton className="h-150 w-full rounded-xl" />;

  // Rows are matched against HR onboarding so the same person is never added twice.
  const ctx: ImportCtx = importCtxFor({ data, bundle }, actor.name, handover.hires)!;
  const template = { elements: data.elements, settings: data.settings, bundle, companyName: bundle.tenant.name };

  const download = (sample: boolean) => {
    const wb = buildStarterWorkbook(template, sample ? STARTER_SAMPLE_ROWS : []);
    XLSX.writeFile(wb, sample ? "MOTEE-new-starters-sample-24-staff.xlsx" : "MOTEE-new-starter-template.xlsx");
    actions.logExport("", sample ? "New starter template — sample data" : "New starter template");
  };

  const read = async (file: File) => {
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      setFileName(file.name);
      setResult(parseStarterWorkbook(wb, ctx));
      setFilter("all");
    } catch {
      toast.error("That file couldn't be read", { description: "Upload the MOTEE template as .xlsx (or .csv)." });
    }
  };

  const rows = result?.rows ?? [];
  const ready = rows.filter((r) => r.record);
  const withErrors = rows.filter((r) => r.errors.length);
  const withWarnings = rows.filter((r) => !r.errors.length && r.warnings.length);
  const shown = rows.filter((r) => (filter === "errors" ? r.errors.length : filter === "warnings" ? !r.errors.length && r.warnings.length : filter === "ready" ? r.record : true));
  const imports = [...(data.imports ?? [])].reverse();
  const runFor = (runId?: string) => data.runs.find((r) => r.id === runId);
  const draftRun = openRun?.status === "draft" ? openRun : null;

  const doImport = () => {
    const res = actions.importStarters(rows, fileName, { runId: addToRun && draftRun ? draftRun.id : undefined });
    if (!res.ok) {
      toast.error(res.reason);
      return;
    }
    toast.success(`${res.count} employee${res.count === 1 ? "" : "s"} imported`, {
      description: addToRun && draftRun ? `Added to ${draftRun.title} and calculated.` : "They join the next pay run.",
    });
    router.push(`${PAYROLL_HREF}/import/${res.batchId}`);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Payroll
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Import new starters</h1>
          <p className="max-w-2xl text-xs text-muted-foreground">
            For staff moving onto MOTEE from another payroll — employee details, salary structure, tax, pension, NHF, bank, recurring deductions and year-to-date for each person.
            Genuinely new hires come in through{" "}
            <Link href="/talent/onboarding" className="text-primary hover:underline">
              Onboarding
            </Link>{" "}
            and arrive below, ready to set up.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => download(false)}>
            <FileSpreadsheet className="h-4 w-4" /> Blank template
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => download(true)}>
            <Download className="h-4 w-4" /> Sample · 24 staff
          </Button>
        </div>
      </div>

      <HandoverPanel
        queue={handover.queue}
        staged={handover.staged}
        types={bundle.employmentTypes}
        canCreate={canCreate}
        draftRun={draftRun}
        onDownload={(hires) => {
          XLSX.writeFile(handoverWorkbook(template, hires), "MOTEE-onboarding-handover.xlsx");
          actions.logExport("", `Onboarding hand-over template — ${hires.length} hire${hires.length === 1 ? "" : "s"}`);
        }}
        onSetUp={(ready) => {
          const res = actions.importStarters(ready, `Onboarding hand-over · ${ready.length} hire${ready.length === 1 ? "" : "s"}`, { runId: draftRun?.id });
          if (!res.ok) return void toast.error(res.reason);
          toast.success(`${res.count} new hire${res.count === 1 ? "" : "s"} set up in payroll`, { description: draftRun ? `Added to ${draftRun.title} and calculated.` : "They join the next pay run." });
          router.push(`${PAYROLL_HREF}/import/${res.batchId}`);
        }}
      />

      <ol className="grid gap-2 sm:grid-cols-4">
        {[
          ["Download & fill", "One row per person. The Column guide sheet explains every column."],
          ["Upload & check", "Every row is checked: names, NUBAN, state, PFA, pay, year to date."],
          ["Import", `Rows that pass are saved${draftRun ? ` and added to ${draftRun.title}` : ""}.`],
          ["Reconcile", "Compare MOTEE's first month with the previous payroll's figures."],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-3 rounded-xl border bg-card p-3">
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", i < (result ? 2 : 1) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
            <span>
              <span className="block text-sm font-medium">{t}</span>
              <span className="block text-[11px] text-muted-foreground">{d}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* Upload */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void read(f);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-card px-6 py-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:border-primary/50",
        )}
      >
        <Upload className="h-6 w-6 text-primary" />
        <span className="text-sm font-medium">{fileName ? `Checked ${fileName} — drop another file to replace it` : "Drop the filled template here, or click to choose"}</span>
        <span className="text-xs text-muted-foreground">.xlsx or .csv · nothing is saved until you import</span>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void read(f);
            e.target.value = "";
          }}
        />
      </label>

      {result && result.fileErrors.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <p className="font-semibold">This file can&apos;t be imported</p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {result.fileErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {result && rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Rows checked" value={rows.length} active={filter === "all"} onClick={() => setFilter("all")} />
            <Tile label="Ready to import" value={ready.length} tone="good" active={filter === "ready"} onClick={() => setFilter("ready")} />
            <Tile label="Need fixing" value={withErrors.length} tone={withErrors.length ? "bad" : undefined} active={filter === "errors"} onClick={() => setFilter("errors")} />
            <Tile label="Ready, with warnings" value={withWarnings.length} tone={withWarnings.length ? "warn" : undefined} active={filter === "warnings"} onClick={() => setFilter("warnings")} />
          </div>

          {result.unknownColumns.length > 0 && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Ignored {result.unknownColumns.length} column{result.unknownColumns.length === 1 ? "" : "s"} MOTEE doesn&apos;t recognise: {result.unknownColumns.join(", ")}.
            </p>
          )}

          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Employee</th>
                    <th className="px-3 py-2 font-medium">Department · type</th>
                    <th className="px-3 py-2 font-medium">Starts</th>
                    <th className="px-3 py-2 text-right font-medium">Monthly gross</th>
                    <th className="px-3 py-2 font-medium">Bank · PFA</th>
                    <th className="px-3 py-2 font-medium">Checks</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <StagedLine key={r.row} r={r} types={bundle.employmentTypes} />
                  ))}
                  {!shown.length && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-xs text-muted-foreground">
                        Nothing in this view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-1.5 text-sm">
              {draftRun ? (
                <label className="flex items-center gap-2">
                  <Checkbox checked={addToRun} onCheckedChange={(v) => setAddToRun(v === true)} />
                  Add them to <span className="font-medium">{draftRun.title}</span> (draft) and calculate now
                </label>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {openRun ? `${openRun.title} is ${openRun.status.replace("_", " ")} — the starters join the next run you prepare.` : "No open pay run — the starters are included when the next run is created."}
                </p>
              )}
              {withErrors.length > 0 && (
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  {withErrors.length} row{withErrors.length === 1 ? "" : "s"} with errors will be skipped — fix them in the file and upload it again.
                </p>
              )}
            </div>
            <Button className="gap-2" disabled={!canCreate || !ready.length} onClick={doImport}>
              <UserPlus className="h-4 w-4" /> Import {ready.length} employee{ready.length === 1 ? "" : "s"}
            </Button>
          </div>
        </>
      )}

      {/* Earlier imports */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Imports</p>
          <p className="text-[11px] text-muted-foreground">Each import keeps its reconciliation. Undo is possible until a run that pays them is finalized.</p>
        </div>
        {imports.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">No starters imported yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Imported</th>
                <th className="px-4 py-2 text-right font-medium">Employees</th>
                <th className="px-4 py-2 font-medium">Pay run</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {imports.map((b) => {
                const run = runFor(b.runId) ?? data.runs.find((r) => r.employees.some((e) => b.employees.some((x) => x.id === e.employeeId)));
                return (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium">{b.fileName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fmtDate(b.importedAt)} · {b.importedBy}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{b.employees.length}</td>
                    <td className="px-4 py-2.5 text-xs">{run ? <Link className="text-primary hover:underline" href={`${PAYROLL_HREF}/${run.id}`}>{run.title}</Link> : <span className="text-muted-foreground">Next run</span>}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1.5" asChild>
                          <Link href={`${PAYROLL_HREF}/import/${b.id}`}>
                            <Scale className="h-3.5 w-3.5" /> Reconcile
                          </Link>
                        </Button>
                        {canCreate && (
                          <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => setUndo(b.id)}>
                            <Undo2 className="h-3.5 w-3.5" /> Undo
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!undo} onOpenChange={(o) => !o && setUndo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo this import?</DialogTitle>
            <DialogDescription>
              The employees, their salary structures, profiles and year-to-date are removed, and they&apos;re taken out of any open pay run, which is recalculated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUndo(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const res = actions.removeStarterImport(undo!);
                setUndo(null);
                if (res.ok) toast.success("Import undone");
                else toast.error(res.reason);
              }}
            >
              Undo import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Hires from HR onboarding who aren't on payroll yet. Their onboarding details
 * have already been through the same checks as an upload; the ready ones are
 * set up in one click, the rest download pre-filled to complete.
 */
function HandoverPanel({
  queue,
  staged,
  types,
  canCreate,
  draftRun,
  onDownload,
  onSetUp,
}: {
  queue: HrHire[];
  staged: StagedRow[];
  types: { id: string; name: string }[];
  canCreate: boolean;
  draftRun: PayrollRun | null;
  onDownload: (hires: HrHire[]) => void;
  onSetUp: (rows: StagedRow[]) => void;
}) {
  const ready = staged.filter((r) => r.record);
  const missing = queue.filter((_, i) => !staged[i]?.record);
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold">From onboarding · awaiting payroll setup</p>
            <p className="max-w-2xl text-[11px] text-muted-foreground">
              Hires who cleared onboarding, or start this pay month, and aren&apos;t on payroll yet. The salary, bank, tax and pension details onboarding collected have been checked exactly like an upload.
            </p>
          </div>
        </div>
        {queue.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {missing.length > 0 && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onDownload(missing)}>
                <Download className="h-3.5 w-3.5" /> Complete {missing.length} in the template
              </Button>
            )}
            <Button size="sm" className="gap-1.5" disabled={!canCreate || !ready.length} onClick={() => onSetUp(ready)}>
              <UserPlus className="h-3.5 w-3.5" /> Set up {ready.length} in payroll{draftRun ? ` · add to ${draftRun.period.label}` : ""}
            </Button>
          </div>
        )}
      </div>
      {queue.length === 0 ? (
        <p className="flex items-center justify-center gap-2 px-4 py-6 text-center text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Everyone hired through onboarding is set up in payroll.
          <Link href="/talent/onboarding" className="inline-flex items-center gap-1 text-primary hover:underline">
            Onboarding <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Onboarding</th>
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">Department · type</th>
                <th className="px-3 py-2 font-medium">Starts</th>
                <th className="px-3 py-2 text-right font-medium">Monthly gross</th>
                <th className="px-3 py-2 font-medium">Bank · PFA</th>
                <th className="px-3 py-2 font-medium">Checks</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((h, i) =>
                staged[i] ? (
                  <StagedLine
                    key={h.id}
                    r={{ ...staged[i], name: h.row.name }}
                    types={types}
                    first={
                      <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium", h.status === "onboarded" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-sky-500/10 text-sky-700 dark:text-sky-400")}>
                        {h.status === "onboarded" ? "Onboarded" : "Still onboarding"}
                      </span>
                    }
                    fallbackStart={h.row.startDate}
                    fallbackDept={h.row.department}
                  />
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      )}
      {missing.length > 0 && (
        <p className="border-t px-4 py-2.5 text-[11px] text-muted-foreground">
          {missing.length} hire{missing.length === 1 ? " is" : "s are"} missing details onboarding didn&apos;t collect. Download them pre-filled, complete the gaps and upload the file below — rows are matched back to the onboarding record, never added twice.
        </p>
      )}
    </div>
  );
}

function Tile({ label, value, tone, active, onClick }: { label: string; value: number; tone?: "good" | "bad" | "warn"; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/50", active && "border-primary ring-1 ring-primary/30")}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-semibold tabular-nums", tone === "good" && "text-emerald-600", tone === "bad" && "text-rose-600", tone === "warn" && "text-amber-600")}>{value}</p>
    </button>
  );
}

function StagedLine({
  r,
  types,
  first,
  fallbackStart,
  fallbackDept,
}: {
  r: StagedRow;
  types: { id: string; name: string }[];
  first?: React.ReactNode;
  fallbackStart?: string;
  fallbackDept?: string;
}) {
  const rec = r.record;
  const gross = rec ? rec.structure.lines.reduce((s, l) => s + l.amount, 0) : null;
  return (
    <tr className={cn("border-b align-top last:border-0", r.errors.length && "bg-rose-50/60 dark:bg-rose-950/20")}>
      <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">{first ?? r.row}</td>
      <td className="px-3 py-2.5">
        <p className="font-medium">{r.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {r.employeeNumber}
          {rec ? ` · ${rec.employee.email}` : ""}
        </p>
      </td>
      <td className="px-3 py-2.5 text-xs">
        {rec ? (
          <>
            <p>{rec.employee.departmentName}</p>
            <p className="text-muted-foreground">{types.find((t) => t.id === rec.employee.employmentTypeId)?.name}</p>
          </>
        ) : (
          fallbackDept ?? "—"
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-xs">{rec ? fmtDate(rec.employee.startDate) : fallbackStart ? fmtDate(fallbackStart) : "—"}</td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{gross !== null ? money(gross) : "—"}</td>
      <td className="px-3 py-2.5 text-xs">
        {rec ? (
          <>
            <p>
              {rec.profile.bankName} · <span className="font-mono">{rec.profile.accountNumber}</span>
            </p>
            <p className="text-muted-foreground">{rec.profile.pfaName || "No pension"}</p>
            {rec.loan && (
              <p className="text-muted-foreground">
                Loan {money(rec.loan.amount, 0)} at {money(rec.loan.monthlyRepayment, 0)}/month
              </p>
            )}
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="min-w-72 px-3 py-2.5">
        {!r.errors.length && !r.warnings.length && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> All checks passed
            {rec?.opening ? ` · YTD to month ${rec.opening.months}` : ""}
          </span>
        )}
        <ul className="flex flex-col gap-1">
          {r.errors.map((e, i) => (
            <li key={`e${i}`} className="flex gap-1.5 text-xs text-rose-700 dark:text-rose-300">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {e.column && <span className="font-medium">{e.column}: </span>}
                {e.message}
              </span>
            </li>
          ))}
          {r.warnings.map((w, i) => (
            <li key={`w${i}`} className="flex gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {w.column && <span className="font-medium">{w.column}: </span>}
                {w.message}
              </span>
            </li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

