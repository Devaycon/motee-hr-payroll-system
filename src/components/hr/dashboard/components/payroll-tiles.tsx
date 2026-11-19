"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { AlertTriangle, Banknote, Building2, CalendarClock, Landmark, PieChart, Receipt, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ChartCard, NIVO_THEME } from "@/src/components/shared/charts";
import { PAYROLL_HREF, RUN_STATUS_LABELS } from "@/src/lib/payroll/constants";
import { remittanceAmounts, remittanceCalendar } from "@/src/lib/payroll/exports";
import { lockedRunsByMonth } from "@/src/lib/payroll/remittances";
import { useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { PayrollRun } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { Tile, TileDelta, TileLabel, TileLink, TileNum, TileSub } from "./tiles";

/**
 * Dashboard → Payroll (Nigeria tenants). The payroll picture at a glance:
 * last month's totals against the month before, cost over the year, where
 * the money goes, and what's still owed to the authorities. Every tile links
 * into the payroll page that owns the figure.
 */

const compact = (n: number) =>
  Math.abs(n) >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(2)}m` : Math.abs(n) >= 1_000 ? `₦${(n / 1000).toFixed(1)}k` : `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmtDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const key = (r: PayrollRun) => r.period.year * 100 + r.period.month;
const LOCKED = (r: PayrollRun) => r.status === "finalized" || r.status === "disbursed";

/** Fixed series colours (indigo, sky) — the order never changes with the data. */
const GROSS_COLOR = "#6366f1";
const EMPLOYER_COLOR = "#0ea5e9";
/** Deduction mix, in a fixed order. */
const MIX = [
  { key: "paye", label: "PAYE", color: "#6366f1" },
  { key: "pension", label: "Pension (8%)", color: "#0ea5e9" },
  { key: "avc", label: "Voluntary pension", color: "#14b8a6" },
  { key: "nhf", label: "NHF", color: "#FE8F44" },
  { key: "other", label: "Other deductions", color: "#94a3b8" },
] as const;

function usePayrollDashboard() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  return useMemo(() => {
    if (!data) return { loading, supported, ready: false as const };
    const regular = data.runs.filter((r) => r.type === "regular" && r.employees.some((e) => e.computation)).sort((a, b) => key(a) - key(b));
    const paid = regular.filter(LOCKED);
    const latest = paid[paid.length - 1] ?? null;
    const prior = paid[paid.length - 2] ?? null;
    const open = regular.find((r) => !LOCKED(r)) ?? null;
    const people = new Map((bundle?.employees ?? []).map((e) => [e.id, e]));

    const byDept = new Map<string, { cost: number; people: number }>();
    const mix: Record<(typeof MIX)[number]["key"], number> = { paye: 0, pension: 0, avc: 0, nhf: 0, other: 0 };
    for (const re of latest?.employees ?? []) {
      const c = re.included ? re.computation : null;
      if (!c) continue;
      const dept = people.get(re.employeeId)?.departmentName ?? "Unassigned";
      const d = byDept.get(dept) ?? { cost: 0, people: 0 };
      d.cost += c.gross + c.employerCost;
      d.people++;
      byDept.set(dept, d);
      const sum = (code: string) => c.lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);
      const paye = sum("PAYE") + sum("WHT");
      const pension = sum("PENSION_EE");
      const avc = sum("VOL_PENSION");
      const nhf = sum("NHF");
      mix.paye += paye;
      mix.pension += pension;
      mix.avc += avc;
      mix.nhf += nhf;
      mix.other += Math.max(0, c.totalDeductions - paye - pension - avc - nhf);
    }

    // Remittances due: every locked month, unpaid items with something owed.
    const today = new Date().toISOString().slice(0, 10);
    const due: { month: string; label: string; item: string; amount: number; due: string; overdue: boolean }[] = [];
    for (const [month, runs] of lockedRunsByMonth(data.runs)) {
      const reg = runs.find((r) => r.type === "regular") ?? runs[0];
      const amounts = remittanceAmounts(runs);
      for (const c of remittanceCalendar(reg.period)) {
        if (amounts[c.key] <= 0 || data.remittances?.[`${month}:${c.key}`]) continue;
        due.push({ month, label: reg.period.label, item: c.item, amount: amounts[c.key], due: c.due, overdue: c.due < today });
      }
    }
    due.sort((a, b) => a.due.localeCompare(b.due));

    return {
      loading,
      supported,
      ready: true as const,
      latest,
      prior,
      open,
      trend: regular.slice(-12),
      departments: [...byDept.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.cost - a.cost),
      mix,
      due,
    };
  }, [data, bundle, loading, supported]);
}

