"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Eye, Filter, Search, SearchCheck, TriangleAlert, UserRound, Wallet, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import {
  COMPONENT_ROWS,
  KIND_LABELS,
  NATURE_LABELS,
  REASON_LABELS,
  REASON_NATURE,
  REASON_ORDER,
  SOURCE_LABELS,
  compareRuns,
  defaultPreviousRun,
  type EmployeeVariance,
  type ReasonNature,
  type TotalsLine,
  type VarianceReason,
} from "@/src/lib/payroll/comparison";
import { writeTable, type ExportFormat } from "@/src/lib/payroll/exports";
import { comparisonCtxOf, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { PayrollRun } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { WaterfallChart, compactNaira } from "./components/charts";
import { NotSupported, RunStatusBadge, fmtDate, money, pctArrow } from "./components/shared";
import { InvestigationsPanel, RaiseInvestigationDialog, type InvestigationDraft } from "./investigations";
import { VarianceSummary } from "./variance-summary";
import { PayrollCycle } from "./components/payroll-cycle";
import { DetailModal, DownloadMenu, RowActions } from "./components/row-actions";

const signed = (n: number, dp = 2) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n), dp)}`;

const REASON_TONE: Record<VarianceReason, string> = {
  joiner: "bg-emerald-500/12 text-emerald-700",
  leaver: "bg-rose-500/12 text-rose-700",
  salary_change: "bg-violet-500/12 text-violet-700",
  proration: "bg-sky-500/12 text-sky-700",
  overtime: "bg-amber-500/14 text-amber-800",
  attendance: "bg-orange-500/12 text-orange-700",
  one_off: "bg-fuchsia-500/12 text-fuchsia-700",
  expenses: "bg-teal-500/12 text-teal-700",
  other: "bg-muted text-muted-foreground",
};

const NATURE_TONE: Record<ReasonNature, string> = {
  recurring: "border-violet-500/40 text-violet-700 dark:text-violet-300",
  non_recurring: "border-border text-muted-foreground",
  unclassified: "border-amber-500/50 text-amber-800 dark:text-amber-300",
};

type SortKey = "abs" | "increase" | "decrease" | "name";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "abs", label: "Largest change" },
  { key: "increase", label: "Largest increase" },
  { key: "decrease", label: "Largest decrease" },
  { key: "name", label: "Name A–Z" },
];
const ALL = "__all__";

/**
 * `/time-payroll/payroll/compare?current=…&previous=…` — this month's payroll
 * against last month's: the intelligence summary, a waterfall from one gross
 * to the other, totals and pay components side by side, and every employee
 * whose pay changed with the transactions and sources behind it.
 */
export function RunComparePage() {
  const router = useRouter();
  const search = useSearchParams();
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const [reason, setReason] = useState<VarianceReason | "all">((search.get("reason") as VarianceReason) ?? "all");
  const [dept, setDept] = useState(ALL);
  const [cc, setCc] = useState(ALL);
  const [sort, setSort] = useState<SortKey>("abs");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<InvestigationDraft | null>(null);
  const [empDetail, setEmpDetail] = useState<EmployeeVariance | null>(null);
  const [reasonDetail, setReasonDetail] = useState<VarianceReason | null>(null);

  const runs = useMemo(
    () => [...(data?.runs ?? [])].filter((r) => r.employees.some((e) => e.computation)).sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month) || b.createdAt.localeCompare(a.createdAt)),
    [data],
  );
  const current = runs.find((r) => r.id === search.get("current")) ?? runs.find((r) => r.type === "regular") ?? null;
  const previous = (current && (runs.find((r) => r.id === search.get("previous") && r.id !== current.id) ?? defaultPreviousRun(runs, current))) || null;
  const cmp = useMemo(() => (current && previous && data && bundle ? compareRuns(current, previous, comparisonCtxOf(data, bundle)) : null), [current, previous, data, bundle]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data) return <Skeleton className="h-150 w-full rounded-xl" />;

  const pickRun = (k: "current" | "previous", id: string) => {
    const p = new URLSearchParams(search.toString());
    p.set(k, id);
    if (k === "current") p.delete("previous");
    router.replace(`?${p.toString()}`);
  };

  const exportTable = (format: ExportFormat) => {
    if (!cmp) return;
    const headers = ["Employee ID", "Name", "Department", "Cost centre", `Gross ${cmp.previous.title}`, `Gross ${cmp.current.title}`, "Change", "Change %", ...REASON_ORDER.map((r) => REASON_LABELS[r]), "Explanation", "Movements (element · kind · source)", "Unexplained"];
    const rows = cmp.employees.map((e) => [
      e.employeeNumber,
      e.name,
      e.department,
      e.costCentre,
      e.previousGross ?? "",
      e.currentGross ?? "",
      e.change,
      e.pct ?? "",
      ...REASON_ORDER.map((r) => e.reasons[r] ?? ""),
      e.explanation,
      e.movements.map((m) => `${m.name} · ${KIND_LABELS[m.kind]} · ${SOURCE_LABELS[m.source.type]}${m.source.ref ? ` (${m.source.ref})` : ""}`).join("; "),
      e.unexplained || "",
    ]);
    const summary = cmp.totals.map((t) => [t.label, "", "", "", t.previous, t.current, t.change, t.pct ?? ""]);
    const components = cmp.componentTotals.map((t) => [t.label, "", "", "", t.previous, t.current, t.change, t.pct ?? ""]);
    const r = cmp.reconciliation;
    writeTable(
      `payroll-comparison-${cmp.current.period.year}-${String(cmp.current.period.month).padStart(2, "0")}`,
      "Comparison",
      {
        headers,
        data: rows,
        preamble: [
          ["Summary"],
          ...summary,
          [],
          ["Pay components"],
          ...components,
          [],
          ["Reconciliation", "", "", "", r.opening, r.closing, r.change, r.balanced ? "Balanced" : `Unreconciled ${r.difference}`],
          [],
        ],
      },
      format,
    );
    actions.logExport(cmp.current.id, `Payroll comparison against ${cmp.previous.title} (${format.toUpperCase()})`);
    toast.success("Comparison downloaded");
  };

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Payroll
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Payroll comparison</h1>
        <p className="text-xs text-muted-foreground">What changed, why it changed, who it affected, and whether every naira is accounted for.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RunPicker label="Compare" runs={runs} value={current?.id} onChange={(id) => pickRun("current", id)} />
        <span className="text-xs text-muted-foreground">against</span>
        <RunPicker label="Previous" runs={runs.filter((r) => r.id !== current?.id)} value={previous?.id} onChange={(id) => pickRun("previous", id)} />
        {cmp && (
          <DownloadMenu onDownload={exportTable} />
        )}
      </div>
    </div>
  );

  if (!cmp || !current || !previous) {
    return (
      <div className="flex flex-col gap-5 pb-10">
        {header}
        <p className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">There&apos;s no earlier run to compare against yet.</p>
      </div>
    );
  }

  const gross = cmp.totals.find((t) => t.key === "gross")!;
  const rec = cmp.reconciliation;
  const bridgeMax = Math.max(1, ...cmp.bridge.map((b) => Math.abs(b.amount)));
  const changed = cmp.employees.filter((e) => Math.abs(e.change) >= 0.005);
  const departments = [...new Set(changed.map((e) => e.department))].sort();
  const costCentres = [...new Set(changed.map((e) => e.costCentre))].sort();
  const needle = q.trim().toLowerCase();
  const shownEmployees = changed
    .filter(
      (e) =>
        (reason === "all" || e.reasons[reason] !== undefined) &&
        (dept === ALL || e.department === dept) &&
        (cc === ALL || e.costCentre === cc) &&
        (!needle || `${e.name} ${e.employeeNumber} ${e.employeeId}`.toLowerCase().includes(needle)),
    )
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "increase" ? b.change - a.change : sort === "decrease" ? a.change - b.change : Math.abs(b.change) - Math.abs(a.change)));
  const unchanged = cmp.employees.length - changed.length;
  const toggleReason = (r: string) => setReason((x) => (x === r ? "all" : (r as VarianceReason)));

  const investigate = (e: EmployeeVariance | null, r?: VarianceReason) => {
    const amount = e ? (r ? e.reasons[r] ?? e.change : e.change) : r ? cmp.bridge.find((b) => b.reason === r)?.amount ?? 0 : rec.unexplained;
    setDraft({
      runId: current.id,
      previousRunId: previous.id,
      periodLabel: current.period.label,
      employeeId: e?.employeeId,
      employeeName: e?.name,
      reason: r,
      amount,
      title: e ? `${e.name}: ${r ? REASON_LABELS[r] : "gross pay"} ${amount < 0 ? "down" : "up"} ${compactNaira(Math.abs(amount))}` : `${r ? REASON_LABELS[r] : "Unclassified movements"} — ${current.period.label}`,
      finding: e ? e.explanation : r ? `${REASON_LABELS[r]}: ${signed(amount)} across ${cmp.bridge.find((b) => b.reason === r)?.employees ?? 0} employees.` : `${money(Math.abs(rec.unexplained))} across ${rec.unexplainedEmployees} employees has no confirmed source.`,
    });
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      {header}
      <PayrollCycle current="analyse" />

      <VarianceSummary cmp={cmp} investigations={data.investigations} onInvestigateUnclassified={() => investigate(null)} />

      {/* Headline */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Headline title={`Gross pay · ${previous.title}`} value={money(gross.previous)} badge={<RunStatusBadge status={previous.status} />} />
        <Headline title={`Gross pay · ${current.title}`} value={money(gross.current)} badge={<RunStatusBadge status={current.status} />} />
        <Headline
          title="Variance"
          value={signed(gross.change)}
          sub={`${pctArrow(gross.pct, 2)} · ${changed.length} employees changed, ${unchanged} unchanged`}
          tone={gross.change > 0 ? "up" : gross.change < 0 ? "down" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Waterfall */}
        <div className="rounded-xl border bg-card p-4 lg:col-span-3">
          <p className="text-sm font-semibold">How {previous.period.label} payroll became {current.period.label}</p>
          <p className="mb-3 text-[11px] text-muted-foreground">Every movement is accounted for, so the closing bar always equals the payroll register. Click a movement to see who.</p>
          <WaterfallChart
            bars={cmp.waterfall.map((w) => ({ ...w, label: w.type === "total" ? `${w.label} gross` : w.label, sub: w.employees ? `${w.employees} employee${w.employees === 1 ? "" : "s"}` : undefined }))}
            selected={reason === "all" ? null : reason}
            onSelect={toggleReason}
          />
        </div>

        {/* Bridge */}
        <div className="flex flex-col rounded-xl border bg-card p-4 lg:col-span-2">
          <p className="text-sm font-semibold">Why gross pay moved</p>
          <p className="text-[11px] text-muted-foreground">From {previous.period.label} to {current.period.label}. Click a reason to see who.</p>
          <div className="mt-4 flex flex-1 flex-col gap-2 text-xs">
            <BridgeRow label={`${previous.title} gross`} value={money(gross.previous)} strong />
            {cmp.bridge.map((b) => (
              <div key={b.reason} className="flex items-start gap-1">
              <button
                type="button"
                onClick={() => toggleReason(b.reason)}
                className={cn("grid flex-1 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-1.5 text-left transition hover:bg-muted/60", reason === b.reason && "bg-muted")}
              >
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", REASON_TONE[b.reason])}>{REASON_LABELS[b.reason]}</span>
                  <span className={cn("rounded border px-1 py-px text-[9px] font-medium uppercase tracking-wide", NATURE_TONE[b.nature])}>{NATURE_LABELS[b.nature]}</span>
                  <span className="text-[10px] text-muted-foreground">{b.employees} employee{b.employees === 1 ? "" : "s"}</span>
                </span>
                <span className={cn("tabular-nums font-medium", b.amount >= 0 ? "text-emerald-700" : "text-rose-600")}>{signed(b.amount)}</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className={cn("block h-full rounded-full", b.amount >= 0 ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${(Math.abs(b.amount) / bridgeMax) * 100}%` }} />
                </span>
              </button>
              <RowActions
                className="mt-1"
                label={`${REASON_LABELS[b.reason]} actions`}
                actions={[
                  { label: `View the ${b.employees} employee${b.employees === 1 ? "" : "s"}`, icon: Eye, onSelect: () => setReasonDetail(b.reason) },
                  { label: reason === b.reason ? "Clear table filter" : "Filter the table", icon: Filter, onSelect: () => toggleReason(b.reason) },
                  { label: "Investigate this movement", icon: SearchCheck, onSelect: () => investigate(null, b.reason), separated: true },
                ]}
              />
              </div>
            ))}
            {cmp.bridge.length === 0 && <p className="px-2 text-muted-foreground">No change in gross pay.</p>}
            <BridgeRow label={`${current.title} gross`} value={money(gross.current)} strong />
            <div className={cn("mt-auto flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px]", rec.balanced ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : "bg-amber-500/10 text-amber-800 dark:text-amber-300")}>
              {rec.balanced ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" /> : <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />}
              <span>
                {rec.balanced ? "Balanced — the reasons add up to the gross difference to the kobo." : `Unreconciled — ${money(Math.abs(rec.difference))} is not attributed to a reason.`}
                {Math.abs(rec.unexplained) >= 0.005 && ` ${money(Math.abs(rec.unexplained))} has no confirmed source and needs investigation.`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border bg-card">
          <ComparisonTable title="Payroll totals" lines={cmp.totals} previous={previous} current={current} strong={["gross", "net", "totalCost"]} />
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          <ComparisonTable
            title="Pay components — basic to net"
            lines={cmp.componentTotals.filter((l) => l.previous || l.current)}
            previous={previous}
            current={current}
            strong={COMPONENT_ROWS.filter((r) => r.total).map((r) => r.key)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <ComparisonTable title="Earnings by pay element" lines={cmp.earnings} previous={previous} current={current} strong={[]} />
      </div>

      {/* Employees */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Employees whose gross pay changed</p>
            <p className="text-[11px] text-muted-foreground">{shownEmployees.length} shown{reason !== "all" && ` · ${REASON_LABELS[reason]}`} · expand a row for pay components and the transactions behind it</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect value={reason === "all" ? ALL : reason} onChange={(v) => setReason(v === ALL ? "all" : (v as VarianceReason))} allLabel="All reasons" options={cmp.bridge.map((b) => [b.reason, REASON_LABELS[b.reason]])} />
            <FilterSelect value={dept} onChange={setDept} allLabel="All departments" options={departments.map((d) => [d, d])} />
            <FilterSelect value={cc} onChange={setCc} allLabel="All cost centres" options={costCentres.map((c) => [c, c])} />
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger size="sm" className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{SORTS.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-8 w-48 pl-7 text-xs" placeholder="Employee ID or name" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-xs">
            <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
              <tr>
                <th className="w-8 px-2 py-2" />
                <th className="px-3 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 text-right font-medium">{previous.period.label.split(" ")[0]}</th>
                <th className="px-3 py-2 text-right font-medium">{current.period.label.split(" ")[0]}</th>
                <th className="px-3 py-2 text-right font-medium">Variance</th>
                <th className="px-3 py-2 font-medium">Explanation</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {shownEmployees.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No changes to show.</td></tr>
              )}
              {shownEmployees.map((e) => {
                const isOpen = open.has(e.employeeId);
                const toggle = () => setOpen((s) => { const n = new Set(s); if (n.has(e.employeeId)) n.delete(e.employeeId); else n.add(e.employeeId); return n; });
                return (
                  <Fragment key={e.employeeId}>
                    <tr className={cn("border-t align-top", isOpen && "bg-muted/30")}>
                      <td className="px-2 py-2">
                        <button type="button" onClick={toggle} aria-label={isOpen ? "Hide details" : "Show details"} aria-expanded={isOpen} className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`${PAYROLL_HREF}/${current.id}/employees/${e.employeeId}`} className="font-medium hover:text-primary hover:underline">{e.name}</Link>
                        <p className="text-[10px] text-muted-foreground">{e.employeeNumber} · {e.department} · {e.costCentre}</p>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{e.previousGross === null ? "—" : money(e.previousGross)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{e.currentGross === null ? "—" : money(e.currentGross)}</td>
                      <td className={cn("whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums", e.change > 0 ? "text-emerald-700" : "text-rose-600")}>
                        {signed(e.change)}
                        <p className="text-[10px] font-normal text-muted-foreground">{pctArrow(e.pct)}</p>
                      </td>
                      <td className="max-w-[420px] px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {REASON_ORDER.filter((r) => e.reasons[r] !== undefined).map((r) => (
                            <span key={r} className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", REASON_TONE[r])}>
                              {REASON_LABELS[r]} {signed(e.reasons[r]!, 0)}
                            </span>
                          ))}
                        </div>
                        <p className={cn("mt-1 text-[11px]", Math.abs(e.unexplained) >= 0.005 ? "text-amber-800 dark:text-amber-300" : "text-muted-foreground")}>{e.explanation}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <RowActions
                          label={`${e.name} actions`}
                          actions={[
                            { label: "View details", icon: Eye, onSelect: () => setEmpDetail(e) },
                            { label: isOpen ? "Hide transactions" : "Show transactions", icon: ChevronDown, onSelect: toggle },
                            { label: "Pay this month", icon: Wallet, href: `${PAYROLL_HREF}/${current.id}/employees/${e.employeeId}`, separated: true },
                            ...(cmp.employees.some((x) => x.employeeId === e.employeeId && x.previousGross !== null) ? [{ label: `Pay in ${previous.period.label}`, icon: Wallet, href: `${PAYROLL_HREF}/${previous.id}/employees/${e.employeeId}` }] : []),
                            { label: "Employee profile", icon: UserRound, href: `/organization/employees/${e.employeeId}` },
                            { label: "Model a pay change", icon: Calculator, href: `${PAYROLL_HREF}/calculator?employee=${e.employeeId}` },
                            { label: "Investigate", icon: SearchCheck, onSelect: () => investigate(e), separated: true },
                          ]}
                        />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/30">
                        <td />
                        <td colSpan={6} className="px-3 pb-4">
                          <EmployeeDrillDown e={e} previous={previous} current={current} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <InvestigationsPanel runId={current.id} />
      {empDetail && (
        <DetailModal
          wide
          open
          onClose={() => setEmpDetail(null)}
          title={empDetail.name}
          description={`${empDetail.employeeNumber} · ${empDetail.department} · ${empDetail.costCentre} — ${previous.period.label} against ${current.period.label}`}
          facts={[
            { label: `Gross ${previous.period.label.split(" ")[0]}`, value: empDetail.previousGross === null ? "—" : money(empDetail.previousGross) },
            { label: `Gross ${current.period.label.split(" ")[0]}`, value: empDetail.currentGross === null ? "—" : money(empDetail.currentGross) },
            { label: "Gross variance", value: `${signed(empDetail.change)} ${pctArrow(empDetail.pct)}`, tone: empDetail.change < 0 ? "bad" : "good" },
            { label: "Net pay change", value: empDetail.previousNet === null || empDetail.currentNet === null ? "—" : signed(empDetail.currentNet - empDetail.previousNet) },
          ]}
          actions={
            <>
              <Button size="sm" variant="outline" asChild><Link href={`${PAYROLL_HREF}/${current.id}/employees/${empDetail.employeeId}`}>Pay this month</Link></Button>
              <Button size="sm" variant="outline" asChild><Link href={`/organization/employees/${empDetail.employeeId}`}>Employee profile</Link></Button>
              <Button size="sm" onClick={() => { const x = empDetail; setEmpDetail(null); investigate(x); }}>Investigate</Button>
            </>
          }
        >
          <p className={cn("rounded-lg border p-3 text-sm", Math.abs(empDetail.unexplained) >= 0.005 && "border-amber-500/40 bg-amber-500/5")}>{empDetail.explanation}</p>
          <EmployeeDrillDown e={empDetail} previous={previous} current={current} />
        </DetailModal>
      )}
      {reasonDetail && (
        <ReasonDetail
          reason={reasonDetail}
          employees={cmp.employees.filter((x) => x.reasons[reasonDetail] !== undefined)}
          previous={previous}
          current={current}
          onClose={() => setReasonDetail(null)}
          onEmployee={(x) => { setReasonDetail(null); setEmpDetail(x); }}
        />
      )}
      <RaiseInvestigationDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}

function EmployeeDrillDown({ e, previous, current }: { e: EmployeeVariance; previous: PayrollRun; current: PayrollRun }) {
  const comps = e.components.filter((c) => c.previous || c.current);
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="overflow-hidden rounded-lg border bg-card">
        <p className="border-b px-3 py-2 text-[11px] font-semibold">Pay components</p>
        <table className="w-full text-[11px]">
          <thead className="text-left text-muted-foreground">
            <tr><th className="px-3 py-1 font-medium" /><th className="px-3 py-1 text-right font-medium">{previous.period.label.split(" ")[0]}</th><th className="px-3 py-1 text-right font-medium">{current.period.label.split(" ")[0]}</th><th className="px-3 py-1 text-right font-medium">Change</th></tr>
          </thead>
          <tbody>
            {comps.map((c) => (
              <tr key={c.key} className={cn("border-t", COMPONENT_ROWS.find((r) => r.key === c.key)?.total && "font-semibold")}>
                <td className="px-3 py-1">{c.label}</td>
                <td className="px-3 py-1 text-right tabular-nums text-muted-foreground">{money(c.previous)}</td>
                <td className="px-3 py-1 text-right tabular-nums">{money(c.current)}</td>
                <td className={cn("px-3 py-1 text-right tabular-nums", c.change > 0 && "text-emerald-700", c.change < 0 && "text-rose-600")}>{Math.abs(c.change) < 0.005 ? "—" : signed(c.change)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <p className="border-b px-3 py-2 text-[11px] font-semibold">Transactions behind the change</p>
        <ul className="divide-y text-[11px]">
          {e.movements.map((m, i) => (
            <li key={`${m.code}-${i}`} className="grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2">
              <span>
                <span className="font-medium">{m.name}</span> <span className="text-muted-foreground">· {KIND_LABELS[m.kind]}{m.previousUnits !== undefined || m.currentUnits !== undefined ? ` · ${m.previousUnits ?? 0} → ${m.currentUnits ?? 0} units` : ""}</span>
                <span className={cn("block", m.source.confirmed ? "text-muted-foreground" : "font-medium text-amber-800 dark:text-amber-300")}>
                  {SOURCE_LABELS[m.source.type]}: {m.source.detail}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {[m.source.initiatedBy && `Initiated by ${m.source.initiatedBy}`, m.source.approvedBy && `Approved by ${m.source.approvedBy}`, m.source.processedAt && `Processed ${fmtDate(m.source.processedAt)}`, m.source.ref && `Ref ${m.source.ref}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className={cn("text-right tabular-nums font-medium", m.change < 0 ? "text-rose-600" : "text-emerald-700")}>
                {signed(m.change)}
                <span className="block text-[10px] font-normal text-muted-foreground">{money(m.previous)} → {money(m.current)}</span>
              </span>
            </li>
          ))}
          {!e.movements.length && <li className="px-3 py-3 text-muted-foreground">No earning lines moved.</li>}
        </ul>
      </div>
    </div>
  );
}

/** Everyone behind one reason in the bridge (e.g. the 7 with unpaid leave & lateness), with the days, hours and source records. */
function ReasonDetail({ reason, employees, previous, current, onClose, onEmployee }: { reason: VarianceReason; employees: EmployeeVariance[]; previous: PayrollRun; current: PayrollRun; onClose: () => void; onEmployee: (e: EmployeeVariance) => void }) {
  const total = employees.reduce((s, e) => s + (e.reasons[reason] ?? 0), 0);
  const units = (n?: number) => (n === undefined ? "—" : String(n));
  const isDays = reason === "attendance";
  return (
    <DetailModal
      wide
      open
      onClose={onClose}
      title={`${REASON_LABELS[reason]} · ${employees.length} employee${employees.length === 1 ? "" : "s"}`}
      description={`${previous.period.label} → ${current.period.label}. ${NATURE_LABELS[REASON_NATURE[reason]]} movement.`}
      facts={[
        { label: "Net movement", value: signed(total), tone: total < 0 ? "bad" : "good" },
        { label: "Employees", value: String(employees.length) },
        { label: "Increases", value: String(employees.filter((e) => (e.reasons[reason] ?? 0) > 0).length) },
        { label: "Decreases", value: String(employees.filter((e) => (e.reasons[reason] ?? 0) < 0).length) },
      ]}
    >
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 text-right font-medium">{isDays ? "Days / hrs" : "Units"} {previous.period.label.split(" ")[0].slice(0, 3)} → {current.period.label.split(" ")[0].slice(0, 3)}</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {employees.flatMap((e) =>
              e.movements
                .filter((m) => m.reason === reason)
                .map((m, i) => (
                  <tr key={`${e.employeeId}-${m.code}-${i}`} className="border-t align-top">
                    <td className="px-3 py-2">{i === 0 && <><span className="font-medium">{e.name}</span><span className="block text-[10px] text-muted-foreground">{e.employeeNumber} · {e.department}</span></>}</td>
                    <td className="px-3 py-2">{m.name}<span className="block text-[10px] text-muted-foreground">{KIND_LABELS[m.kind]}</span></td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.previousUnits !== undefined || m.currentUnits !== undefined ? `${units(m.previousUnits)} → ${units(m.currentUnits)}` : "—"}</td>
                    <td className={cn("px-3 py-2 text-right font-medium tabular-nums", m.change < 0 ? "text-rose-600" : "text-emerald-700")}>{signed(m.change)}<span className="block text-[10px] font-normal text-muted-foreground">{money(m.previous)} → {money(m.current)}</span></td>
                    <td className="px-3 py-2 text-[11px]"><span className={cn(!m.source.confirmed && "font-medium text-amber-700")}>{SOURCE_LABELS[m.source.type]}</span><span className="block text-[10px] text-muted-foreground">{m.source.detail}</span></td>
                    <td className="px-1 py-2">{i === 0 && <RowActions label={`${e.name} actions`} actions={[{ label: "View details", icon: Eye, onSelect: () => onEmployee(e) }, { label: "Pay this month", icon: Wallet, href: `${PAYROLL_HREF}/${current.id}/employees/${e.employeeId}` }, { label: "Employee profile", icon: UserRound, href: `/organization/employees/${e.employeeId}` }]} />}</td>
                  </tr>
                )),
            )}
          </tbody>
        </table>
      </div>
    </DetailModal>
  );
}

function FilterSelect({ value, onChange, allLabel, options }: { value: string; onChange: (v: string) => void; allLabel: string; options: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL} className="text-xs">{allLabel}</SelectItem>
        {options.map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function RunPicker({ label, runs, value, onChange }: { label: string; runs: PayrollRun[]; value?: string; onChange: (id: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="h-8 w-52 text-xs" aria-label={label}><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        {runs.map((r) => (
          <SelectItem key={r.id} value={r.id} className="text-xs">{r.title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Headline({ title, value, sub, badge, tone }: { title: string; value: string; sub?: string; badge?: React.ReactNode; tone?: "up" | "down" }) {
  return (
    <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <p className="flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{title} {badge}</p>
      <p className={cn("mt-0.5 text-xl font-semibold tabular-nums", tone === "up" && "text-emerald-700", tone === "down" && "text-rose-600")}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function BridgeRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between rounded-md border-y px-2 py-1.5", strong && "font-semibold")}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ComparisonTable({ title, lines, previous, current, strong }: { title: string; lines: TotalsLine[]; previous: PayrollRun; current: PayrollRun; strong: string[] }) {
  return (
    <>
      <p className="border-b px-4 py-3 text-sm font-semibold">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 text-right font-medium">{previous.title}</th>
              <th className="px-4 py-2 text-right font-medium">{current.title}</th>
              <th className="px-4 py-2 text-right font-medium">Variance</th>
              <th className="px-4 py-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((t) => {
              const count = t.key === "employees";
              return (
                <tr key={t.key} className={cn("border-t", strong.includes(t.key) && "font-semibold")}>
                  <td className="px-4 py-2">{t.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{count ? t.previous : money(t.previous)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{count ? t.current : money(t.current)}</td>
                  <td className={cn("whitespace-nowrap px-4 py-2 text-right tabular-nums", t.change > 0 && "text-emerald-700", t.change < 0 && "text-rose-600")}>
                    {count ? `${t.change > 0 ? "+" : ""}${t.change}` : signed(t.change)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-muted-foreground">{pctArrow(t.pct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
