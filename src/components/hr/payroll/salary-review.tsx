"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Paperclip, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { PAYROLL_HREF, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { round2 } from "@/src/lib/payroll/ng/engine";
import { structureOn } from "@/src/lib/payroll/run-builder";
import { adjustLines, salaryImpact, type BulkChangeMode } from "@/src/lib/payroll/salary-impact";
import { usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { Figure, compactNaira } from "./components/charts";
import { NotSupported, money } from "./components/shared";

const ALL = "__all__";
const REASONS = ["Annual salary review", "Promotion", "Organisational restructuring", "Cost-of-living adjustment", "Market adjustment"];

/**
 * `/time-payroll/payroll/salary-review` — bulk salary changes for annual
 * reviews, promotions and restructuring: pick the people, apply a % or a
 * fixed increase (per person if needed), see the cost, and send the whole
 * review for approval as one request. Each person gets a new salary
 * structure version with the impact and evidence recorded on it.
 */
export function SalaryReviewPage() {
  const router = useRouter();
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const canEdit = useCan(PAYROLL_SETTINGS_MODULE, "edit");
  const today = new Date().toISOString().slice(0, 10);
  const [dept, setDept] = useState(ALL);
  const [grade, setGrade] = useState(ALL);
  const [mode, setMode] = useState<BulkChangeMode>("percent");
  const [value, setValue] = useState(10);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<Set<string> | null>(null);
  const [effective, setEffective] = useState(`${new Date().getFullYear() + 1}-01-01`);
  const [reason, setReason] = useState(REASONS[0]);
  const [evidence, setEvidence] = useState<{ fileName: string; uploadedAt: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const elements = useMemo(() => new Map((data?.elements ?? []).map((e) => [e.code, e])), [data]);
  const isFixed = (code: string) => {
    const el = elements.get(code);
    return !!el && el.calculationType === "fixed" && (el.group === "core" || el.group === "allowances");
  };

  const eligible = useMemo(() => {
    if (!data || !bundle) return [];
    const pending = new Set(data.structures.filter((s) => s.status === "pending").map((s) => s.employeeId));
    return bundle.employees
      .filter((e) => e.status !== "terminated" && !pending.has(e.id))
      .map((e) => ({ emp: e, current: structureOn(data.structures, e.id, today) }))
      .filter((x) => !!x.current)
      .sort((a, b) => a.emp.departmentName.localeCompare(b.emp.departmentName) || a.emp.fullName.localeCompare(b.emp.fullName));
  }, [data, bundle, today]);
  const departments = [...new Set(eligible.map((x) => x.emp.departmentName))].sort();
  const grades = [...new Set(eligible.map((x) => x.emp.grade).filter(Boolean) as string[])].sort();
  const shown = eligible.filter((x) => (dept === ALL || x.emp.departmentName === dept) && (grade === ALL || x.emp.grade === grade));
  const selected = picked ?? new Set(shown.map((x) => x.emp.id));

  const rows = useMemo(() => {
    if (!data) return [];
    return shown
      .filter((x) => selected.has(x.emp.id))
      .map((x) => {
        const v = overrides[x.emp.id] ?? value;
        const lines = adjustLines(x.current!.lines, mode, v, isFixed);
        const impact = salaryImpact(data, x.emp, lines, effective);
        return { ...x, v, lines, impact };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, shown.map((x) => x.emp.id).join(), [...selected].join(), overrides, value, mode, effective]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !bundle) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!canEdit) return <p className="py-20 text-center text-sm text-muted-foreground">Salary reviews need payroll settings edit access.</p>;

  const sum = (f: (r: (typeof rows)[number]) => number) => round2(rows.reduce((s, r) => s + f(r), 0));
  const grossBefore = sum((r) => r.impact.before.gross);
  const grossAfter = sum((r) => r.impact.after.gross);
  const costDelta = sum((r) => r.impact.after.employerCost - r.impact.before.employerCost);
  const toggle = (id: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    setPicked(next);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div>
        <Link href={`${PAYROLL_HREF}/settings?tab=structures`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Salary structures</Link>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold"><Users className="h-7 w-7 text-primary" /> Bulk salary review</h1>
        <p className="max-w-2xl text-xs text-muted-foreground">Annual reviews, promotions and restructuring in one go: choose who, apply the change, check the financial impact, then send the whole review for approval. Payroll applies it from the effective date; back-dated reviews pay arrears.</p>
      </div>

      <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-3 xl:grid-cols-6">
        <Field label="Department">
          <Select value={dept} onValueChange={(v) => { setDept(v); setPicked(null); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL} className="text-xs">All departments</SelectItem>{departments.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Grade">
          <Select value={grade} onValueChange={(v) => { setGrade(v); setPicked(null); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value={ALL} className="text-xs">All grades</SelectItem>{grades.map((g) => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Change">
          <div className="flex gap-1.5">
            <Select value={mode} onValueChange={(v) => setMode(v as BulkChangeMode)}>
              <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="percent" className="text-xs">%</SelectItem><SelectItem value="fixed" className="text-xs">₦ / month</SelectItem></SelectContent>
            </Select>
            <Input type="number" className="h-8 text-xs" value={value} onChange={(e) => setValue(Number(e.target.value) || 0)} />
          </div>
        </Field>
        <Field label="Effective from"><Input type="date" className="h-8 text-xs" value={effective} onChange={(e) => setEffective(e.target.value)} /></Field>
        <Field label="Reason">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Supporting evidence">
          <label className="flex h-8 cursor-pointer items-center gap-1.5 truncate rounded-md border px-2 text-[11px] hover:bg-muted">
            <Paperclip className="h-3 w-3 shrink-0" /> <span className="truncate">{evidence?.fileName ?? "Attach review sheet"}</span>
            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; setEvidence(f ? { fileName: f.name, uploadedAt: new Date().toISOString() } : null); }} />
          </label>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 md:grid-cols-4">
        <Figure label="Employees" value={String(rows.length)} sub={`of ${shown.length} shown`} />
        <Figure label="Monthly gross" value={compactNaira(grossAfter)} sub={`from ${compactNaira(grossBefore)}`} />
        <Figure label="Monthly cost change" value={`${costDelta >= 0 ? "+" : ""}${compactNaira(costDelta)}`} sub="Gross + employer contributions" tone="warn" />
        <Figure label="Annual cost change" value={`${costDelta >= 0 ? "+" : ""}${compactNaira(costDelta * 12)}`} />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[980px] text-xs">
          <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
            <tr>
              <th className="w-8 px-3 py-2"><Checkbox checked={rows.length === shown.length && shown.length > 0} onCheckedChange={(v) => setPicked(v ? new Set(shown.map((x) => x.emp.id)) : new Set())} /></th>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">{mode === "percent" ? "Increase %" : "₦ / month"}</th>
              <th className="px-3 py-2 text-right font-medium">Gross now</th>
              <th className="px-3 py-2 text-right font-medium">Gross proposed</th>
              <th className="px-3 py-2 text-right font-medium">PAYE</th>
              <th className="px-3 py-2 text-right font-medium">Net pay</th>
              <th className="px-3 py-2 text-right font-medium">Employer cost Δ</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((x) => {
              const r = rows.find((y) => y.emp.id === x.emp.id);
              const on = selected.has(x.emp.id);
              return (
                <tr key={x.emp.id} className={cn("border-t", !on && "opacity-50")}>
                  <td className="px-3 py-1.5"><Checkbox checked={on} onCheckedChange={(v) => toggle(x.emp.id, !!v)} /></td>
                  <td className="px-3 py-1.5">{x.emp.fullName}<span className="block text-[10px] text-muted-foreground">{x.emp.departmentName}{x.emp.grade ? ` · ${x.emp.grade}` : ""}</span></td>
                  <td className="px-3 py-1.5"><Input type="number" disabled={!on} className="h-7 w-24 text-xs" value={overrides[x.emp.id] ?? value} onChange={(e) => setOverrides({ ...overrides, [x.emp.id]: Number(e.target.value) || 0 })} /></td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{money(x.current!.lines.reduce((s, l) => s + l.amount, 0), 0)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r ? money(r.impact.after.gross, 0) : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r ? `${money(r.impact.before.paye, 0)} → ${money(r.impact.after.paye, 0)}` : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r ? `${money(r.impact.before.net, 0)} → ${money(r.impact.after.net, 0)}` : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{r ? money(r.impact.after.employerCost - r.impact.before.employerCost, 0) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <p className="text-[11px] text-muted-foreground">One approval request covers the whole review. People with a salary change already awaiting approval are left out.</p>
        <Button
          className="gap-1.5"
          disabled={!rows.length || busy || !effective}
          onClick={async () => {
            setBusy(true);
            const res = await actions.requestBulkSalaryChange({ items: rows.map((r) => ({ employeeId: r.emp.id, lines: r.lines })), effectiveFrom: effective, reason, evidence });
            setBusy(false);
            if (!res.ok) return toast.error(res.reason);
            toast.success(`Salary review for ${rows.length} employees sent for approval`);
            router.push(`${PAYROLL_HREF}/settings?tab=structures`);
          }}
        >
          <ShieldCheck className="h-4 w-4" /> Send {rows.length} change{rows.length === 1 ? "" : "s"} for approval
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
