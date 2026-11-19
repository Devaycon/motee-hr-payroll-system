"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { REASON_LABELS, REASON_ORDER, compareRuns, defaultPreviousRun, type TotalsLine, type VarianceReason } from "@/src/lib/payroll/comparison";
import { writeTable } from "@/src/lib/payroll/exports";
import { usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { PayrollRun } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { NotSupported, RunStatusBadge, money } from "./components/shared";

const signed = (n: number, dp = 2) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n), dp)}`;
const pctText = (p: number | null) => (p === null ? "—" : `${p > 0 ? "+" : ""}${p.toFixed(1)}%`);

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

/**
 * `/time-payroll/payroll/compare?current=…&previous=…` — this month's payroll
 * against last month's: totals side by side, a bridge that explains the gross
 * movement reason by reason, and every employee whose pay changed.
 */
export function RunComparePage() {
  const router = useRouter();
  const search = useSearchParams();
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const [reason, setReason] = useState<VarianceReason | "all">("all");
  const [q, setQ] = useState("");

  const runs = useMemo(
    () => [...(data?.runs ?? [])].filter((r) => r.employees.some((e) => e.computation)).sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month) || b.createdAt.localeCompare(a.createdAt)),
    [data],
  );
  const current = runs.find((r) => r.id === search.get("current")) ?? runs.find((r) => r.type === "regular") ?? null;
  const previous = (current && (runs.find((r) => r.id === search.get("previous") && r.id !== current.id) ?? defaultPreviousRun(runs, current))) || null;
  const people = useMemo(() => new Map((bundle?.employees ?? []).map((e) => [e.id, e])), [bundle]);
  const cmp = useMemo(
    () => (current && previous && data ? compareRuns(current, previous, { people, elements: data.elements, structures: data.structures }) : null),
    [current, previous, data, people],
  );

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data) return <Skeleton className="h-150 w-full rounded-xl" />;

  const pickRun = (k: "current" | "previous", id: string) => {
    const p = new URLSearchParams(search.toString());
    p.set(k, id);
    if (k === "current") p.delete("previous");
    router.replace(`?${p.toString()}`);
  };

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Payroll
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Payroll comparison</h1>
        <p className="text-xs text-muted-foreground">Gross pay month on month — what changed, by how much, and why.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RunPicker label="Compare" runs={runs} value={current?.id} onChange={(id) => pickRun("current", id)} />
        <span className="text-xs text-muted-foreground">against</span>
        <RunPicker label="Previous" runs={runs.filter((r) => r.id !== current?.id)} value={previous?.id} onChange={(id) => pickRun("previous", id)} />
        {cmp && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              const headers = ["Employee ID", "Name", "Department", `Gross ${cmp.previous.title}`, `Gross ${cmp.current.title}`, "Change", "Change %", ...REASON_ORDER.map((r) => REASON_LABELS[r]), "Notes"];
              const rows = cmp.employees.map((e) => [e.employeeNumber, e.name, e.department, e.previousGross ?? "", e.currentGross ?? "", e.change, e.pct ?? "", ...REASON_ORDER.map((r) => e.reasons[r] ?? ""), e.notes.join("; ")]);
              const summary = cmp.totals.map((t) => [t.label, "", "", t.previous, t.current, t.change, t.pct ?? ""]);
              writeTable(`payroll-comparison-${cmp.current.period.year}-${String(cmp.current.period.month).padStart(2, "0")}`, "Comparison", { headers, data: rows, preamble: [["Summary"], ...summary, []] }, "xlsx");
              actions.logExport(cmp.current.id, `Payroll comparison against ${cmp.previous.title}`);
              toast.success("Comparison downloaded");
            }}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
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
  const bridgeMax = Math.max(1, ...cmp.bridge.map((b) => Math.abs(b.amount)));
  const needle = q.trim().toLowerCase();
  const shownEmployees = cmp.employees.filter(
    (e) => Math.abs(e.change) >= 0.005 && (reason === "all" || e.reasons[reason] !== undefined) && (!needle || `${e.name} ${e.employeeNumber} ${e.department}`.toLowerCase().includes(needle)),
  );
  const unchanged = cmp.employees.filter((e) => Math.abs(e.change) < 0.005).length;

  return (
    <div className="flex flex-col gap-5 pb-10">
      {header}

      {/* Headline */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Headline title={`Gross pay · ${previous.title}`} value={money(gross.previous)} badge={<RunStatusBadge status={previous.status} />} />
        <Headline title={`Gross pay · ${current.title}`} value={money(gross.current)} badge={<RunStatusBadge status={current.status} />} />
        <Headline
          title="Variance"
          value={signed(gross.change)}
          sub={`${pctText(gross.pct)} · ${cmp.employees.filter((e) => Math.abs(e.change) >= 0.005).length} employees changed, ${unchanged} unchanged`}
          tone={gross.change > 0 ? "up" : gross.change < 0 ? "down" : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Bridge */}
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <p className="text-sm font-semibold">Why gross pay moved</p>
          <p className="text-[11px] text-muted-foreground">From {previous.period.label} to {current.period.label}. Click a reason to see who.</p>
          <div className="mt-4 flex flex-col gap-2 text-xs">
            <BridgeRow label={`${previous.title} gross`} value={money(gross.previous)} strong />
            {cmp.bridge.map((b) => (
              <button
                key={b.reason}
                type="button"
                onClick={() => setReason(reason === b.reason ? "all" : b.reason)}
                className={cn("grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-md px-2 py-1.5 text-left transition hover:bg-muted/60", reason === b.reason && "bg-muted")}
              >
                <span className="flex items-center gap-2">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", REASON_TONE[b.reason])}>{REASON_LABELS[b.reason]}</span>
                  <span className="text-[10px] text-muted-foreground">{b.employees} employee{b.employees === 1 ? "" : "s"}</span>
                </span>
                <span className={cn("tabular-nums font-medium", b.amount >= 0 ? "text-emerald-700" : "text-rose-600")}>{signed(b.amount)}</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className={cn("block h-full rounded-full", b.amount >= 0 ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${(Math.abs(b.amount) / bridgeMax) * 100}%` }} />
                </span>
              </button>
            ))}
            {cmp.bridge.length === 0 && <p className="px-2 text-muted-foreground">No change in gross pay.</p>}
            <BridgeRow label={`${current.title} gross`} value={money(gross.current)} strong />
          </div>
        </div>

        {/* Totals */}
        <div className="overflow-hidden rounded-xl border bg-card lg:col-span-3">
          <ComparisonTable title="Payroll totals" lines={cmp.totals} previous={previous} current={current} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <ComparisonTable title="Earnings by pay element" lines={cmp.earnings} previous={previous} current={current} />
      </div>

      {/* Employees */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Employees whose gross pay changed</p>
            <p className="text-[11px] text-muted-foreground">{shownEmployees.length} shown{reason !== "all" && ` · ${REASON_LABELS[reason]}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={reason} onValueChange={(v) => setReason(v as VarianceReason | "all")}>
              <SelectTrigger size="sm" className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All reasons</SelectItem>
                {cmp.bridge.map((b) => (
                  <SelectItem key={b.reason} value={b.reason} className="text-xs">{REASON_LABELS[b.reason]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input className="h-8 w-52 text-xs" placeholder="Search employee" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-xs">
            <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 text-right font-medium">{previous.period.label.split(" ")[0]}</th>
                <th className="px-4 py-2 text-right font-medium">{current.period.label.split(" ")[0]}</th>
                <th className="px-4 py-2 text-right font-medium">Change</th>
                <th className="px-4 py-2 font-medium">Reasons</th>
              </tr>
            </thead>
            <tbody>
              {shownEmployees.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No changes to show.</td></tr>
              )}
              {shownEmployees.map((e) => (
                <tr key={e.employeeId} className="border-t align-top">
                  <td className="px-4 py-2">
                    <Link href={`${PAYROLL_HREF}/${current.id}/employees/${e.employeeId}`} className="font-medium hover:text-primary hover:underline">{e.name}</Link>
                    <p className="text-[10px] text-muted-foreground">{e.employeeNumber} · {e.department}</p>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{e.previousGross === null ? "—" : money(e.previousGross)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{e.currentGross === null ? "—" : money(e.currentGross)}</td>
                  <td className={cn("whitespace-nowrap px-4 py-2 text-right font-medium tabular-nums", e.change > 0 ? "text-emerald-700" : "text-rose-600")}>
                    {signed(e.change)}
                    <p className="text-[10px] font-normal text-muted-foreground">{pctText(e.pct)}</p>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {REASON_ORDER.filter((r) => e.reasons[r] !== undefined).map((r) => (
                        <span key={r} className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", REASON_TONE[r])}>
                          {REASON_LABELS[r]} {signed(e.reasons[r]!, 0)}
                        </span>
                      ))}
                    </div>
                    {e.notes.length > 0 && <p className="mt-1 text-[10px] text-muted-foreground">{e.notes.join(" · ")}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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

function ComparisonTable({ title, lines, previous, current }: { title: string; lines: TotalsLine[]; previous: PayrollRun; current: PayrollRun }) {
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
                <tr key={t.key} className={cn("border-t", ["gross", "net", "totalCost"].includes(t.key) && "font-semibold")}>
                  <td className="px-4 py-2">{t.label}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{count ? t.previous : money(t.previous)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{count ? t.current : money(t.current)}</td>
                  <td className={cn("whitespace-nowrap px-4 py-2 text-right tabular-nums", t.change > 0 && "text-emerald-700", t.change < 0 && "text-rose-600")}>
                    {count ? `${t.change > 0 ? "+" : ""}${t.change}` : signed(t.change)}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{pctText(t.pct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
