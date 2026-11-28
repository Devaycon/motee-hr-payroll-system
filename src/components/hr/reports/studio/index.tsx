"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookCopy,
  CalendarClock,
  Copy,
  Eye,
  FileStack,
  Info,
  Lock,
  Plus,
  Save,
  Search,
  Sigma,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { DownloadMenu, RowActions } from "@/src/components/hr/payroll/components/row-actions";
import { BarList } from "@/src/components/hr/payroll/components/charts";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_MODULE, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { writeTable, type ExportFormat } from "@/src/lib/payroll/exports";
import { ALL_REPORTS } from "@/src/lib/reports/registry";
import { ALL_PAYROLL_DATASETS, type PayrollFact } from "@/src/lib/reports/registry/payroll-datasets";
import { reportInCountry, useReportContext } from "@/src/lib/reports/use-report-context";
import {
  FILTER_OP_LABELS,
  STARTER_TEMPLATES,
  fieldsFor,
  nextRunOf,
  parseFormula,
  runSpec,
  type Aggregate,
  type CalculatedField,
  type FilterOp,
  type Frequency,
  type OutputKind,
  type ReportSpec,
  type StudioField,
} from "@/src/lib/reports/studio";
import { deleteReport, duplicateReport, logStudioRun, saveReport, setReportStatus } from "@/src/lib/stores/report-studio-slice";
import type { AnyReportDef } from "@/src/lib/reports/types";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { cn } from "@/src/lib/utils";

const NONE = "__none__";
const PREVIEW_ROWS = 100;
const TYPE_BADGE: Record<string, string> = { money: "₦", number: "#", percent: "%", date: "date", boolean: "y/n", text: "abc" };
const OUTPUTS: { key: OutputKind; label: string; hint: string }[] = [
  { key: "table", label: "Table", hint: "Every row" },
  { key: "summary", label: "Summary", hint: "Grouped totals" },
  { key: "chart", label: "Chart", hint: "Bar per group" },
  { key: "kpi", label: "KPI", hint: "Headline totals" },
];
const FREQUENCIES: Frequency[] = ["daily", "weekly", "monthly", "quarterly"];

const uid = (p: string) => `${p}-${Date.now().toString(36).toUpperCase()}`;
const fmtMoney = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtCell = (v: string | number, type: string) => (typeof v === "number" ? (type === "money" ? fmtMoney(v) : type === "percent" ? `${v}%` : v.toLocaleString("en-NG")) : v);

function blankSpec(datasetId: string, owner: { name: string; id?: string }): ReportSpec {
  const now = new Date().toISOString();
  return { id: uid("RPT"), name: "Untitled report", datasetId, columns: [], filters: [], match: "all", calculated: [], output: "table", status: "active", owner: owner.name, ownerId: owner.id, createdAt: now, updatedAt: now, schedule: null };
}

/**
 * `/operations/reports/studio` — MOTEE Report Studio, the advanced custom
 * report builder (client feedback B2). HR and payroll datasets, a governed
 * field dictionary, AND/OR filters, grouping and aggregation, calculated
 * fields, table / summary / chart / KPI output, live preview, saved reports
 * and templates, scheduled delivery, and field-level access enforced every
 * time a report runs or is exported.
 */