function Placeholder({ h = "h-36" }: { h?: string }) {
  return <Skeleton className={cn(h, "w-full rounded-xl")} />;
}

function IconChip({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#7F77DD]/10">
      <Icon className="h-5 w-5 text-[#7F77DD]" />
    </div>
  );
}

/** Gross, net, PAYE and employer cost for the last paid month, against the month before. */
export function PayrollKpiRow() {
  const d = usePayrollDashboard();
  if (!d.ready) return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Placeholder key={i} />)}</div>;
  if (!d.latest) {
    return (
      <Tile>
        <TileLabel>Payroll</TileLabel>
        <TileSub>No month has been paid yet. Figures appear once the first run is finalized.</TileSub>
        <TileLink href={PAYROLL_HREF}>Open payroll</TileLink>
      </Tile>
    );
  }
  const L = d.latest;
  const P = d.prior;
  const kpis: { label: string; icon: LucideIcon; now: number; before: number | null; view: string; link: string; upIsGood?: boolean }[] = [
    { label: "Gross Pay", icon: Banknote, now: L.totals.gross, before: P?.totals.gross ?? null, view: "gross", link: "View gross breakdown" },
    { label: "Net Pay", icon: Receipt, now: L.totals.net, before: P?.totals.net ?? null, view: "net", link: "View net pay by bank" },
    { label: "PAYE", icon: Landmark, now: L.totals.paye, before: P?.totals.paye ?? null, view: "paye", link: "View PAYE by state" },
    { label: "Employer Cost", icon: Building2, now: L.totals.employerCost, before: P?.totals.employerCost ?? null, view: "pension", link: "View pension by PFA" },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => {
        const change = k.before ? ((k.now - k.before) / k.before) * 100 : null;
        return (
          <Tile key={k.label}>
            <div className="flex items-center gap-1.5">
              <IconChip icon={k.icon} />
              <TileLabel>{k.label}</TileLabel>
            </div>
            <TileSub>{L.period.label}</TileSub>
            <TileNum>{compact(k.now)}</TileNum>
            {change === null ? (
              <p className="mt-1.5 text-xs text-muted-foreground">First paid month</p>
            ) : (
              <TileDelta up={change >= 0}>
                {Math.abs(change).toFixed(1)}% vs {P!.period.label.split(" ")[0]}
              </TileDelta>
            )}
            <TileLink href={`${PAYROLL_HREF}/${L.id}/breakdown?view=${k.view}`}>{k.link}</TileLink>
          </Tile>
        );
      })}
    </div>
  );
}

