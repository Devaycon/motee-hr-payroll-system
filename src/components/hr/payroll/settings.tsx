"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_HREF, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { ELEMENT_GROUP_LABELS, ELEMENT_GROUP_ORDER } from "@/src/lib/payroll/elements-seed";
import { bandLabel } from "@/src/lib/payroll/ng/rate-sets";
import { round2 } from "@/src/lib/payroll/ng/engine";
import { structureOn } from "@/src/lib/payroll/run-builder";
import { useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type {
  EmployeeTaxProfile,
  InsightType,
  PayElement,
  PayElementGroup,
  PayrollSettings,
  StatutoryRateSet,
} from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { NotSupported, money } from "./components/shared";

export function PayrollSettingsPage() {
  const params = useSearchParams();
  const { data, bundle, loading, supported } = useTenantPayroll();
  const canEdit = useCan(PAYROLL_SETTINGS_MODULE, "edit");
  const [tab, setTab] = useState(params.get("tab") ?? "general");

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !bundle) return <Skeleton className="h-[600px] w-full rounded-xl" />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Payroll
        </Link>
        <h1 className="mt-1 text-3xl font-semibold">Payroll Settings</h1>
        <p className="text-xs text-muted-foreground">
          How pay is calculated. Changes apply to draft runs when they&apos;re recalculated — finalized runs keep the rules they were paid under.
          {!canEdit && " You have read-only access."}
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            { value: "general", label: "General" },
            { value: "elements", label: `Pay Elements (${data.elements.length})` },
            { value: "structures", label: "Salary Structures" },
            { value: "profiles", label: "Tax & Statutory Profiles" },
            { value: "rates", label: "Statutory Rates" },
            { value: "payslip", label: "Payslip" },
          ]}
        />
        <TabsContent value="general" className="mt-4"><General settings={data.settings} employmentTypes={bundle.employmentTypes} canEdit={canEdit} /></TabsContent>
        <TabsContent value="elements" className="mt-4"><Elements elements={data.elements} enabled={data.settings.enabledGroups} canEdit={canEdit} /></TabsContent>
        <TabsContent value="structures" className="mt-4"><Structures canEdit={canEdit} /></TabsContent>
        <TabsContent value="profiles" className="mt-4"><Profiles canEdit={canEdit} focus={params.get("employee")} /></TabsContent>
        <TabsContent value="rates" className="mt-4"><Rates rateSets={data.rateSets} canEdit={canEdit} /></TabsContent>
        <TabsContent value="payslip" className="mt-4"><PayslipOptions settings={data.settings} canEdit={canEdit} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ title, description, children, right }: { title: string; description?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t py-3 first:border-0 first:pt-0">
      <div className="min-w-0 max-w-xl">
        <p className="text-xs font-medium">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// ── General ─────────────────────────────────────────────────────────────────

function General({ settings, employmentTypes, canEdit }: { settings: PayrollSettings; employmentTypes: { id: string; name: string }[]; canEdit: boolean }) {
  const actions = usePayrollActions();
  const set = (c: Partial<PayrollSettings>) => { actions.updateSettings(c); toast.success("Saved"); };
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Calculation" description="Rules the engine applies to every employee.">
        <Row label="PAYE method" hint="Cumulative spreads bonuses fairly and self-corrects; annualised taxes each month × 12. Confirm with your tax adviser.">
          <Select value={settings.taxMethod} onValueChange={(v) => set({ taxMethod: v as PayrollSettings["taxMethod"] })} disabled={!canEdit}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cumulative">Cumulative (recommended)</SelectItem>
              <SelectItem value="annualised">Annualised monthly</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Pro-rating for joiners & leavers" hint="How partial months are worked out.">
          <Select value={settings.prorationBasis} onValueChange={(v) => set({ prorationBasis: v as PayrollSettings["prorationBasis"] })} disabled={!canEdit}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="calendar_days">Calendar days</SelectItem>
              <SelectItem value="working_days">Working days</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Pay day" hint="Day of the month salaries are paid (moved to month end if shorter).">
          <NumberSetting value={settings.payDay} className="w-24" disabled={!canEdit} clamp={[1, 31]} onCommit={(v) => set({ payDay: v })} />
        </Row>
        <Row label="Input cut-off day" hint="Overtime, bonuses and changes after this day roll into next month.">
          <NumberSetting value={settings.inputCutoffDay} className="w-24" disabled={!canEdit} clamp={[1, 31]} onCommit={(v) => set({ inputCutoffDay: v })} />
        </Row>
      </Card>

      <Card title="Contributions & integrations">
        <Row label="NHIA health insurance deductions" hint="Off when the company provides a private HMO instead.">
          <Switch checked={settings.nhisEnabled} disabled={!canEdit} onCheckedChange={(v) => set({ nhisEnabled: v })} />
        </Row>
        <Row label="ITF applies to this company" hint="Employers with 5+ staff or ₦50m+ annual turnover.">
          <Switch checked={settings.itfApplicable} disabled={!canEdit} onCheckedChange={(v) => set({ itfApplicable: v })} />
        </Row>
        <Row label="Deduct loan instalments through payroll" hint="Pulls each active loan's instalment from Employee Loans and posts the repayment back on finalize.">
          <Switch checked={settings.deductLoansViaPayroll} disabled={!canEdit} onCheckedChange={(v) => set({ deductLoansViaPayroll: v })} />
        </Row>
        <Row label="Reimburse approved expenses with pay" hint="Approved claims are paid as a non-taxable line.">
          <Switch checked={settings.payExpensesViaPayroll} disabled={!canEdit} onCheckedChange={(v) => set({ payExpensesViaPayroll: v })} />
        </Row>
      </Card>

      <Card title="Validation thresholds" description="Checks that run before every submission.">
        <Row label="Net pay variance flag" hint="Flag anyone whose net pay moves more than this, month on month.">
          <div className="flex items-center gap-1"><NumberSetting value={settings.varianceThresholdPct} className="w-20" disabled={!canEdit} clamp={[0, 1000]} onCommit={(v) => set({ varianceThresholdPct: v })} /><span className="text-xs">%</span></div>
        </Row>
        <Row label="Basic salary sanity range (monthly)">
          <div className="flex items-center gap-1 text-xs">
            <NumberSetting value={settings.basicMin} className="w-28" disabled={!canEdit} clamp={[0, Number.MAX_SAFE_INTEGER]} onCommit={(v) => set({ basicMin: v })} /> –
            <NumberSetting value={settings.basicMax} className="w-32" disabled={!canEdit} clamp={[0, Number.MAX_SAFE_INTEGER]} onCommit={(v) => set({ basicMax: v })} />
          </div>
        </Row>
      </Card>

      <Card title="Treatment by employment type" description="Fixed-term contract staff are employees on PAYE; only the self-employed are paid with withholding tax.">
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Tax</th><th className="px-3 py-2 font-medium">Pension</th><th className="px-3 py-2 font-medium">NHF</th></tr>
            </thead>
            <tbody>
              {employmentTypes.map((t) => {
                const r = settings.employmentTypeRules[t.id] ?? { regime: "paye", pension: true, nhf: true };
                const upd = (c: Partial<typeof r>) => set({ employmentTypeRules: { ...settings.employmentTypeRules, [t.id]: { ...r, ...c } } });
                return (
                  <tr key={t.id} className="border-t">
                    <td className="px-3 py-1.5">{t.name}</td>
                    <td className="px-3 py-1.5">
                      <Select value={r.regime} onValueChange={(v) => upd({ regime: v as typeof r.regime })} disabled={!canEdit}>
                        <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paye">PAYE</SelectItem>
                          <SelectItem value="wht">WHT</SelectItem>
                          <SelectItem value="exempt">Exempt</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-1.5"><Switch checked={r.pension} disabled={!canEdit} onCheckedChange={(v) => upd({ pension: v })} /></td>
                    <td className="px-3 py-1.5"><Switch checked={r.nhf} disabled={!canEdit} onCheckedChange={(v) => upd({ nhf: v })} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Pay elements ────────────────────────────────────────────────────────────

function Flag({ on, label }: { on: boolean; label: string }) {
  return on ? <Badge variant="outline" className="text-[9px]">{label}</Badge> : null;
}

function Elements({ elements, enabled, canEdit }: { elements: PayElement[]; enabled: PayElementGroup[]; canEdit: boolean }) {
  const actions = usePayrollActions();
  const [adding, setAdding] = useState(false);
  return (
    <Card
      title="Pay Element Master"
      description="Every earning, deduction and employer contribution the payroll knows. Turn off groups your company doesn't use; codes never change once used, because payslip history depends on them."
      right={canEdit && <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Custom element</Button>}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {ELEMENT_GROUP_ORDER.map((g) => {
          const items = elements.filter((e) => e.group === g);
          const on = enabled.includes(g);
          const locked = g === "statutory" || g === "employer" || g === "core";
          return (
            <div key={g} className={cn("rounded-lg border", !on && "opacity-60")}>
              <div className="flex items-center justify-between border-b px-3 py-2">
                <p className="text-xs font-semibold">{ELEMENT_GROUP_LABELS[g]} <span className="font-normal text-muted-foreground">({items.length})</span></p>
                {locked ? (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Lock className="h-3 w-3" /> Always on</span>
                ) : (
                  <Switch
                    checked={on}
                    disabled={!canEdit}
                    onCheckedChange={(v) => actions.updateSettings({ enabledGroups: v ? [...enabled, g] : enabled.filter((x) => x !== g) })}
                  />
                )}
              </div>
              <div className="max-h-56 divide-y overflow-y-auto">
                {items.map((e) => (
                  <div key={e.code} className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs">{e.name} {e.custom && <Badge variant="outline" className="ml-1 text-[9px]">Custom</Badge>}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{e.code}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1">
                      <Flag on={e.statutory} label="Statutory" />
                      <Flag on={e.category === "earning" && e.taxable} label="Taxable" />
                      <Flag on={e.category === "earning" && !e.taxable} label="Non-taxable" />
                      <Flag on={e.pensionable} label="Pensionable" />
                      <Flag on={e.recurring} label="Recurring" />
                      <Flag on={!!e.preTax} label="Pre-tax" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <NewElementDialog open={adding} onClose={() => setAdding(false)} existing={elements} onSave={(el) => { actions.upsertElement(el); toast.success(`${el.name} added`); }} />
    </Card>
  );
}

function NewElementDialog({ open, onClose, existing, onSave }: { open: boolean; onClose: () => void; existing: PayElement[]; onSave: (e: PayElement) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"earning" | "deduction">("earning");
  const [group, setGroup] = useState<PayElementGroup>("allowances");
  const [taxable, setTaxable] = useState(true);
  const [pensionable, setPensionable] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const code = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24);
  const clash = existing.some((e) => e.code === code);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New pay element</DialogTitle>
          <DialogDescription>Statutory items are system-owned; this adds a company-specific earning or deduction.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Generator Allowance" />
            {code && <p className={cn("font-mono text-[10px]", clash ? "text-rose-600" : "text-muted-foreground")}>Code: {code}{clash && " — already exists"}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v as typeof category); setGroup(v === "earning" ? "allowances" : "other_deductions"); }}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Group</Label>
              <Select value={group} onValueChange={(v) => setGroup(v as PayElementGroup)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ELEMENT_GROUP_ORDER.filter((g) => g !== "statutory" && g !== "employer" && (category === "earning" ? g !== "other_deductions" : g === "other_deductions")).map((g) => (
                    <SelectItem key={g} value={g} className="text-xs">{ELEMENT_GROUP_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {category === "earning" && (
            <>
              <Row label="Taxable"><Switch checked={taxable} onCheckedChange={setTaxable} /></Row>
              <Row label="Pensionable" hint="By law, pension is calculated on basic + housing + transport at minimum."><Switch checked={pensionable} onCheckedChange={setPensionable} /></Row>
            </>
          )}
          <Row label="Recurring every month"><Switch checked={recurring} onCheckedChange={setRecurring} /></Row>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!code || clash}
            onClick={() => {
              onSave({ code, name: name.trim(), category, group, calculationType: "fixed", taxable: category === "earning" ? taxable : false, pensionable: category === "earning" && pensionable, recurring, proratable: recurring, statutory: false, active: true, custom: true });
              onClose();
              setName("");
            }}
          >
            Add element
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Salary structures ───────────────────────────────────────────────────────

function Structures({ canEdit }: { canEdit: boolean }) {
  const { data, bundle } = useTenantPayroll();
  const actions = usePayrollActions();
  const people = (bundle?.employees ?? []).filter((e) => e.status !== "terminated");
  const [employeeId, setEmployeeId] = useState(people[0]?.id ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const versions = (data?.structures ?? []).filter((s) => s.employeeId === employeeId).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const current = data ? structureOn(data.structures, employeeId, today) : null;
  const [draft, setDraft] = useState<Record<string, number> | null>(null);
  const [effective, setEffective] = useState(today.slice(0, 8) + "01");
  const [reason, setReason] = useState("");
  const elements = data?.elements ?? [];
  const total = (lines: { amount: number }[]) => round2(lines.reduce((s, l) => s + l.amount, 0));

  return (
    <Card
      title="Salary structures"
      description="What each person is paid every month, versioned: a raise is a new version from its effective date, so “what were they paid in March” always has an answer. Changes go through the salary change approval chain; a back-dated change pays arrears automatically in the next payroll."
      right={
        <Select value={employeeId} onValueChange={(v) => { setEmployeeId(v); setDraft(null); }}>
          <SelectTrigger className="h-8 w-64 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-80">{people.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.fullName} · {p.jobTitle}</SelectItem>)}</SelectContent>
        </Select>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.id} className={cn("rounded-lg border p-3", v === current && "border-primary/40 bg-primary/5", v.status === "rejected" && "opacity-50")}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">
                  {v.effectiveFrom} → {v.status === "pending" || v.status === "rejected" ? "—" : v.effectiveTo ?? "now"}{" "}
                  {v === current && <Badge className="ml-1 text-[9px]">Current</Badge>}
                  {v.status === "pending" && <Badge variant="outline" className="ml-1 border-amber-500/40 text-[9px] text-amber-700">Awaiting approval</Badge>}
                  {v.status === "rejected" && <Badge variant="outline" className="ml-1 text-[9px]">Rejected</Badge>}
                </p>
                <p className="text-xs font-semibold tabular-nums">{money(total(v.lines))}/mo</p>
              </div>
              <p className="text-[11px] text-muted-foreground">{v.reason}{v.approvedBy ? ` · ${v.status === "rejected" ? "rejected" : "approved"} by ${v.approvedBy}` : ""}</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 text-[11px]">
                {v.lines.map((l) => (
                  <div key={l.code} className="flex justify-between"><span className="text-muted-foreground">{elements.find((e) => e.code === l.code)?.name ?? l.code}</span><span className="tabular-nums">{money(l.amount, 0)}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {canEdit && current && !versions.some((v) => v.status === "pending") && (
          <div className="rounded-lg border p-4">
            <p className="mb-3 text-xs font-semibold">Propose a salary change</p>
            {current.lines.map((l) => (
              <div key={l.code} className="flex items-center justify-between gap-2 py-1">
                <span className="text-xs text-muted-foreground">{elements.find((e) => e.code === l.code)?.name ?? l.code}</span>
                <Input
                  type="number"
                  className="h-7 w-36 text-right text-xs"
                  value={(draft ?? Object.fromEntries(current.lines.map((x) => [x.code, x.amount])))[l.code]}
                  onChange={(e) => setDraft({ ...(draft ?? Object.fromEntries(current.lines.map((x) => [x.code, x.amount]))), [l.code]: Number(e.target.value) })}
                />
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t pt-2 text-xs font-semibold">
              <span>Monthly gross</span>
              <span className="tabular-nums">{money(total(Object.values(draft ?? Object.fromEntries(current.lines.map((x) => [x.code, x.amount]))).map((amount) => ({ amount }))))}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-[11px]">Effective from</Label><Input type="date" className="h-8 text-xs" value={effective} onChange={(e) => setEffective(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-[11px]">Reason</Label><Input className="h-8 text-xs" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Annual review 2026" /></div>
            </div>
            <Button
              size="sm"
              className="mt-3 w-full"
              disabled={!draft || !reason.trim() || effective <= current.effectiveFrom}
              onClick={async () => {
                const res = await actions.requestSalaryChange({
                  employeeId,
                  effectiveFrom: effective,
                  currency: current.currency,
                  reason: reason.trim(),
                  lines: Object.entries(draft!).map(([code, amount]) => ({ code, amount })),
                });
                if (!res.ok) {
                  toast.error(res.reason);
                  return;
                }
                setDraft(null);
                setReason("");
                toast.success("Salary change sent for approval", {
                  description: effective < today ? "It's back-dated: once approved, the arrears are added to the next payroll run automatically." : "Payroll uses it once it's approved.",
                });
              }}
            >
              Send for approval
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Tax profiles ────────────────────────────────────────────────────────────

function Profiles({ canEdit, focus }: { canEdit: boolean; focus: string | null }) {
  const { data, bundle } = useTenantPayroll();
  const [editing, setEditing] = useState<string | null>(focus);
  const people = new Map((bundle?.employees ?? []).map((e) => [e.id, e]));
  const rows = (data?.profiles ?? []).filter((p) => people.get(p.employeeId)?.status !== "terminated");
  const profile = rows.find((p) => p.employeeId === editing) ?? null;
  return (
    <Card
      title="Tax & statutory profiles"
      description="Everything the statutory engine needs per person. Rent Relief only applies once the tenancy agreement or receipt is verified."
    >
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[820px] text-xs">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Employee</th><th className="px-3 py-2 font-medium">TIN</th><th className="px-3 py-2 font-medium">Tax state</th>
              <th className="px-3 py-2 font-medium">PFA · RSA PIN</th><th className="px-3 py-2 text-right font-medium">Annual rent</th><th className="px-3 py-2 font-medium">Evidence</th><th className="px-3 py-2 font-medium">Bank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.employeeId} className={cn("cursor-pointer border-t hover:bg-muted/40", focus === p.employeeId && "bg-primary/5")} onClick={() => setEditing(p.employeeId)}>
                <td className="px-3 py-2 font-medium">{people.get(p.employeeId)?.fullName}</td>
                <td className={cn("px-3 py-2 font-mono", !p.tin && "text-rose-600")}>{p.tin || "Missing"}</td>
                <td className="px-3 py-2">{p.stateOfResidence}</td>
                <td className="px-3 py-2"><p>{p.pfaName}</p><p className="font-mono text-[10px] text-muted-foreground">{p.rsaPin || "—"}</p></td>
                <td className="px-3 py-2 text-right tabular-nums">{p.annualRentDeclared ? money(p.annualRentDeclared, 0) : "—"}</td>
                <td className="px-3 py-2">{p.annualRentDeclared ? (p.rentEvidenceVerified ? <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-600">Verified</Badge> : <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-600">To verify</Badge>) : "—"}</td>
                <td className="px-3 py-2">{p.bankName} <span className="text-muted-foreground">({p.bankCode || "no code"})</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {profile && <ProfileDialog key={profile.employeeId} profile={profile} name={people.get(profile.employeeId)?.fullName ?? ""} canEdit={canEdit} onClose={() => setEditing(null)} />}
    </Card>
  );
}

function ProfileDialog({ profile, name, canEdit, onClose }: { profile: EmployeeTaxProfile; name: string; canEdit: boolean; onClose: () => void }) {
  const actions = usePayrollActions();
  const [p, setP] = useState(profile);
  const field = (key: keyof EmployeeTaxProfile, label: string, type: "text" | "number" = "text") => (
    <div className="space-y-1">
      <Label className="text-[11px]">{label}</Label>
      <Input
        type={type}
        className="h-8 text-xs"
        disabled={!canEdit}
        value={String(p[key] ?? "")}
        onChange={(e) => setP({ ...p, [key]: type === "number" ? Number(e.target.value) || 0 : e.target.value })}
      />
    </div>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{name} — tax &amp; statutory profile</DialogTitle>
          <DialogDescription>PAYE is remitted to the State IRS where the employee lives, not where the company is.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          {field("tin", "Tax ID (TIN)")}
          {field("stateOfResidence", "State of residence")}
          {field("nhfNumber", "NHF number")}
          {field("pfaName", "Pension administrator (PFA)")}
          {field("pfaCode", "PFA code")}
          {field("rsaPin", "RSA PIN")}
          {field("bankName", "Bank")}
          {field("bankCode", "NIBSS bank code")}
          {field("accountNumber", "Account number")}
          {field("annualRentDeclared", "Annual rent paid (₦)", "number")}
          {field("lifeAssurancePremiumAnnual", "Life assurance premium / yr (₦)", "number")}
          {field("mortgageInterestAnnual", "Mortgage interest / yr (₦)", "number")}
        </div>
        <div className="space-y-2 rounded-lg border p-3">
          <Row label="Rent evidence verified" hint={p.rentEvidence ? `On file: ${p.rentEvidence.fileName}` : "No tenancy agreement or receipt uploaded."}>
            <Switch checked={p.rentEvidenceVerified} disabled={!canEdit || !p.annualRentDeclared} onCheckedChange={(v) => setP({ ...p, rentEvidenceVerified: v })} />
          </Row>
          <Row label="NHF eligible"><Switch checked={p.nhfEligible} disabled={!canEdit} onCheckedChange={(v) => setP({ ...p, nhfEligible: v })} /></Row>
          <Row label="Enrolled in NHIA"><Switch checked={p.nhisEnrolled} disabled={!canEdit} onCheckedChange={(v) => setP({ ...p, nhisEnrolled: v })} /></Row>
        </div>
        {p.annualRentDeclared > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Rent relief: 20% of {money(p.annualRentDeclared, 0)} = {money(Math.min(p.annualRentDeclared * 0.2, 500_000), 0)} a year{p.annualRentDeclared * 0.2 > 500_000 && " (capped at ₦500,000)"}
            {!p.rentEvidenceVerified && " — not applied until the evidence is verified"}.
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {canEdit && (
            <Button
              onClick={() => {
                const changes = Object.fromEntries(Object.entries(p).filter(([k, v]) => profile[k as keyof EmployeeTaxProfile] !== v)) as Partial<EmployeeTaxProfile>;
                if (Object.keys(changes).length) actions.updateTaxProfile(profile.employeeId, changes);
                toast.success("Profile saved", { description: "Recalculate draft runs to apply it." });
                onClose();
              }}
            >
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Statutory rates ─────────────────────────────────────────────────────────

function Rates({ rateSets, canEdit }: { rateSets: StatutoryRateSet[]; canEdit: boolean }) {
  const actions = usePayrollActions();
  const sorted = [...rateSets].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const [adding, setAdding] = useState(false);
  const latest = sorted[0];
  const actor = useCurrentActor();
  const [effectiveYear, setEffectiveYear] = useState(String(Math.max(new Date().getFullYear() + 1, Number(latest.effectiveFrom.slice(0, 4)) + 1)));
  const effective = `${effectiveYear}-01-01`;
  const [label, setLabel] = useState("");
  const [rates, setRates] = useState(latest.payeBands.map((b) => b.rate * 100));
  return (
    <Card
      title="Statutory rate sets"
      description="Tax bands and statutory rates are data, not code. Each pay period uses the set in force on its own date, so re-running an old month uses that month's rules. When the law changes, add a new set."
      right={
        canEdit && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setRates(latest.payeBands.map((b) => b.rate * 100));
              setLabel("");
              setAdding(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> New rate set
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {sorted.map((rs, i) => (
          <div key={rs.id} className={cn("rounded-lg border p-4", i === 0 && "border-primary/40")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{rs.label} {i === 0 && <Badge className="ml-1 text-[9px]">Latest</Badge>}</p>
              <p className="text-xs text-muted-foreground">Effective {rs.effectiveFrom} · added by {rs.createdBy}</p>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{rs.legalBasis}</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground"><tr><th className="pb-1 font-medium">PAYE band (annual)</th><th className="pb-1 text-right font-medium">Rate</th></tr></thead>
                <tbody>{rs.payeBands.map((b, j) => <tr key={j} className="border-t"><td className="py-1">{bandLabel(j, rs.payeBands)}</td><td className="py-1 text-right tabular-nums">{Math.round(b.rate * 100)}%</td></tr>)}</tbody>
              </table>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {[
                  ["Rent relief", `${rs.rentReliefRate * 100}% of rent, max ${money(rs.rentReliefCap, 0)}`],
                  ["Minimum wage (exempt)", `${money(rs.minimumWageMonthly, 0)}/month`],
                  ["Pension", `${rs.employeePensionRate * 100}% employee · ${rs.employerPensionRate * 100}% employer`],
                  ["Pension base", "Basic + housing + transport"],
                  ["NHF", `${rs.nhfRate * 100}% of basic`],
                  ["NHIA", `${rs.nhisEmployeeRate * 100}% / ${rs.nhisEmployerRate * 100}% of basic`],
                  ["NSITF", `${rs.nsitfRate * 100}% of payroll`],
                  ["ITF", `${rs.itfRate * 100}% of payroll`],
                  ["Group life", `${rs.groupLifeMultiplier}× annual emoluments`],
                  ["Loss-of-office exempt", money(rs.lossOfOfficeExemption, 0)],
                  ["CRA", "Repealed from 1 Jan 2026"],
                ].map(([k, v]) => (
                  <div key={k} className="contents"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          Rates are seeded from industry reporting of the Nigeria Tax Act 2025. Confirm them against Nigeria Revenue Service guidance with your tax adviser before the first live payroll.
        </p>
      </div>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New statutory rate set</DialogTitle>
            <DialogDescription>Starts from the latest set and applies from 1 January of the tax year, so a year is never taxed under two sets of bands. Earlier periods keep their rules.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Tax year (from 1 January)</Label><Input type="number" min={Number(latest.effectiveFrom.slice(0, 4)) + 1} value={effectiveYear} onChange={(e) => setEffectiveYear(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Finance Act 2027" /></div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">PAYE band rates (%)</Label>
              {latest.payeBands.map((b, j) => (
                <div key={j} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{bandLabel(j, latest.payeBands)}</span>
                  <Input type="number" className="h-7 w-20 text-right text-xs" value={rates[j]} onChange={(e) => setRates(rates.map((r, k) => (k === j ? Number(e.target.value) : r)))} />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            <Button
              disabled={!label.trim() || effective <= latest.effectiveFrom}
              onClick={() => {
                actions.addRateSet({ ...latest, id: `NG-RS-${effective}`, label: label.trim(), effectiveFrom: effective, payeBands: latest.payeBands.map((b, j) => ({ ...b, rate: rates[j] / 100 })), createdBy: actor.name, createdAt: new Date().toISOString().slice(0, 10) });
                setAdding(false);
                toast.success("Rate set added", { description: `Applies to pay periods from ${effective}.` });
              }}
            >
              Add rate set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Payslip ─────────────────────────────────────────────────────────────────

const INSIGHT_LABELS: Record<InsightType, { label: string; hint: string }> = {
  net_change: { label: "Net pay change explainer", hint: "“₦12,400 higher than last month, mainly due to overtime”" },
  tax_progress: { label: "Tax-year progress", hint: "PAYE paid so far and the full-year figure at this month's pay" },
  deduction_split: { label: "Where your deductions go", hint: "Tax / pension / other as a share of gross" },
  pension_growth: { label: "Pension growth", hint: "This month's contributions from employee and employer" },
  leave_nudge: { label: "Leave balance reminder", hint: "Days left in the leave year — informational only" },
};

function PayslipOptions({ settings, canEdit }: { settings: PayrollSettings; canEdit: boolean }) {
  const actions = usePayrollActions();
  const p = settings.payslip;
  const set = (c: Partial<PayrollSettings["payslip"]>) => actions.updateSettings({ payslip: { ...p, ...c } });
  const sections = useMemo(
    () => [
      { key: "showEmployerContributions" as const, label: "Show employer contributions", hint: "Clearly labelled “paid by your employer — not deducted from your pay”." },
      { key: "showTaxBreakdown" as const, label: "Show “How your tax was calculated”", hint: "Reliefs and the band-by-band table." },
      { key: "showLeaveBalance" as const, label: "Show annual leave balance" },
    ],
    [],
  );
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Sections" description="Applies to payslips issued from now on — issued payslips never change.">
        {sections.map((s) => (
          <Row key={s.key} label={s.label} hint={s.hint}>
            <Switch checked={p[s.key]} disabled={!canEdit} onCheckedChange={(v) => set({ [s.key]: v })} />
          </Row>
        ))}
      </Card>
      <Card title="“Your pay at a glance” insights" description="Plain-English explanations computed once when the payslip is issued. Nothing predictive and no advice.">
        {(Object.keys(INSIGHT_LABELS) as InsightType[]).map((k) => (
          <Row key={k} label={INSIGHT_LABELS[k].label} hint={INSIGHT_LABELS[k].hint}>
            <Switch checked={p.insights[k]} disabled={!canEdit} onCheckedChange={(v) => set({ insights: { ...p.insights, [k]: v } })} />
          </Row>
        ))}
      </Card>
      {canEdit && <ResetDemo />}
    </div>
  );
}

function ResetDemo() {
  const actions = usePayrollActions();
  return (
    <Card title="Demo data" description="Rebuild the payroll history (Aug–Oct finalized, current month in draft) from the tenant's records. Local payroll edits are lost.">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { actions.resetDemo(); toast.success("Payroll demo data rebuilt"); }}>
        <RotateCcw className="h-3.5 w-3.5" /> Reset payroll demo
      </Button>
    </Card>
  );
}

/** A number setting saved on blur — only when it changed — and refreshed when the stored value changes. */
function NumberSetting({ value, onCommit, clamp, className, disabled }: { value: number; onCommit: (v: number) => void; clamp: [number, number]; className?: string; disabled?: boolean }) {
  const [text, setText] = useState(String(value));
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setText(String(value));
  }
  return (
    <Input
      type="number"
      className={cn("h-8 text-xs", className)}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const n = Math.min(clamp[1], Math.max(clamp[0], Number(text) || 0));
        setText(String(n));
        if (n !== value) onCommit(n);
      }}
    />
  );
}
