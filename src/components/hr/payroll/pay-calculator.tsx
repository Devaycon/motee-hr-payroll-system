"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Calculator, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { PAYROLL_HREF, PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { calculate, linesForGross, recurringDeductions, type CalcDeduction } from "@/src/lib/payroll/calculator";
import { writeTable, type ExportFormat } from "@/src/lib/payroll/exports";
import { round2 } from "@/src/lib/payroll/ng/engine";
import { structureOn } from "@/src/lib/payroll/run-builder";
import { adjustLines } from "@/src/lib/payroll/salary-impact";
import { usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { HmoEnrolment, SalaryLine, VoluntaryPension } from "@/src/lib/payroll/types";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { Figure } from "./components/charts";
import { DownloadMenu } from "./components/row-actions";
import { NotSupported, money, pctArrow } from "./components/shared";

const NONE = "__none__";
const KEEP = "__keep__";
const firstOfNextMonth = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
};
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n))}`;
const pct = (a: number, b: number) => (a ? ((b - a) / Math.abs(a)) * 100 : null);

type Mode = "gross" | "percent" | "lines";

/**
 * `/time-payroll/payroll/calculator?employee=` — payslip simulation: an
 * employee's take-home pay today against a proposed salary, pension or HMO
 * change, with the employer's cost. Nothing is saved; "Propose" sends an
 * ordinary salary change for approval.
 */
export function PayCalculatorPage() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const canUse = useCan(PAYROLL_MODULE, "create");
  const router = useRouter();
  const search = useSearchParams();
  const employeeId = search.get("employee") || undefined;
  const isNew = search.get("new") === "1";
  const [mode, setMode] = useState<Mode>("gross");
  const [gross, setGross] = useState("");
  const [pctUp, setPctUp] = useState("");
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [date, setDate] = useState(firstOfNextMonth());
  const [avcMode, setAvcMode] = useState<string>(KEEP);
  const [avcValue, setAvcValue] = useState("");
  const [hmoPlan, setHmoPlan] = useState<string>(KEEP);
  const [hmoCover, setHmoCover] = useState<"individual" | "family">("individual");
  const [hmoDeps, setHmoDeps] = useState("0");
  const [extra, setExtra] = useState<CalcDeduction[] | null>(null);
  const [propose, setPropose] = useState(false);
  const [reason, setReason] = useState("");

  const emp = employeeId ? bundle?.employees.find((e) => e.id === employeeId) : undefined;
  const current = data && employeeId ? structureOn(data.structures, employeeId, date) ?? structureOn(data.structures, employeeId, new Date().toISOString().slice(0, 10)) : null;
  const profile = data && employeeId ? data.profiles.find((p) => p.employeeId === employeeId) : undefined;
  const elementOf = useMemo(() => new Map((data?.elements ?? []).map((e) => [e.code, e])), [data]);
  const isFixed = (code: string) => {
    const el = elementOf.get(code);
    return !!el && el.calculationType === "fixed" && (el.group === "core" || el.group === "allowances");
  };
  const currentFixed = round2((current?.lines ?? []).filter((l) => isFixed(l.code)).reduce((s, l) => s + l.amount, 0));
  const baseDeductions = useMemo(() => (data ? recurringDeductions(data, employeeId) : []), [data, employeeId]);
  const deductions = extra ?? baseDeductions;

  const proposedLines: SalaryLine[] = useMemo(() => {
    if (!data) return [];
    const g = Number(gross) || 0;
    if (!current) return g > 0 ? linesForGross(data, g) : [];
    let lines = current.lines;
    if (mode === "gross" && g > 0) lines = adjustLines(current.lines, "fixed", g - currentFixed, isFixed);
    if (mode === "percent" && Number(pctUp)) lines = adjustLines(current.lines, "percent", Number(pctUp), isFixed);
    if (mode === "lines") lines = current.lines.map((l) => (overrides[l.code] !== undefined ? { ...l, amount: overrides[l.code] } : l));
    return lines;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, current, mode, gross, pctUp, overrides, currentFixed]);

  const avc: VoluntaryPension | null | undefined = avcMode === KEEP ? undefined : avcMode === NONE ? null : { mode: avcMode as "fixed" | "percent", value: Number(avcValue) || 0, startDate: date, mandate: profile?.avc?.mandate ?? null };
  const hmo: HmoEnrolment | null | undefined = hmoPlan === KEEP ? undefined : hmoPlan === NONE ? null : { planId: hmoPlan, coverage: hmoCover, dependants: Math.max(0, Number(hmoDeps) || 0), from: date };
  const result = useMemo(
    () => (data && bundle && proposedLines.length ? calculate(data, bundle, { employeeId, lines: proposedLines, date, avc, hmo, deductions: baseDeductions, proposedDeductions: extra ?? undefined }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, bundle, proposedLines, date, avcMode, avcValue, hmoPlan, hmoCover, hmoDeps, baseDeductions, extra, employeeId],
  );

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !bundle) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!canUse) return <p className="py-20 text-center text-sm text-muted-foreground">The payslip calculator is available to payroll users.</p>;

  const pick = (id: string | null, asNew = false) => {
    const p = new URLSearchParams();
    if (id) p.set("employee", id);
    if (asNew) p.set("new", "1");
    router.replace(`?${p.toString()}`);
    setGross("");
    setPctUp("");
    setOverrides({});
    setExtra(null);
    setAvcMode(KEEP);
    setHmoPlan(KEEP);
  };
  const plans = data.settings.hmo?.plans.filter((p) => p.active !== false) ?? [];
  const providerOf = (id: string) => data.settings.hmo?.providers.find((p) => p.id === id)?.name ?? "";
  const cur = result?.current ?? null;
  const pro = result?.proposed ?? null;
  const salaryChanged = !!current && JSON.stringify(proposedLines) !== JSON.stringify(current.lines);

  const download = (f: ExportFormat) => {
    if (!result || !pro) return;
    const name = emp?.fullName ?? "New employee";
    const rows = [
      ...result.rows.map((r) => [r.section === "earning" ? "Earnings" : r.section === "deduction" ? "Deductions" : "Employer", r.name, cur ? r.current : "", r.proposed, cur ? round2(r.proposed - r.current) : ""]),
      ["Total", "Gross pay", cur?.gross ?? "", pro.gross, cur ? round2(pro.gross - cur.gross) : ""],
      ["Total", "Net pay", cur?.net ?? "", pro.net, cur ? round2(pro.net - cur.net) : ""],
      ["Total", "Cost to employer", cur?.costToEmployer ?? "", pro.costToEmployer, cur ? round2(pro.costToEmployer - cur.costToEmployer) : ""],
    ];
    writeTable(`payslip-simulation-${name.replace(/\W+/g, "-").toLowerCase()}`, `Payslip simulation — ${name}`, { preamble: [[`Payslip simulation — ${name}`], [`Effective ${date} · simulation only, not applied to payroll`], []], headers: ["Section", "Item", "Current", "Proposed", "Change"], data: rows }, f);
    actions.logExport("", `Payslip simulation — ${name} (${f.toUpperCase()})`);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Payroll</Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold"><Calculator className="h-6 w-6 text-primary" /> Payslip simulation</h1>
          <p className="max-w-2xl text-xs text-muted-foreground">See an employee&apos;s take-home pay and the employer&apos;s cost before changing salary, pension or HMO. Calculated by the payroll engine; nothing here changes payroll until a salary change is approved.</p>
          <div className="mt-2 flex gap-1.5">
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-800 dark:text-emerald-300">Simulation only</Badge>
            <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-[10px] text-sky-800 dark:text-sky-300">Not saved to payroll</Badge>
          </div>
        </div>
        {result && <DownloadMenu onDownload={download} />}
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-3">
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold">Who</p>
            <EmployeePicker value={employeeId} clearable={false} placeholder="Choose an employee…" onChange={(e) => e && pick(e.id)} />
            <Button size="sm" variant={isNew ? "default" : "outline"} className="w-full" onClick={() => pick(null, true)}>Or model a new hire (gross only)</Button>
            {emp && current && <p className="text-[11px] text-muted-foreground">{emp.departmentName} · current fixed pay {money(currentFixed)}/month</p>}
          </div>

          {(emp || isNew) && (
            <>
              <div className="space-y-2 rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold">Proposed salary</p>
                {current && (
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-0.5 text-[11px]">
                    {(["gross", "percent", "lines"] as Mode[]).map((m) => (
                      <button key={m} type="button" onClick={() => setMode(m)} className={cn("rounded-md px-2 py-1", mode === m && "bg-card font-medium shadow-sm")}>{m === "gross" ? "New gross" : m === "percent" ? "% change" : "Line by line"}</button>
                    ))}
                  </div>
                )}
                {(mode === "gross" || !current) && (
                  <Field label="Monthly gross (₦)"><Input type="number" className="h-8 text-xs" value={gross} placeholder={current ? String(currentFixed) : "e.g. 650000"} onChange={(e) => setGross(e.target.value)} /></Field>
                )}
                {current && mode === "percent" && <Field label="Change (%) — negative for a reduction"><Input type="number" step={0.5} className="h-8 text-xs" value={pctUp} onChange={(e) => setPctUp(e.target.value)} /></Field>}
                {current && mode === "lines" && (
                  <div className="space-y-1.5">
                    {current.lines.filter((l) => isFixed(l.code)).map((l) => (
                      <div key={l.code} className="grid grid-cols-[1fr_120px] items-center gap-2 text-[11px]">
                        <span>{elementOf.get(l.code)?.name ?? l.code}</span>
                        <Input type="number" className="h-7 text-[11px]" value={overrides[l.code] ?? l.amount} onChange={(e) => setOverrides({ ...overrides, [l.code]: Number(e.target.value) || 0 })} />
                      </div>
                    ))}
                  </div>
                )}
                <Field label="Effective from"><Input type="date" className="h-8 text-xs" value={date} onChange={(e) => setDate(e.target.value || firstOfNextMonth())} /></Field>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold">Voluntary pension (AVC)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={avcMode} onValueChange={setAvcMode}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={KEEP} className="text-xs">As today{profile?.avc ? ` (${profile.avc.mode === "percent" ? `${profile.avc.value}%` : money(profile.avc.value)})` : " (none)"}</SelectItem>
                      <SelectItem value={NONE} className="text-xs">None</SelectItem>
                      <SelectItem value="fixed" className="text-xs">Fixed ₦ a month</SelectItem>
                      <SelectItem value="percent" className="text-xs">% of pensionable pay</SelectItem>
                    </SelectContent>
                  </Select>
                  {(avcMode === "fixed" || avcMode === "percent") && <Input type="number" className="h-8 text-xs" value={avcValue} onChange={(e) => setAvcValue(e.target.value)} placeholder={avcMode === "percent" ? "%" : "₦"} />}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-4">
                <p className="text-xs font-semibold">HMO</p>
                <Select value={hmoPlan} onValueChange={setHmoPlan}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={KEEP} className="text-xs">As today{profile?.hmo ? ` (${plans.find((p) => p.id === profile.hmo?.planId)?.name ?? "enrolled"})` : " (none)"}</SelectItem>
                    <SelectItem value={NONE} className="text-xs">Not enrolled</SelectItem>
                    {plans.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{providerOf(p.providerId)} · {p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {hmoPlan !== KEEP && hmoPlan !== NONE && (
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={hmoCover} onValueChange={(v) => setHmoCover(v as "individual" | "family")}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="individual" className="text-xs">Individual</SelectItem><SelectItem value="family" className="text-xs">Family</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" min={0} className="h-8 text-xs" value={hmoDeps} onChange={(e) => setHmoDeps(e.target.value)} placeholder="Extra dependants" />
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Other deductions</p>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => setExtra([...deductions, { id: `X${Date.now()}`, code: "OTHER_DED", label: "Other deduction", amount: 0 }])}><Plus className="h-3 w-3" /> Add</Button>
                </div>
                {deductions.map((d) => (
                  <div key={d.id} className="grid grid-cols-[1fr_110px_28px] items-center gap-2 text-[11px]">
                    <span className="truncate">{d.label}</span>
                    <Input type="number" className="h-7 text-[11px]" value={d.amount} onChange={(e) => setExtra(deductions.map((x) => (x.id === d.id ? { ...x, amount: Number(e.target.value) || 0 } : x)))} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Remove" onClick={() => setExtra(deductions.filter((x) => x.id !== d.id))}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                {!deductions.length && <p className="text-[11px] text-muted-foreground">None.</p>}
                <p className="text-[10px] text-muted-foreground">Loan instalments and agreed deductions from the latest run. Changes here apply to the proposed side only.</p>
              </div>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {!result || !pro ? (
            <p className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">{emp || isNew ? "Enter a proposed salary to see the payslip." : "Choose an employee, or model a new hire."}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4">
                <Figure label="Net pay / month" value={money(pro.net)} sub={cur ? `${signed(pro.net - cur.net)} ${pctArrow(pct(cur.net, pro.net))}` : undefined} tone={cur && pro.net < cur.net ? "bad" : undefined} />
                <Figure label="Net pay / year" value={money(pro.net * 12, 0)} sub={cur ? signed((pro.net - cur.net) * 12) : undefined} />
                <Figure label="Cost to employer / month" value={money(pro.costToEmployer)} sub={cur ? `${signed(pro.costToEmployer - cur.costToEmployer)} ${pctArrow(pct(cur.costToEmployer, pro.costToEmployer))}` : undefined} tone={cur && pro.costToEmployer > cur.costToEmployer ? "warn" : undefined} />
                <Figure label="Cost to employer / year" value={money(pro.costToEmployer * 12, 0)} sub={cur ? signed((pro.costToEmployer - cur.costToEmployer) * 12) : undefined} />
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <p className="border-b px-4 py-3 text-sm font-semibold">{emp?.fullName ?? "New employee"} · payslip for a full month from {new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-xs">
                    <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
                      <tr><th className="px-4 py-2 font-medium" />{cur && <th className="px-4 py-2 text-right font-medium">Current</th>}<th className="px-4 py-2 text-right font-medium">Proposed</th>{cur && <th className="px-4 py-2 text-right font-medium">Change</th>}</tr>
                    </thead>
                    <tbody>
                      <Section title="Earnings" />
                      {result.rows.filter((r) => r.section === "earning").map((r) => <Line key={r.code} name={r.name} a={cur ? r.current : null} b={r.proposed} />)}
                      <Line name="Gross pay" a={cur?.gross ?? null} b={pro.gross} strong />
                      <Section title="Deductions" note="taken from pay" />
                      {result.rows.filter((r) => r.section === "deduction").map((r) => <Line key={r.code} name={r.name} a={cur ? r.current : null} b={r.proposed} invert />)}
                      <Line name="Total deductions" a={cur?.totalDeductions ?? null} b={pro.totalDeductions} strong invert />
                      <Line name="Net pay" a={cur?.net ?? null} b={pro.net} strong highlight />
                      <Section title="Employer contributions" note="paid on top — not deducted" />
                      {result.rows.filter((r) => r.section === "employer").map((r) => <Line key={r.code} name={r.name} a={cur ? r.current : null} b={r.proposed} invert />)}
                      <Line name="Total cost to employer" a={cur?.costToEmployer ?? null} b={pro.costToEmployer} strong invert />
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border bg-card p-4 text-xs">
                  <p className="text-sm font-semibold">Tax</p>
                  <p className="mt-1 text-muted-foreground">Effective PAYE rate {cur ? `${cur.effectiveRatePct}% → ` : ""}{pro.effectiveRatePct}% of gross. Annualised PAYE on a full month.</p>
                  <ul className="mt-2 space-y-1">
                    {pro.computation.tax.reliefs.map((r) => <li key={r.label} className="flex justify-between"><span>{r.label}</span><span className="tabular-nums">{money(r.period)}</span></li>)}
                  </ul>
                </div>
                <div className="rounded-xl border bg-card p-4 text-xs">
                  <p className="text-sm font-semibold">Make it real</p>
                  <p className="mt-1 text-muted-foreground">This page saves nothing. A salary change goes for approval through the salary change chain; voluntary pension and HMO are changed on the employee&apos;s tax &amp; statutory profile.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="gap-1.5" disabled={!salaryChanged} onClick={() => setPropose(true)}><Send className="h-3.5 w-3.5" /> Propose this salary change</Button>
                    {emp && <Button size="sm" variant="outline" asChild><Link href={`${PAYROLL_HREF}/settings?tab=profiles&employee=${emp.id}`}>Tax &amp; statutory profile</Link></Button>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={propose} onOpenChange={setPropose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Propose a salary change</DialogTitle>
            <DialogDescription>{emp?.fullName}: {money(currentFixed)} → {money(round2(proposedLines.filter((l) => isFixed(l.code)).reduce((s, l) => s + l.amount, 0)))} a month from {date}. It waits for approval before payroll uses it.</DialogDescription>
          </DialogHeader>
          <Field label="Reason"><Textarea className="min-h-20 text-xs" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Promotion to Senior Engineer, annual review" /></Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPropose(false)}>Cancel</Button>
            <Button
              disabled={reason.trim().length < 5 || !emp || !current}
              onClick={async () => {
                if (!emp || !current) return;
                const res = await actions.requestSalaryChange({ employeeId: emp.id, effectiveFrom: date, currency: current.currency, reason: reason.trim(), lines: proposedLines, evidence: null });
                if (!res.ok) return toast.error(res.reason);
                toast.success("Salary change sent for approval");
                setPropose(false);
                setReason("");
              }}
            >
              Send for approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, note }: { title: string; note?: string }) {
  return (
    <tr className="border-t">
      <td colSpan={4} className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}{note && <span className="ml-1.5 font-normal normal-case tracking-normal">· {note}</span>}</td>
    </tr>
  );
}

function Line({ name, a, b, strong, highlight, invert }: { name: string; a: number | null; b: number; strong?: boolean; highlight?: boolean; invert?: boolean }) {
  const d = a === null ? null : round2(b - a);
  const p = a ? ((b - a) / Math.abs(a)) * 100 : null;
  const good = d !== null && d !== 0 && (invert ? d < 0 : d > 0);
  return (
    <tr className={cn(strong && "border-t font-semibold", highlight && "bg-primary/5")}>
      <td className={cn("px-4 py-1.5", !strong && "pl-6")}>{name}</td>
      {a !== null && <td className="px-4 py-1.5 text-right tabular-nums text-muted-foreground">{money(a)}</td>}
      <td className="px-4 py-1.5 text-right tabular-nums">{money(b)}</td>
      {a !== null && (
        <td className={cn("whitespace-nowrap px-4 py-1.5 text-right tabular-nums", d && (good ? "text-emerald-700" : "text-rose-600"))}>
          {d ? `${signed(d)} ${pctArrow(p)}` : "—"}
        </td>
      )}
    </tr>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