/** Monthly payroll cost — gross pay plus employer contributions, stacked. */
export function PayrollCostTrendCard() {
  const d = usePayrollDashboard();
  if (!d.ready) return <Placeholder h="h-72" />;
  const rows = d.trend.map((r) => ({
    month: r.period.label.split(" ")[0].slice(0, 3) + (d.trend.some((x) => x.period.year !== r.period.year) ? ` ${String(r.period.year).slice(2)}` : ""),
    "Gross pay": Math.round(r.totals.gross),
    "Employer contributions": Math.round(r.totals.employerCost),
    status: r.status,
    id: r.id,
  }));
  const total = d.trend.reduce((s, r) => s + r.totals.gross + r.totals.employerCost, 0);
  return (
    <ChartCard
      title="Payroll Cost Trend"
      description="Gross pay plus employer pension, NSITF and ITF, by month"
      icon={TrendingUp}
      compact
      footer={`${compact(total)} over ${rows.length} month${rows.length === 1 ? "" : "s"}${d.open ? ` · ${d.open.period.label} is ${RUN_STATUS_LABELS[d.open.status].toLowerCase()}` : ""}`}
      viewMoreHref={d.latest ? `${PAYROLL_HREF}/compare?current=${d.latest.id}` : PAYROLL_HREF}
      legend={
        <div className="flex items-center gap-4 px-3 pb-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: GROSS_COLOR }} /> Gross pay</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: EMPLOYER_COLOR }} /> Employer contributions</span>
        </div>
      }
      className="h-full"
    >
      <div style={{ height: 220 }}>
        {rows.length === 0 ? (
          <p className="pt-16 text-center text-xs text-muted-foreground">No payroll runs yet.</p>
        ) : (
          <ResponsiveBar
            data={rows}
            keys={["Gross pay", "Employer contributions"]}
            indexBy="month"
            margin={{ top: 12, right: 12, bottom: 28, left: 56 }}
            padding={0.35}
            innerPadding={2}
            colors={[GROSS_COLOR, EMPLOYER_COLOR]}
            borderRadius={3}
            enableLabel={false}
            enableGridX={false}
            axisBottom={{ tickSize: 0, tickPadding: 8 }}
            axisLeft={{ tickSize: 0, tickPadding: 6, tickValues: 4, format: (v) => compact(Number(v)) }}
            tooltip={({ id, value, data }) => (
              <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                <p className="font-medium text-foreground">{data.month}{data.status !== "disbursed" && data.status !== "finalized" ? ` · ${RUN_STATUS_LABELS[data.status as PayrollRun["status"]]}` : ""}</p>
                <p className="text-muted-foreground">{id}: <span className="font-semibold text-foreground">{compact(Number(value))}</span></p>
                <p className="text-muted-foreground">Total: {compact(Number(data["Gross pay"]) + Number(data["Employer contributions"]))}</p>
              </div>
            )}
            theme={NIVO_THEME}
            motionConfig="gentle"
            role="img"
            ariaLabel="Payroll cost by month"
          />
        )}
      </div>
    </ChartCard>
  );
}

/**
 * Validated categorical palette (fixed order). A department keeps its colour
 * month to month — it's picked by the department's place in the company's
 * list, never by its rank this month.
 */
const DEPT_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const OTHER_COLOR = "#8a8f98";