export function ReportStudioPage() {
  const router = useRouter();
  const search = useSearchParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const me = { name: user?.name ?? "HR Admin", id: user?.employeeId };
  const saved = useAppSelector((s) => s.reportStudio.reports);
  const log = useAppSelector((s) => s.reportStudio.log);
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);
  const { data: bundle, loading } = useLocaleSection<LocaleBundle>((b) => b);
  const { ctx, payrollLoading } = useReportContext();
  const canIdentifiers = useCan(PAYROLL_MODULE, "edit");
  const canBank = useCan(PAYROLL_SETTINGS_MODULE, "edit");
  const canManageAll = useCan("operations.reports", "edit");

  // Datasets this person may use (permissions checked here and again on every run).
  const datasets = useMemo(() => {
    const level = accessLevelId ? levels.find((l) => l.id === accessLevelId) : undefined;
    const canView = (mod: string) => !accessLevelId || !level || !!level.permissions.find((p) => p.module === mod)?.access;
    return [...ALL_PAYROLL_DATASETS, ...ALL_REPORTS].filter((r) => canView(r.permission) && reportInCountry(r, ctx));
  }, [accessLevelId, levels, ctx]);

  const openId = search.get("report");
  const [spec, setSpec] = useState<ReportSpec | null>(null);
  const [seeded, setSeeded] = useState<string | null>(null);
  // Load the report named in the URL, or start a blank one on the first dataset.
  if (datasets.length && seeded !== (openId ?? "__new__")) {
    const found = openId ? saved.find((r) => r.id === openId) : undefined;
    setSeeded(openId ?? "__new__");
    setSpec(found ? { ...found } : blankSpec(datasets[0].id, me));
  }

  const def = datasets.find((d) => d.id === spec?.datasetId);
  const fields = useMemo(() => (def ? fieldsFor(def, datasets, ctx, spec?.calculated) : []), [def, datasets, ctx, spec?.calculated]);
  const rows = useMemo(() => (bundle && def ? def.select(bundle, ctx) : []), [bundle, def, ctx]);
  const isPayroll = def?.joinGroup === "payroll";
  const months = useMemo(() => (isPayroll ? [...new Set((rows as PayrollFact[]).map((r) => `${r.p.period.year}-${String(r.p.period.month).padStart(2, "0")}`))].sort() : []), [rows, isPayroll]);

  const result = useMemo(
    () =>
      spec && def
        ? runSpec(spec, rows, fields, {
            canSeeIdentifiers: canIdentifiers,
            canSeeBank: canBank,
            monthOf: isPayroll ? (r) => { const p = (r as PayrollFact).p; return `${p.period.year}-${String(p.period.month).padStart(2, "0")}`; } : undefined,
          })
        : null,
    [spec, def, rows, fields, canIdentifiers, canBank, isPayroll],
  );

  const [q, setQ] = useState("");
  const [related, setRelated] = useState(true);
  const [calcDraft, setCalcDraft] = useState<{ label: string; formula: string; type: CalculatedField["type"] }>({ label: "", formula: "", type: "money" });
  const calcCheck = calcDraft.formula.trim() ? parseFormula(calcDraft.formula, fields) : null;
  const [showArchived, setShowArchived] = useState(false);

  if (loading || payrollLoading || !bundle || !spec) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  const set = (patch: Partial<ReportSpec>) => setSpec((s) => (s ? { ...s, ...patch } : s));
  const selected = new Set(spec.columns.map((c) => c.key));
  const fieldByKey = new Map(fields.map((f) => [f.key, f]));
  const numeric = (f?: StudioField) => !!f && (f.type === "money" || f.type === "number" || f.type === "percent");
  const needle = q.trim().toLowerCase();
  const shownFields = fields.filter((f) => (related || f.dataset === def?.label || f.calculated) && (!needle || `${f.label} ${f.description ?? ""} ${f.section ?? ""}`.toLowerCase().includes(needle)));
  const sections = [...new Set(shownFields.map((f) => `${f.dataset}§${f.section ?? "Fields"}`))];
  const mine = saved.filter((r) => r.status === (showArchived ? "archived" : "active"));
  const canDelete = (r: ReportSpec) => canManageAll || r.ownerId === me.id || r.owner === me.name;
  const toggle = (key: string) => set({ columns: selected.has(key) ? spec.columns.filter((c) => c.key !== key) : [...spec.columns, { key }] });
  const move = (i: number, d: -1 | 1) => {
    const cols = [...spec.columns];
    const j = i + d;
    if (j < 0 || j >= cols.length) return;
    [cols[i], cols[j]] = [cols[j], cols[i]];
    set({ columns: cols });
  };

  const exportResult = (format: ExportFormat) => {
    if (!result || !result.columns.length) return toast.error("Choose at least one field first.");
    const name = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom-report";
    writeTable(name, spec.name.slice(0, 31), {
      preamble: [[spec.name], [`Dataset: ${def?.label ?? ""}`, `Generated ${new Date().toLocaleString("en-GB")} by ${me.name}`], ...(result.maskedFields.length ? [[`Restricted fields masked for this user: ${result.maskedFields.join(", ")}`]] : []), []],
      headers: result.columns.map((c) => c.label),
      data: result.rows,
      trailer: [result.totals],
    }, format);
    dispatch(logStudioRun({ reportId: spec.id, reportName: spec.name, by: me.name, action: "export", format, rows: result.rowCount, masked: result.maskedFields }));
  };

  const save = (asTemplate = false) => {
    if (!spec.name.trim()) return toast.error("Name the report first.");
    if (!spec.columns.length) return toast.error("Choose at least one field.");
    const toSave = asTemplate ? { ...spec, id: uid("TPL"), template: true, name: `${spec.name} (template)`, schedule: null } : spec;
    dispatch(saveReport({ spec: toSave, by: me.name }));
    toast.success(asTemplate ? "Saved as a template" : "Report saved", { description: toSave.schedule ? `Delivered ${toSave.schedule.frequency} to ${toSave.schedule.recipients.length} recipient(s) from ${toSave.schedule.nextRun}.` : "It reruns on live data every time you open it." });
    if (!asTemplate) router.replace(`?report=${toSave.id}`);
  };

  const fromTemplate = (t: Omit<ReportSpec, "id" | "owner" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const s: ReportSpec = { ...t, id: uid("RPT"), template: false, owner: me.name, ownerId: me.id, createdAt: now, updatedAt: now };
    setSeeded("__template__");
    setSpec(s);
    router.replace("?");
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/operations/reports" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Reports
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            <Wand2 className="h-5 w-5 text-primary" /> MOTEE Report Studio
          </h1>
          <p className="text-xs text-muted-foreground">Combine HR, payroll, pension and finance data in one report. Every field is documented; restricted fields are masked unless you may see them.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select onValueChange={(v) => { const t = [...STARTER_TEMPLATES, ...saved.filter((r) => r.template)].find((x) => x.name === v); if (t) fromTemplate(t); }}>
            <SelectTrigger size="sm" className="h-8 w-48 text-xs"><BookCopy className="mr-1 h-3.5 w-3.5" /><SelectValue placeholder="Start from a template" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-[10px]">MOTEE templates</SelectLabel>
                {STARTER_TEMPLATES.filter((t) => datasets.some((d) => d.id === t.datasetId)).map((t) => <SelectItem key={t.name} value={t.name} className="text-xs">{t.name}</SelectItem>)}
              </SelectGroup>
              {saved.some((r) => r.template) && (
                <SelectGroup>
                  <SelectLabel className="text-[10px]">Your templates</SelectLabel>
                  {saved.filter((r) => r.template).map((t) => <SelectItem key={t.id} value={t.name} className="text-xs">{t.name}</SelectItem>)}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setSeeded("__blank__"); setSpec(blankSpec(spec.datasetId, me)); router.replace("?"); }}><Plus className="h-3.5 w-3.5" /> New</Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => save(true)}><FileStack className="h-3.5 w-3.5" /> Save as template</Button>
          <Button size="sm" className="gap-1.5" onClick={() => save()}><Save className="h-3.5 w-3.5" /> Save</Button>
          <DownloadMenu onDownload={exportResult} label="Export" disabled={!result?.columns.length} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* ── Left: report, dataset, field dictionary ── */}
        <div className="flex flex-col gap-4">
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="space-y-1">
              <Label className="text-xs">Report name</Label>
              <Input className="h-8 text-sm" value={spec.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea className="min-h-12 text-xs" value={spec.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder="What this report answers" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Base dataset</Label>
              <Select value={spec.datasetId} onValueChange={(v) => set({ datasetId: v, columns: [], filters: [], groupBy: undefined, sort: undefined, calculated: [], monthFrom: undefined, monthTo: undefined })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {groupDatasets(datasets).map(([g, list]) => (
                    <SelectGroup key={g}>
                      <SelectLabel className="text-[10px]">{g}</SelectLabel>
                      {list.map((d) => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              {def && <p className="text-[11px] text-muted-foreground">{def.description} {def.grain && <span className="block italic">{def.grain}.</span>}</p>}
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            <div className="space-y-2 border-b p-3">
              <p className="text-sm font-semibold">Fields <span className="text-xs font-normal text-muted-foreground">· {fields.length} available</span></p>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input className="h-8 pl-7 text-xs" placeholder="Search fields and descriptions" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              {def?.joinGroup && (
                <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Checkbox checked={related} onCheckedChange={(v) => setRelated(!!v)} /> Include fields from the related payroll datasets (joined on employee + period)
                </label>
              )}
            </div>
            <div className="max-h-[560px] overflow-y-auto p-2">
              {sections.map((sec) => {
                const [ds, name] = sec.split("§");
                return (
                  <div key={sec} className="mb-2">
                    <p className="sticky top-0 bg-card px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{name}{ds !== def?.label && <span className="normal-case tracking-normal"> · {ds}</span>}</p>
                    {shownFields.filter((f) => `${f.dataset}§${f.section ?? "Fields"}` === sec).map((f) => {
                      const restricted = !!f.sensitive && (f.sensitive === "bank" ? !canBank : !canIdentifiers);
                      return (
                        <label key={f.key} className="group flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-xs hover:bg-muted/50" title={`${f.description ?? ""}${f.source ? `\nSource: ${f.source}` : ""}${f.sensitive ? `\nRestricted (${f.sensitive === "bank" ? "bank details" : "identifier"})` : ""}`}>
                          <Checkbox className="mt-0.5" checked={selected.has(f.key)} onCheckedChange={() => toggle(f.key)} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1">
                              <span className="truncate">{f.label}</span>
                              {f.sensitive && <Lock className={cn("h-3 w-3 shrink-0", restricted ? "text-rose-500" : "text-muted-foreground")} />}
                            </span>
                            {f.description && <span className="hidden text-[10px] leading-snug text-muted-foreground group-hover:block">{f.description}{f.source ? ` · ${f.source}` : ""}</span>}
                          </span>
                          <span className="shrink-0 rounded bg-muted px-1 text-[9px] text-muted-foreground">{TYPE_BADGE[f.type]}</span>
                        </label>
                      );
                    })}
                  </div>
                );
              })}
              {!shownFields.length && <p className="p-4 text-center text-xs text-muted-foreground">No fields match.</p>}
            </div>
          </div>
        </div>

        {/* ── Right: design + preview ── */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Columns */}
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">Columns <span className="text-xs font-normal text-muted-foreground">· rename, reorder, aggregate</span></p>
              <ul className="mt-2 space-y-1.5">
                {spec.columns.map((c, i) => {
                  const f = fieldByKey.get(c.key);
                  return (
                    <li key={c.key} className="flex items-center gap-1.5">
                      <div className="flex flex-col">
                        <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-3 w-3" /></button>
                        <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === spec.columns.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-3 w-3" /></button>
                      </div>
                      <Input className="h-7 flex-1 text-xs" value={c.label ?? f?.label ?? c.key} onChange={(e) => set({ columns: spec.columns.map((x) => (x.key === c.key ? { ...x, label: e.target.value } : x)) })} />
                      {spec.groupBy && numeric(f) && (
                        <Select value={spec.aggregates?.[c.key] ?? (f?.type === "percent" ? "avg" : "sum")} onValueChange={(v) => set({ aggregates: { ...spec.aggregates, [c.key]: v as Aggregate } })}>
                          <SelectTrigger size="sm" className="h-7 w-20 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{(["sum", "avg", "count", "min", "max"] as Aggregate[]).map((a) => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                      <button type="button" onClick={() => toggle(c.key)} className="text-muted-foreground hover:text-rose-600" aria-label="Remove column"><X className="h-3.5 w-3.5" /></button>
                    </li>
                  );
                })}
                {!spec.columns.length && <li className="py-3 text-center text-xs text-muted-foreground">Tick fields on the left to add them.</li>}
              </ul>
            </div>

            {/* Filters */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Filters</p>
                <div className="grid grid-cols-2 gap-0.5 rounded-md bg-muted p-0.5 text-[11px]">
                  {(["all", "any"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => set({ match: m })} className={cn("rounded px-2 py-0.5", spec.match === m && "bg-card font-medium shadow-sm")}>{m === "all" ? "AND" : "OR"}</button>
                  ))}
                </div>
              </div>
              {isPayroll && months.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["monthFrom", "monthTo"] as const).map((k) => (
                    <Select key={k} value={spec[k] ?? NONE} onValueChange={(v) => set({ [k]: v === NONE ? undefined : v })}>
                      <SelectTrigger size="sm" className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE} className="text-xs">{k === "monthFrom" ? "From: first month" : "To: latest month"}</SelectItem>
                        {months.map((m) => <SelectItem key={m} value={m} className="text-xs">{k === "monthFrom" ? "From " : "To "}{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
              )}
              <ul className="mt-2 space-y-1.5">
                {spec.filters.map((flt, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Select value={flt.field} onValueChange={(v) => set({ filters: spec.filters.map((x, j) => (j === i ? { ...x, field: v } : x)) })}>
                      <SelectTrigger size="sm" className="h-7 min-w-0 flex-1 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{fields.map((f) => <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={flt.op} onValueChange={(v) => set({ filters: spec.filters.map((x, j) => (j === i ? { ...x, op: v as FilterOp } : x)) })}>
                      <SelectTrigger size="sm" className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(FILTER_OP_LABELS) as FilterOp[]).map((o) => <SelectItem key={o} value={o} className="text-xs">{FILTER_OP_LABELS[o]}</SelectItem>)}</SelectContent>
                    </Select>
                    {flt.op !== "empty" && flt.op !== "not_empty" && <Input className="h-7 w-28 text-[11px]" value={flt.value} onChange={(e) => set({ filters: spec.filters.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />}
                    <button type="button" onClick={() => set({ filters: spec.filters.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-rose-600" aria-label="Remove filter"><X className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="ghost" className="mt-1 h-7 gap-1 text-[11px]" disabled={!fields.length} onClick={() => set({ filters: [...spec.filters, { field: fields.find((f) => f.key === "department")?.key ?? fields[0].key, op: "eq", value: "" }] })}><Plus className="h-3 w-3" /> Add filter</Button>
            </div>

            {/* Group, sort, output */}
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">Group, sort &amp; output</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Group by</Label>
                  <Select value={spec.groupBy ?? NONE} onValueChange={(v) => set({ groupBy: v === NONE ? undefined : v, output: v === NONE && spec.output !== "table" ? "table" : v !== NONE && spec.output === "table" ? "summary" : spec.output })}>
                    <SelectTrigger size="sm" className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-xs">No grouping</SelectItem>
                      {fields.filter((f) => !numeric(f)).map((f) => <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Sort by</Label>
                  <div className="flex gap-1">
                    <Select value={spec.sort?.key ?? NONE} onValueChange={(v) => set({ sort: v === NONE ? undefined : { key: v, dir: spec.sort?.dir ?? "desc" } })}>
                      <SelectTrigger size="sm" className="h-7 min-w-0 flex-1 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE} className="text-xs">Default order</SelectItem>
                        {fields.map((f) => <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {spec.sort && <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => set({ sort: { ...spec.sort!, dir: spec.sort!.dir === "asc" ? "desc" : "asc" } })}>{spec.sort.dir === "asc" ? "↑" : "↓"}</Button>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {OUTPUTS.map((o) => (
                  <button key={o.key} type="button" onClick={() => set({ output: o.key, groupBy: o.key === "table" ? spec.groupBy : spec.groupBy ?? fields.find((f) => f.key === "department")?.key })} className={cn("rounded-md border px-2 py-1.5 text-left text-[11px]", spec.output === o.key ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                    <span className="block font-medium">{o.label}</span>
                    <span className="text-[10px] text-muted-foreground">{o.hint}</span>
                  </button>
                ))}
              </div>
              {spec.output === "chart" && (
                <Select value={spec.chartMeasure ?? NONE} onValueChange={(v) => set({ chartMeasure: v === NONE ? undefined : v })}>
                  <SelectTrigger size="sm" className="h-7 text-[11px]"><SelectValue placeholder="Measure to chart" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE} className="text-xs">Records per group</SelectItem>
                    {spec.columns.filter((c) => numeric(fieldByKey.get(c.key))).map((c) => <SelectItem key={c.key} value={c.key} className="text-xs">{c.label ?? fieldByKey.get(c.key)?.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Calculated fields */}
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><Sigma className="h-4 w-4 text-primary" /> Calculated fields</p>
              <ul className="space-y-1 text-xs">
                {spec.calculated.map((c) => (
                  <li key={c.key} className="flex items-center justify-between gap-2 rounded bg-muted/50 px-2 py-1">
                    <span className="min-w-0"><span className="font-medium">{c.label}</span> <span className="block truncate font-mono text-[10px] text-muted-foreground">{c.formula}</span></span>
                    <span className="flex shrink-0 items-center gap-1">
                      <Checkbox checked={selected.has(c.key)} onCheckedChange={() => toggle(c.key)} aria-label="Show as a column" />
                      <button type="button" onClick={() => set({ calculated: spec.calculated.filter((x) => x.key !== c.key), columns: spec.columns.filter((x) => x.key !== c.key) })} className="text-muted-foreground hover:text-rose-600" aria-label="Delete"><X className="h-3.5 w-3.5" /></button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-[1fr_90px] gap-1.5">
                <Input className="h-7 text-[11px]" placeholder="Name, e.g. Employer cost %" value={calcDraft.label} onChange={(e) => setCalcDraft({ ...calcDraft, label: e.target.value })} />
                <Select value={calcDraft.type} onValueChange={(v) => setCalcDraft({ ...calcDraft, type: v as CalculatedField["type"] })}>
                  <SelectTrigger size="sm" className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{(["money", "number", "percent"] as const).map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input className="h-7 font-mono text-[11px]" placeholder="[Total Employer Contributions] / [Gross Pay] * 100" value={calcDraft.formula} onChange={(e) => setCalcDraft({ ...calcDraft, formula: e.target.value })} />
              {calcCheck && <p className={cn("text-[10px]", calcCheck.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600")}>{calcCheck.ok ? `Valid — uses ${calcCheck.refs.length} field${calcCheck.refs.length === 1 ? "" : "s"}` : calcCheck.error}</p>}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                disabled={!calcDraft.label.trim() || !calcCheck?.ok}
                onClick={() => {
                  const key = `calc:${Date.now().toString(36)}`;
                  set({ calculated: [...spec.calculated, { key, label: calcDraft.label.trim(), formula: calcDraft.formula.trim(), type: calcDraft.type }], columns: [...spec.columns, { key }] });
                  setCalcDraft({ label: "", formula: "", type: "money" });
                }}
              >
                Add calculated field
              </Button>
              <p className="text-[10px] text-muted-foreground">Use field names in square brackets with + − × ÷ and brackets. Only numeric fields; division by zero shows 0.</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
            <p className="flex w-full items-center gap-1.5 text-sm font-semibold"><CalendarClock className="h-4 w-4 text-primary" /> Scheduled delivery</p>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Frequency</Label>
              <Select value={spec.schedule?.frequency ?? NONE} onValueChange={(v) => set({ schedule: v === NONE ? null : { frequency: v as Frequency, recipients: spec.schedule?.recipients ?? [], format: spec.schedule?.format ?? "xlsx", nextRun: nextRunOf(v as Frequency) } })}>
                <SelectTrigger size="sm" className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE} className="text-xs">Not scheduled</SelectItem>
                  {FREQUENCIES.map((fq) => <SelectItem key={fq} value={fq} className="text-xs capitalize">{fq}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {spec.schedule && (
              <>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Format</Label>
                  <Select value={spec.schedule.format} onValueChange={(v) => set({ schedule: { ...spec.schedule!, format: v as "xlsx" } })}>
                    <SelectTrigger size="sm" className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{(["xlsx", "csv", "pdf"] as const).map((x) => <SelectItem key={x} value={x} className="text-xs uppercase">{x}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="min-w-56 flex-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Add a recipient (authorised users only)</Label>
                  <EmployeePicker value={undefined} onChange={(e) => e && !spec.schedule!.recipients.some((r) => r.id === e.id) && set({ schedule: { ...spec.schedule!, recipients: [...spec.schedule!.recipients, { id: e.id, name: e.name }] } })} />
                </div>
                <div className="flex w-full flex-wrap items-center gap-1.5">
                  {spec.schedule.recipients.map((r) => (
                    <Badge key={r.id} variant="outline" className="gap-1">{r.name}<button type="button" onClick={() => set({ schedule: { ...spec.schedule!, recipients: spec.schedule!.recipients.filter((x) => x.id !== r.id) } })} aria-label={`Remove ${r.name}`}><X className="h-3 w-3" /></button></Badge>
                  ))}
                  <span className="text-[11px] text-muted-foreground">Next delivery {spec.schedule.nextRun}. Each recipient&apos;s own field access is applied when it runs — restricted fields arrive masked for anyone not allowed to see them.</span>
                </div>
              </>
            )}
          </div>

          {/* Live preview */}
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold"><Eye className="h-4 w-4 text-primary" /> Live preview</p>
                <p className="text-[11px] text-muted-foreground">
                  {result ? `${result.matched.toLocaleString()} matching record${result.matched === 1 ? "" : "s"}${result.grouped ? ` in ${result.rowCount} group${result.rowCount === 1 ? "" : "s"}` : ""}` : "—"} · exports match this preview exactly
                </p>
              </div>
              {result && result.maskedFields.length > 0 && (
                <p className="flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-[11px] text-rose-700 dark:text-rose-300"><Lock className="h-3 w-3" /> Masked for you: {result.maskedFields.join(", ")}</p>
              )}
            </div>
            {!result || !result.columns.length ? (
              <p className="px-4 py-16 text-center text-sm text-muted-foreground">Choose fields to see the report.</p>
            ) : spec.output === "kpi" ? (
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi label="Records" value={result.matched.toLocaleString()} />
                {result.columns.map((c, i) => (typeof result.totals[i] === "number" && i > 0 ? <Kpi key={c.key} label={c.label} value={fmtCell(result.totals[i], c.type) as string} /> : null))}
              </div>
            ) : spec.output === "chart" && result.grouped ? (
              <div className="p-4">
                <BarList
                  rows={result.rows.map((r) => {
                    const idx = spec.chartMeasure ? result.columns.findIndex((c) => c.key === spec.chartMeasure) : 1;
                    return { label: String(r[0]), value: Number(r[idx >= 0 ? idx : 1]) || 0, sub: `${r[1]} records` };
                  })}
                  format={(n) => (spec.chartMeasure && fieldByKey.get(spec.chartMeasure)?.type === "money" ? fmtMoney(n) : n.toLocaleString("en-NG"))}
                />
              </div>
            ) : (
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full text-xs tabular-nums">
                  <thead className="sticky top-0 bg-muted text-muted-foreground">
                    <tr>{result.columns.map((c) => <th key={c.key} className={cn("whitespace-nowrap px-3 py-2 font-medium", c.type === "money" || c.type === "number" || c.type === "percent" ? "text-right" : "text-left")}>{c.label}{c.masked && <Lock className="ml-1 inline h-3 w-3" />}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.rows.slice(0, PREVIEW_ROWS).map((r, i) => (
                      <tr key={i} className="border-t">
                        {r.map((v, j) => <td key={j} className={cn("whitespace-nowrap px-3 py-1.5", typeof v === "number" && "text-right")}>{fmtCell(v, result.columns[j].type)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-muted font-semibold">
                    <tr>{result.totals.map((v, j) => <td key={j} className={cn("whitespace-nowrap px-3 py-1.5", typeof v === "number" && "text-right")}>{v === "" ? "" : fmtCell(v, result.columns[j]?.type ?? "text")}</td>)}</tr>
                  </tfoot>
                </table>
                {result.rows.length > PREVIEW_ROWS && <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">Showing the first {PREVIEW_ROWS} of {result.rows.length.toLocaleString()} rows — the export has them all.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved reports */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Saved reports</p>
            <p className="text-[11px] text-muted-foreground">Reusable across periods: each run reads live data. Deleting needs ownership or Reports edit access.</p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => setShowArchived((x) => !x)}>{showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{showArchived ? "Show active" : "Show archived"}</Button>
        </div>
        <ul className="divide-y text-xs">
          {mine.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
              <Link href={`?report=${r.id}`} className="min-w-0 hover:text-primary">
                <span className="font-medium">{r.name}</span> {r.template && <Badge variant="outline" className="ml-1 text-[9px]">Template</Badge>} {r.schedule && <Badge variant="outline" className="ml-1 gap-1 text-[9px]"><CalendarClock className="h-2.5 w-2.5" /> {r.schedule.frequency}</Badge>}
                <span className="block text-[10px] text-muted-foreground">{datasets.find((d) => d.id === r.datasetId)?.label ?? r.datasetId} · {r.columns.length} columns · by {r.owner} · updated {new Date(r.updatedAt).toLocaleDateString("en-GB")}</span>
              </Link>
              <RowActions
                label={`${r.name} actions`}
                actions={[
                  { label: "Open", icon: Eye, href: `?report=${r.id}` },
                  { label: "Duplicate", icon: Copy, onSelect: () => dispatch(duplicateReport({ id: r.id, newId: uid("RPT"), by: me.name, byId: me.id })) },
                  { label: "Save as template", icon: FileStack, onSelect: () => dispatch(duplicateReport({ id: r.id, newId: uid("TPL"), by: me.name, byId: me.id, asTemplate: true })) },
                  r.status === "active"
                    ? { label: "Archive", icon: Archive, onSelect: () => dispatch(setReportStatus({ id: r.id, status: "archived", by: me.name })), separated: true }
                    : { label: "Restore", icon: ArchiveRestore, onSelect: () => dispatch(setReportStatus({ id: r.id, status: "active", by: me.name })), separated: true },
                  { label: "Delete", icon: Trash2, tone: "danger", disabled: !canDelete(r), onSelect: () => { dispatch(deleteReport({ id: r.id, by: me.name })); toast.success(`Deleted ${r.name}`); if (spec.id === r.id) router.replace("?"); } },
                ]}
              />
            </li>
          ))}
          {!mine.length && <li className="px-4 py-6 text-center text-muted-foreground">{showArchived ? "Nothing archived." : "No saved reports yet. Build one above and press Save."}</li>}
        </ul>
        {log.length > 0 && (
          <details className="border-t px-4 py-2 text-[11px]">
            <summary className="cursor-pointer text-muted-foreground">Audit trail ({log.length})</summary>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {log.slice(0, 60).map((l) => (
                <li key={l.id} className="flex justify-between gap-3">
                  <span><span className="font-medium">{l.by}</span> {l.action} “{l.reportName}”{l.format ? ` as ${l.format.toUpperCase()}` : ""}{l.rows !== undefined ? ` · ${l.rows} rows` : ""}{l.masked?.length ? ` · masked: ${l.masked.join(", ")}` : ""}</span>
                  <span className="shrink-0 text-muted-foreground">{new Date(l.at).toLocaleString("en-GB")}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Payroll figures are read from final payslips as they were issued — rates and amounts from that period, never recalculated with today&apos;s rules. Pay elements you create appear as fields automatically. Plain-language report requests (&ldquo;describe a report&rdquo;) are planned for a later phase.
      </p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function groupDatasets(list: AnyReportDef[]): [string, AnyReportDef[]][] {
  const m = new Map<string, AnyReportDef[]>();
  for (const d of list) m.set(d.group, [...(m.get(d.group) ?? []), d]);
  return [...m.entries()];
}
