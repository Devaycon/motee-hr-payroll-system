"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { FUNDING_LABELS, hmoSplit } from "@/src/lib/payroll/hmo";
import { usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { EmployeeTaxProfile, HmoEnrolment, HmoPlan, HmoProvider, HmoSettings, PayrollSettings } from "@/src/lib/payroll/types";
import { money } from "./components/shared";

const NONE = "__none__";
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * Payroll Settings → Health (HMO): providers and plans. Premiums come from
 * the plan, not a % of salary; funding can be employer, employee or shared.
 */
export function HmoSettingsTab({ settings, canEdit }: { settings: PayrollSettings; canEdit: boolean }) {
  const actions = usePayrollActions();
  const { data } = useTenantPayroll();
  const [draft, setDraft] = useState<HmoSettings>(() => structuredClone(settings.hmo ?? { providers: [], plans: [] }));
  const changed = JSON.stringify(draft) !== JSON.stringify(settings.hmo ?? { providers: [], plans: [] });
  const enrolled = (planId: string) => (data?.profiles ?? []).filter((p) => p.hmo?.planId === planId).length;
  const setPlan = (id: string, c: Partial<HmoPlan>) => setDraft((d) => ({ ...d, plans: d.plans.map((p) => (p.id === id ? { ...p, ...c } : p)) }));
  const setProvider = (id: string, c: Partial<HmoProvider>) => setDraft((d) => ({ ...d, providers: d.providers.map((p) => (p.id === id ? { ...p, ...c } : p)) }));
  const num = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="max-w-3xl text-xs text-muted-foreground">
          <p className="text-sm font-semibold text-foreground">Health Maintenance Organisation (HMO)</p>
          <p className="mt-1">
            Premiums depend on the provider&apos;s plan and your policy, not a fixed share of salary. The employee&apos;s share is a payroll deduction (relieved from PAYE where the plan says so); the employer&apos;s share is an employer cost. Both are remitted to the provider from the Remittance Centre.
          </p>
          <p className="mt-1">Example: a ₦120,000 a year plan, shared 70/30, costs the employer ₦7,000 a month and deducts ₦3,000 from pay.</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={!changed} onClick={() => setDraft(structuredClone(settings.hmo ?? { providers: [], plans: [] }))}>Discard</Button>
            <Button size="sm" disabled={!changed} onClick={() => { actions.updateSettings({ hmo: draft }); toast.success("HMO settings saved — open runs will recalculate"); }}>Save HMO settings</Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Providers</p>
          {canEdit && <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => setDraft((d) => ({ ...d, providers: [...d.providers, { id: uid("HMOP"), name: "New provider" }] }))}><Plus className="h-3 w-3" /> Provider</Button>}
        </div>
        <div className="grid gap-2">
          {draft.providers.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_1fr_1fr_32px] items-end gap-2">
              <Field label="Name"><Input className="h-8 text-xs" disabled={!canEdit} value={p.name} onChange={(e) => setProvider(p.id, { name: e.target.value })} /></Field>
              <Field label="Bank (for remittance)"><Input className="h-8 text-xs" disabled={!canEdit} value={p.bankName ?? ""} onChange={(e) => setProvider(p.id, { bankName: e.target.value })} /></Field>
              <Field label="Account number"><Input className="h-8 text-xs" disabled={!canEdit} value={p.accountNumber ?? ""} onChange={(e) => setProvider(p.id, { accountNumber: e.target.value })} /></Field>
              {canEdit && <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Remove provider" disabled={draft.plans.some((x) => x.providerId === p.id)} onClick={() => setDraft((d) => ({ ...d, providers: d.providers.filter((x) => x.id !== p.id) }))}><Trash2 className="h-3.5 w-3.5" /></Button>}
            </div>
          ))}
          {!draft.providers.length && <p className="text-xs text-muted-foreground">No providers yet.</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Plans</p>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-[11px]"
              disabled={!draft.providers.length}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  plans: [...d.plans, { id: uid("HMO"), providerId: d.providers[0].id, name: "New plan", premiumPeriod: "annual", basis: "fixed", individualPremium: 120_000, familyPremium: 360_000, dependantPremium: 60_000, funding: "shared", employerSharePct: 70, employeeShareRelieved: true, employerShareTaxable: false, active: true }],
                }))
              }
            >
              <Plus className="h-3 w-3" /> Plan
            </Button>
          )}
        </div>
        <div className="grid gap-3">
          {draft.plans.map((p) => {
            const example = hmoSplit({ providers: draft.providers, plans: [p] }, { planId: p.id, coverage: "individual", dependants: 0 }, 300_000, "2999-12-31");
            return (
              <div key={p.id} className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{enrolled(p.id)} enrolled</Badge>
                  {example && <span className="text-[11px] text-muted-foreground">Individual cover: {money(example.premium)}/month — employer {money(example.employer)}, employee {money(example.employee)}</span>}
                  {canEdit && <Button size="sm" variant="ghost" className="ml-auto h-7 gap-1 text-[11px] text-rose-600" disabled={enrolled(p.id) > 0} onClick={() => setDraft((d) => ({ ...d, plans: d.plans.filter((x) => x.id !== p.id) }))}><Trash2 className="h-3 w-3" /> Remove</Button>}
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  <Field label="Plan name"><Input className="h-8 text-xs" disabled={!canEdit} value={p.name} onChange={(e) => setPlan(p.id, { name: e.target.value })} /></Field>
                  <Field label="Provider">
                    <Select value={p.providerId} disabled={!canEdit} onValueChange={(v) => setPlan(p.id, { providerId: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{draft.providers.map((x) => <SelectItem key={x.id} value={x.id} className="text-xs">{x.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Premium basis">
                    <Select value={p.basis} disabled={!canEdit} onValueChange={(v) => setPlan(p.id, { basis: v as HmoPlan["basis"] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="fixed" className="text-xs">Fixed amount</SelectItem><SelectItem value="percent_of_basic" className="text-xs">% of monthly basic</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Premium quoted">
                    <Select value={p.premiumPeriod} disabled={!canEdit || p.basis === "percent_of_basic"} onValueChange={(v) => setPlan(p.id, { premiumPeriod: v as HmoPlan["premiumPeriod"] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="annual" className="text-xs">Per year</SelectItem><SelectItem value="monthly" className="text-xs">Per month</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label={p.basis === "fixed" ? "Individual premium (₦)" : "Individual (% of basic)"}><Input type="number" className="h-8 text-xs" disabled={!canEdit} value={p.individualPremium} onChange={(e) => setPlan(p.id, { individualPremium: num(e.target.value) })} /></Field>
                  <Field label={p.basis === "fixed" ? "Family premium (₦)" : "Family (% of basic)"}><Input type="number" className="h-8 text-xs" disabled={!canEdit} value={p.familyPremium} onChange={(e) => setPlan(p.id, { familyPremium: num(e.target.value) })} /></Field>
                  <Field label="Per extra dependant (₦)"><Input type="number" className="h-8 text-xs" disabled={!canEdit} value={p.dependantPremium} onChange={(e) => setPlan(p.id, { dependantPremium: num(e.target.value) })} /></Field>
                  <Field label="Funding">
                    <Select value={p.funding} disabled={!canEdit} onValueChange={(v) => setPlan(p.id, { funding: v as HmoPlan["funding"] })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{(Object.keys(FUNDING_LABELS) as HmoPlan["funding"][]).map((f) => <SelectItem key={f} value={f} className="text-xs">{FUNDING_LABELS[f]}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  {p.funding === "shared" && <Field label="Employer share (%)"><Input type="number" min={0} max={100} className="h-8 text-xs" disabled={!canEdit} value={p.employerSharePct} onChange={(e) => setPlan(p.id, { employerSharePct: Math.min(100, num(e.target.value)) })} /></Field>}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  <label className="flex items-center gap-2"><Switch checked={p.employeeShareRelieved} disabled={!canEdit} onCheckedChange={(v) => setPlan(p.id, { employeeShareRelieved: v })} /> Employee share relieved from PAYE</label>
                  <label className="flex items-center gap-2"><Switch checked={p.employerShareTaxable} disabled={!canEdit} onCheckedChange={(v) => setPlan(p.id, { employerShareTaxable: v })} /> Employer share is a taxable benefit</label>
                  <label className="flex items-center gap-2"><Switch checked={p.active !== false} disabled={!canEdit} onCheckedChange={(v) => setPlan(p.id, { active: v })} /> Active</label>
                </div>
              </div>
            );
          })}
          {!draft.plans.length && <p className="text-xs text-muted-foreground">No plans yet. Add a provider first.</p>}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">Tax treatment defaults: the employee&apos;s share is relieved like NHIA and the employer&apos;s share is not a taxable benefit. Confirm with your tax adviser and change per plan if needed.</p>
      </div>
    </div>
  );
}

/** Enrolment fields for the tax & statutory profile dialog. */
export function HmoEnrolmentFields({ profile, onChange, canEdit }: { profile: EmployeeTaxProfile; onChange: (hmo: HmoEnrolment | null) => void; canEdit: boolean }) {
  const { data } = useTenantPayroll();
  const plans = (data?.settings.hmo?.plans ?? []).filter((p) => p.active !== false || p.id === profile.hmo?.planId);
  const providers = data?.settings.hmo?.providers ?? [];
  const e = profile.hmo;
  const split = data ? hmoSplit(data.settings.hmo, e, 0, "2999-12-31") : null;
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="HMO plan">
          <Select
            value={e?.planId ?? NONE}
            disabled={!canEdit || !plans.length}
            onValueChange={(v) => onChange(v === NONE ? null : { planId: v, coverage: e?.coverage ?? "individual", dependants: e?.dependants ?? 0, from: e?.from ?? new Date().toISOString().slice(0, 10) })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={plans.length ? "Not enrolled" : "No plans set up"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE} className="text-xs">Not enrolled</SelectItem>
              {plans.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{providers.find((x) => x.id === p.providerId)?.name} · {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {e && (
          <>
            <Field label="Cover">
              <Select value={e.coverage} disabled={!canEdit} onValueChange={(v) => onChange({ ...e, coverage: v as HmoEnrolment["coverage"] })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="individual" className="text-xs">Individual</SelectItem><SelectItem value="family" className="text-xs">Family</SelectItem></SelectContent>
              </Select>
            </Field>
            <Field label="Extra dependants"><Input type="number" min={0} className="h-8 text-xs" disabled={!canEdit} value={e.dependants} onChange={(ev) => onChange({ ...e, dependants: Math.max(0, Math.round(Number(ev.target.value) || 0)) })} /></Field>
            <Field label="Cover from"><Input type="date" className="h-8 text-xs" disabled={!canEdit} value={e.from ?? ""} onChange={(ev) => onChange({ ...e, from: ev.target.value || undefined })} /></Field>
          </>
        )}
      </div>
      {split && split.plan.basis === "fixed" && (
        <p className="text-[11px] text-muted-foreground">Premium {money(split.premium)}/month — employer pays {money(split.employer)}, deducted from pay {money(split.employee)}.</p>
      )}
    </div>
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