/** Payroll cost by department for the last paid month — a donut with a live centre readout. */
export function PayrollByDepartmentCard() {
  const d = usePayrollDashboard();
  const { bundle } = useTenantPayroll();
  const [active, setActive] = useState<string | null>(null);
  if (!d.ready) return <Placeholder h="h-72" />;

  const order = [...new Set([...(bundle?.departments ?? []).map((x) => x.name), ...d.departments.map((x) => x.name)])].sort();
  const colorOf = (name: string) => DEPT_COLORS[order.indexOf(name) % DEPT_COLORS.length];
  const total = d.departments.reduce((s, x) => s + x.cost, 0);
  // Eight slices at most: anything past the seventh folds into "Other".
  const top = d.departments.length > 8 ? d.departments.slice(0, 7) : d.departments;
  const rest = d.departments.slice(top.length);
  const slices = [
    ...top.map((x) => ({ id: x.name, label: x.name, value: Math.round(x.cost), people: x.people, color: colorOf(x.name) })),
    ...(rest.length ? [{ id: "Other", label: `Other (${rest.length})`, value: Math.round(rest.reduce((s, x) => s + x.cost, 0)), people: rest.reduce((s, x) => s + x.people, 0), color: OTHER_COLOR }] : []),
  ];
  const focus = slices.find((x) => x.id === active) ?? null;
  const pct = (v: number) => (total ? `${((v / total) * 100).toFixed(1)}%` : "0%");

  const Centre = ({ centerX, centerY }: { centerX: number; centerY: number }) => (
    <g transform={`translate(${centerX},${centerY})`} style={{ pointerEvents: "none" }}>
      <text textAnchor="middle" y={-14} style={{ fontSize: 11, fill: "var(--muted-foreground)" }}>
        {focus ? (focus.label.length > 18 ? `${focus.label.slice(0, 17)}…` : focus.label) : "Total cost"}
      </text>
      <text textAnchor="middle" y={8} style={{ fontSize: 20, fontWeight: 600, fill: "var(--foreground)" }}>
        {compact(focus ? focus.value : total)}
      </text>
      <text textAnchor="middle" y={26} style={{ fontSize: 11, fill: "var(--muted-foreground)" }}>
        {focus ? `${pct(focus.value)} · ${focus.people} people` : `${d.departments.reduce((s, x) => s + x.people, 0)} people`}
      </text>
    </g>
  );

  return (
    <ChartCard
      title="Cost by Department"
      description={d.latest ? `${d.latest.period.label} · gross pay + employer cost` : "No paid month yet"}
      icon={Users}
      compact
      footer={`${compact(total)} across ${d.departments.length} departments`}
      viewMoreHref={d.latest ? `${PAYROLL_HREF}/${d.latest.id}/breakdown?view=gross` : PAYROLL_HREF}
      className="h-full"
    >
      {slices.length === 0 ? (
        <p className="py-16 text-center text-xs text-muted-foreground">Nothing paid yet.</p>
      ) : (
        <div className="flex flex-col gap-2 px-1 pb-1">
          <div style={{ height: 210 }} role="img" aria-label={`Payroll cost by department, ${compact(total)} in total`}>
            <ResponsivePie
              data={slices}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.66}
              padAngle={1.2}
              cornerRadius={4}
              activeOuterRadiusOffset={7}
              activeInnerRadiusOffset={2}
              colors={{ datum: "data.color" }}
              borderWidth={2}
              borderColor="var(--card)"
              enableArcLinkLabels={false}
              arcLabel={(a) => `${Math.round((a.value / total) * 100)}%`}
              arcLabelsSkipAngle={22}
              arcLabelsTextColor="#ffffff"
              activeId={active}
              onActiveIdChange={(id) => setActive(id === null ? null : String(id))}
              tooltip={({ datum }) => (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: datum.color }} />
                    {datum.label}
                  </p>
                  <p className="text-muted-foreground">
                    {compact(datum.value)} · {pct(datum.value)} · {(datum.data as { people: number }).people} people
                  </p>
                </div>
              )}
              layers={["arcs", "arcLabels", Centre]}
              theme={NIVO_THEME}
              motionConfig="gentle"
            />
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            {slices.map((x) => (
              <li
                key={x.id}
                onMouseEnter={() => setActive(x.id)}
                onMouseLeave={() => setActive(null)}
                className={cn("flex min-w-0 cursor-default items-center gap-1.5 rounded px-1 py-0.5 transition-opacity", active && active !== x.id && "opacity-45")}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: x.color }} />
                <span className="truncate text-foreground">{x.label}</span>
                <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">{pct(x.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

/** Where deductions go — one segmented bar plus a labelled legend. */
export function DeductionMixCard() {
  const d = usePayrollDashboard();
  if (!d.ready) return <Placeholder h="h-60" />;
  const total = MIX.reduce((s, m) => s + d.mix[m.key], 0);
  return (
    <Tile>
      <div className="flex items-center gap-1.5">
        <IconChip icon={PieChart} />
        <TileLabel>Deduction Mix</TileLabel>
      </div>
      <TileSub>{d.latest ? `${d.latest.period.label} · ${compact(total)} deducted` : "No paid month yet"}</TileSub>
      {total > 0 && (
        <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Deductions by type">
          {MIX.filter((m) => d.mix[m.key] > 0).map((m) => (
            <div key={m.key} title={`${m.label}: ${compact(d.mix[m.key])}`} style={{ width: `${(d.mix[m.key] / total) * 100}%`, background: m.color }} />
          ))}
        </div>
      )}
      <ul className="mt-3 flex flex-col gap-1.5 text-xs">
        {MIX.map((m) => (
          <li key={m.key} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: m.color }} />
              {m.label}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {compact(d.mix[m.key])} {total > 0 && <span className="ml-1">{((d.mix[m.key] / total) * 100).toFixed(0)}%</span>}
            </span>
          </li>
        ))}
      </ul>
      {d.latest && <TileLink href={`${PAYROLL_HREF}/${d.latest.id}/breakdown?view=deductions`}>View deductions</TileLink>}
    </Tile>
  );
}

/** Statutory payments still owed, soonest first. */
export function RemittancesDueCard() {
  const d = usePayrollDashboard();
  if (!d.ready) return <Placeholder h="h-60" />;
  const overdue = d.due.filter((x) => x.overdue);
  const owed = d.due.reduce((s, x) => s + x.amount, 0);
  return (
    <Tile>
      <div className="flex items-center gap-1.5">
        <IconChip icon={Landmark} />
        <TileLabel>Remittances Due</TileLabel>
      </div>
      <TileSub>
        {d.due.length ? `${compact(owed)} owed · ${d.due.length} payment${d.due.length === 1 ? "" : "s"}` : "Everything paid to date"}
      </TileSub>
      {overdue.length > 0 && (
        <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-700">
          <AlertTriangle className="h-3 w-3" /> {overdue.length} overdue
        </p>
      )}
      <ul className="mt-2 flex flex-col divide-y text-xs">
        {d.due.slice(0, 5).map((x) => (
          <li key={`${x.month}-${x.item}`} className="flex items-center justify-between gap-2 py-1.5">
            <span className="min-w-0">
              <span className="block truncate text-foreground">{x.item}</span>
              <span className="text-[10px] text-muted-foreground">{x.label}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block tabular-nums text-foreground">{compact(x.amount)}</span>
              <span className={cn("text-[10px]", x.overdue ? "font-medium text-red-600" : "text-muted-foreground")}>{x.overdue ? "Overdue · " : "Due "}{fmtDate(x.due)}</span>
            </span>
          </li>
        ))}
      </ul>
      <TileLink href={`${PAYROLL_HREF}?tab=remittances`}>View remittances</TileLink>
    </Tile>
  );
}

/** The month in progress: status, pay day, exceptions. */
export function CurrentRunCard() {
  const d = usePayrollDashboard();
  if (!d.ready) return <Placeholder h="h-60" />;
  const r = d.open;
  const avgNet = d.latest && d.latest.totals.employees ? d.latest.totals.net / d.latest.totals.employees : 0;
  const errors = r?.exceptions.filter((e) => e.severity === "error" && !e.acknowledged).length ?? 0;
  const warnings = r?.exceptions.filter((e) => e.severity === "warning").length ?? 0;
  return (
    <Tile>
      <div className="flex items-center gap-1.5">
        <IconChip icon={CalendarClock} />
        <TileLabel>{r ? r.title : "Next Payroll"}</TileLabel>
      </div>
      <TileSub>{r ? `${RUN_STATUS_LABELS[r.status]} · pay day ${fmtDate(r.period.payDate)}${r.period.scheduledPayDate ? ` (moved from ${fmtDate(r.period.scheduledPayDate)})` : ""}` : "No run in progress"}</TileSub>
      {r && <TileNum className="text-2xl">{compact(r.totals.net)}</TileNum>}
      {r && <p className="mt-1 text-xs text-muted-foreground">Net pay for {r.totals.employees} employees</p>}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/50 px-2 py-1.5">
          <dt className="text-[10px] text-muted-foreground">Exceptions</dt>
          <dd className={cn("font-semibold tabular-nums", errors > 0 && "text-red-600")}>{errors} errors · {warnings} warn.</dd>
        </div>
        <div className="rounded-md bg-muted/50 px-2 py-1.5">
          <dt className="text-[10px] text-muted-foreground">Avg net pay{d.latest ? ` (${d.latest.period.label.split(" ")[0].slice(0, 3)})` : ""}</dt>
          <dd className="font-semibold tabular-nums">{avgNet ? compact(avgNet) : "—"}</dd>
        </div>
      </dl>
      {r ? (
        <Link href={`${PAYROLL_HREF}/${r.id}${errors + warnings ? "?tab=exceptions" : ""}`} className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline">
          Open the run ›
        </Link>
      ) : (
        <TileLink href={PAYROLL_HREF}>Open payroll</TileLink>
      )}
    </Tile>
  );
}
