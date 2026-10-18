"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Switch } from "@/src/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { deleteScheme, upsertScheme } from "@/src/lib/stores/sickness-slice";
import { SSP_RULES } from "@/src/lib/sickness/sick-pay";
import {
  ENTITLEMENT_PERIOD_LABELS,
  ENTITLEMENT_UNIT_LABELS,
  NOTIFY_ROLES,
  PART_TIME_FORMULA_LABELS,
  type EntitlementPeriod,
  type EntitlementUnit,
  type PartTimeFormula,
  type SchemeStep,
  type ServiceBand,
  type SicknessScheme,
} from "@/src/lib/types/sickness";
import { SICKNESS_BASE, useCanManageSickness, useSickness, useSicknessActor } from "./hooks";

function blankScheme(tenantId: string): SicknessScheme {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `${tenantId}-SCH-${Date.now().toString(36).toUpperCase()}`,
    tenantId,
    name: "",
    description: "",
    status: "active",
    kind: "custom",
    period: "rolling",
    rollingMonths: 12,
    unit: "contracted_days",
    steps: [
      { id: "s1", label: "Sick at full pay", amount: 10, payPercent: 100 },
      { id: "s2", label: "Sick at half pay", amount: 5, payPercent: 50 },
    ],
    serviceBands: [],
    publicHoliday: "holiday_precedence",
    fullTimeWeeklyHours: 40,
    fullTimeDaysPerWeek: 5,
    partTimeFormula: "days_ratio",
    eligibility: { minServiceDays: 0, employmentTypeIds: [], excludeProbation: false },
    waitingDays: 0,
    linkingDays: 56,
    applyStatutory: true,
    notifyOnSick: ["hr_contact", "line_manager"],
    notifyOnReturn: ["line_manager", "hr_contact"],
    advanced: { selfCertDays: 7, rtwInterview: "always", rtwAfterDays: 0, ohReferralAfterDays: 28, exportToPayroll: true },
    lastModifiedBy: "",
    lastModifiedAt: today,
    createdAt: today,
  };
}

/**
 * Sickness Scheme builder — HR configures sick pay rules (full/half pay steps,
 * rolling windows, service bands, eligibility, statutory pay, notifications)
 * without a code change.
 */
export function SchemeBuilder({ schemeId }: { schemeId: string }) {
  const s = useSickness();
  if (s.loading || !s.tenantId) return <Skeleton className="m-6 h-96" />;
  const existing = s.schemes.find((x) => x.id === schemeId);
  if (schemeId !== "new" && !existing) {
    return <p className="py-12 text-sm text-muted-foreground">Scheme not found.</p>;
  }
  return <Builder key={schemeId} initial={existing ?? blankScheme(s.tenantId)} isNew={!existing} />;
}

function Builder({ initial, isNew }: { initial: SicknessScheme; isNew: boolean }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const s = useSickness();
  const actor = useSicknessActor();
  const canManage = useCanManageSickness();
  const [f, setF] = useState<SicknessScheme>(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof SicknessScheme>(k: K, v: SicknessScheme[K]) => setF((x) => ({ ...x, [k]: v }));
  const unitWord = f.unit === "weeks" ? "weeks" : f.unit === "hours" ? "hours" : "days";
  const employmentTypes = s.bundle?.employmentTypes ?? [];

  function save() {
    if (f.name.trim().length < 3) return setError("Give the scheme a name.");
    if (f.period === "rolling" && (f.rollingMonths < 1 || f.rollingMonths > 60)) return setError("Rolling period must be 1–60 months.");
    const steps = f.period === "length_of_service" ? f.serviceBands.flatMap((b) => b.steps) : f.steps;
    if (steps.some((x) => x.amount <= 0 || x.payPercent < 0 || x.payPercent > 100)) return setError("Each step needs an amount above 0 and pay between 0% and 100%.");
    if (f.fullTimeDaysPerWeek <= 0 || f.fullTimeDaysPerWeek > 7) return setError("Full time days per week must be between 1 and 7.");
    dispatch(upsertScheme({ scheme: { ...f, name: f.name.trim() }, actor }));
    toast.success(isNew ? "Scheme created" : "Scheme saved");
    router.push(`${SICKNESS_BASE}/schemes`);
  }

  return (
    <div className="flex flex-col gap-4 pb-10 pt-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1 text-muted-foreground" asChild>
        <Link href={`${SICKNESS_BASE}/schemes`}><ChevronLeft className="h-4 w-4" /> Sickness &amp; Absence / Sickness Schemes</Link>
      </Button>
      <h1 className="text-3xl font-bold">{isNew ? "New Sickness Scheme" : "Sickness Scheme"}</h1>

      <Accordion type="multiple" defaultValue={["name", "measure", "steps"]} className="space-y-2">
        <Section value="name" title="Name and description">
          <p className="mb-3 text-xs text-muted-foreground">
            A sickness scheme sets <b>sick pay</b> — how many days of sickness are paid, at what rate, and how statutory
            sick pay applies. It doesn&apos;t give holiday or other leave; those are Leave Management schemes.
          </p>
          <Field label="Name" required><Input value={f.name} onChange={(e) => set("name", e.target.value)} disabled={!canManage} /></Field>
          <Field label="Description">
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} disabled={!canManage} className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="You can optionally give your scheme a reference code"><Input value={f.reference ?? ""} onChange={(e) => set("reference", e.target.value || undefined)} disabled={!canManage} /></Field>
        </Section>

        <Section value="measure" title="How is sick pay entitlement measured?">
          <p className="mb-3 text-xs text-muted-foreground">
            Entitlement can be granted as a number of hours or days of sick leave for the year, for a rolling period, or for
            each spell of sickness — or as a number of weeks that grows with length of service.
          </p>
          <Field label="Over what period is entitlement measured?" required>
            <Select value={f.period} onValueChange={(v) => set("period", v as EntitlementPeriod)} disabled={!canManage}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ENTITLEMENT_PERIOD_LABELS) as EntitlementPeriod[]).map((p) => <SelectItem key={p} value={p}>{ENTITLEMENT_PERIOD_LABELS[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          {f.period === "rolling" && (
            <Field label="Rolling period" required>
              <Select value={String(f.rollingMonths)} onValueChange={(v) => set("rollingMonths", Number(v))} disabled={!canManage}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 6, 12, 24, 36, 48].map((m) => <SelectItem key={m} value={String(m)}>{m % 12 === 0 ? `${m / 12} Year${m > 12 ? "s" : ""}` : `${m} Months`}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="What unit is the entitlement measured in?" required>
            <Select value={f.unit} onValueChange={(v) => set("unit", v as EntitlementUnit)} disabled={!canManage}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ENTITLEMENT_UNIT_LABELS) as EntitlementUnit[]).map((u) => <SelectItem key={u} value={u}>{ENTITLEMENT_UNIT_LABELS[u]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section value="steps" title="How much paid sickness is the employee entitled to?">
          <p className="mb-3 text-xs text-muted-foreground">
            Say how many {unitWord} of paid sick leave an employee is entitled to under this scheme. The rate of pay can be
            reduced in steps, which are consumed in order from Step 1. When all steps are exhausted the remainder of the
            sickness is unpaid{f.applyStatutory ? " (statutory sick pay still applies where due)" : ""}.
          </p>
          {f.period === "length_of_service" ? (
            <ServiceBands bands={f.serviceBands} unitWord={unitWord} disabled={!canManage} onChange={(b) => set("serviceBands", b)} />
          ) : (
            <StepsTable steps={f.steps} unitWord={unitWord} disabled={!canManage} onChange={(st) => set("steps", st)} />
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Waiting days before company sick pay starts (each spell)">
              <Input type="number" min={0} value={f.waitingDays} onChange={(e) => set("waitingDays", Number(e.target.value))} disabled={!canManage} />
            </Field>
            <Field label="Link spells this many calendar days apart as one period of sickness">
              <Input type="number" min={0} value={f.linkingDays} onChange={(e) => set("linkingDays", Number(e.target.value))} disabled={!canManage} />
            </Field>
          </div>
        </Section>

        <Section value="holidays" title="What happens on Public holidays?">
          <Label className="mb-2 block text-xs">What should happen if the sickness falls on a public holiday? *</Label>
          <RadioGroup value={f.publicHoliday} onValueChange={(v) => set("publicHoliday", v as SicknessScheme["publicHoliday"])} disabled={!canManage}>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="holiday_precedence" /> Public holiday takes precedence</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="ignore" /> Ignore the public holiday</label>
          </RadioGroup>
        </Section>

        <Section value="part-time" title="How is this scheme applied to part time workers?">
          <p className="mb-3 text-xs text-muted-foreground">
            When a part time worker is enrolled in this scheme they can be granted a reduced entitlement. The system can
            calculate this for you — say what full time work days and hours you assumed, and the formula to use.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full time weekly hours" required><Input type="number" step={0.5} value={f.fullTimeWeeklyHours} onChange={(e) => set("fullTimeWeeklyHours", Number(e.target.value))} disabled={!canManage} /></Field>
            <Field label="Full time days per week" required><Input type="number" step={0.5} value={f.fullTimeDaysPerWeek} onChange={(e) => set("fullTimeDaysPerWeek", Number(e.target.value))} disabled={!canManage} /></Field>
          </div>
          <Field label="What formula should be used to calculate the part time entitlement?" required>
            <Select value={f.partTimeFormula} onValueChange={(v) => set("partTimeFormula", v as PartTimeFormula)} disabled={!canManage}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PART_TIME_FORMULA_LABELS) as PartTimeFormula[]).map((p) => <SelectItem key={p} value={p}>{PART_TIME_FORMULA_LABELS[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section value="notify-sick" title="Who should be notified when an employee is reported sick?">
          <RolePicker value={f.notifyOnSick} onChange={(v) => set("notifyOnSick", v)} disabled={!canManage} text="Select the role, or roles, that you want to be notified when the employee is reported sick." />
        </Section>

        <Section value="notify-return" title="Who should be notified when an employee has returned to work?">
          <RolePicker value={f.notifyOnReturn} onChange={(v) => set("notifyOnReturn", v)} disabled={!canManage} text="Select the role, or roles, that you want to be notified after the employee has returned to work." />
        </Section>

        <Section value="advanced" title="Advanced Options">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Minimum service before eligible (days)"><Input type="number" min={0} value={f.eligibility.minServiceDays} onChange={(e) => set("eligibility", { ...f.eligibility, minServiceDays: Number(e.target.value) })} disabled={!canManage} /></Field>
            <Field label="Self-certification period (calendar days)"><Input type="number" min={1} value={f.advanced.selfCertDays} onChange={(e) => set("advanced", { ...f.advanced, selfCertDays: Number(e.target.value) })} disabled={!canManage} /></Field>
            <Field label="Return-to-work interview">
              <Select value={f.advanced.rtwInterview} onValueChange={(v) => set("advanced", { ...f.advanced, rtwInterview: v as SicknessScheme["advanced"]["rtwInterview"] })} disabled={!canManage}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">After every absence</SelectItem>
                  <SelectItem value="after_days">After absences longer than…</SelectItem>
                  <SelectItem value="never">Not required</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {f.advanced.rtwInterview === "after_days" && (
              <Field label="…this many days"><Input type="number" min={1} value={f.advanced.rtwAfterDays} onChange={(e) => set("advanced", { ...f.advanced, rtwAfterDays: Number(e.target.value) })} disabled={!canManage} /></Field>
            )}
            <Field label="Suggest Occupational Health after (continuous days)"><Input type="number" min={1} value={f.advanced.ohReferralAfterDays} onChange={(e) => set("advanced", { ...f.advanced, ohReferralAfterDays: Number(e.target.value) })} disabled={!canManage} /></Field>
            <Field label="Payroll element code"><Input value={f.advanced.payrollCode ?? ""} onChange={(e) => set("advanced", { ...f.advanced, payrollCode: e.target.value || undefined })} placeholder="e.g. OSP01" disabled={!canManage} /></Field>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <label className="flex items-center justify-between gap-3">Pay statutory sick pay where it applies (UK SSP, date-versioned)<Switch checked={f.applyStatutory} onCheckedChange={(c) => set("applyStatutory", c)} disabled={!canManage} /></label>
            <label className="flex items-center justify-between gap-3">Exclude employees on probation<Switch checked={f.eligibility.excludeProbation} onCheckedChange={(c) => set("eligibility", { ...f.eligibility, excludeProbation: c })} disabled={!canManage} /></label>
            <label className="flex items-center justify-between gap-3">Send sick pay to payroll<Switch checked={f.advanced.exportToPayroll} onCheckedChange={(c) => set("advanced", { ...f.advanced, exportToPayroll: c })} disabled={!canManage} /></label>
            <Field label="Status">
              <Select value={f.status} onValueChange={(v) => set("status", v as SicknessScheme["status"])} disabled={!canManage}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          {employmentTypes.length > 0 && (
            <div className="mt-3">
              <Label className="text-xs">Eligible employment types (none ticked = all)</Label>
              <div className="mt-1 grid gap-1.5 sm:grid-cols-3">
                {employmentTypes.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs">
                    <Checkbox
                      disabled={!canManage}
                      checked={f.eligibility.employmentTypeIds.includes(t.id)}
                      onCheckedChange={(c) =>
                        set("eligibility", {
                          ...f.eligibility,
                          employmentTypeIds: c ? [...f.eligibility.employmentTypeIds, t.id] : f.eligibility.employmentTypeIds.filter((x) => x !== t.id),
                        })
                      }
                    />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {f.applyStatutory && (
            <div className="mt-4 rounded-md border border-border p-3">
              <p className="mb-2 text-xs font-medium">Statutory sick pay rules (applied by date of absence)</p>
              <table className="w-full text-[11px]">
                <thead className="text-muted-foreground"><tr><th className="text-left">From</th><th className="text-left">Weekly rate</th><th className="text-left">Waiting days</th><th className="text-left">Earnings test</th><th className="text-left">Note</th></tr></thead>
                <tbody>
                  {SSP_RULES.map((r) => (
                    <tr key={r.effectiveFrom} className="border-t border-border/60">
                      <td className="py-1">{r.effectiveFrom}</td>
                      <td>£{r.weeklyRate.toFixed(2)}{r.earningsPercentCap ? ` or ${r.earningsPercentCap}% of earnings if lower` : ""}</td>
                      <td>{r.waitingDays}</td>
                      <td>{r.lowerEarningsLimit != null ? `£${r.lowerEarningsLimit}/week` : "None"}</td>
                      <td className="text-muted-foreground">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </Accordion>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {canManage && (
        <div className="flex items-center gap-2">
          <Button onClick={save}>Save</Button>
          <Button variant="outline" onClick={() => router.push(`${SICKNESS_BASE}/schemes`)}>Cancel</Button>
          {!isNew && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 text-primary"><MoreHorizontal className="h-4 w-4" /> Other actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { dispatch(upsertScheme({ actor, scheme: { ...f, status: f.status === "archived" ? "active" : "archived" } })); toast.success("Status changed"); router.push(`${SICKNESS_BASE}/schemes`); }}>
                  {f.status === "archived" ? "Restore" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={f.kind === "system" || s.enrolments.some((e) => e.schemeId === f.id && !e.effectiveTo)}
                  className="text-destructive"
                  onClick={() => { dispatch(deleteScheme({ id: f.id, actor })); toast.success("Scheme deleted"); router.push(`${SICKNESS_BASE}/schemes`); }}
                >
                  Delete {f.kind === "system" ? "(system scheme)" : "(no active enrolments)"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value} className="rounded-lg border border-border bg-card px-4">
      <AccordionTrigger className="text-sm font-semibold">{title}</AccordionTrigger>
      <AccordionContent className="space-y-3 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

function StepsTable({ steps, unitWord, disabled, onChange }: { steps: SchemeStep[]; unitWord: string; disabled: boolean; onChange: (s: SchemeStep[]) => void }) {
  const upd = (id: string, patch: Partial<SchemeStep>) => onChange(steps.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return (
    <div className="overflow-hidden rounded-md border border-border">
      {!disabled && (
        <div className="border-b border-border px-3 py-1.5">
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-primary" onClick={() => onChange([...steps, { id: `s${Date.now()}`, label: "Sick at reduced pay", amount: 5, payPercent: 0 }])}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      )}
      <table className="w-full text-xs">
        <thead className="bg-muted text-muted-foreground">
          <tr><th className="px-3 py-2 text-left font-medium">Step</th><th className="px-3 py-2 text-left font-medium">Description</th><th className="px-3 py-2 text-left font-medium">{unitWord}</th><th className="px-3 py-2 text-left font-medium">% of pay</th><th className="px-3 py-2 text-left font-medium">Actions</th></tr>
        </thead>
        <tbody>
          {steps.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No paid steps — statutory pay only.</td></tr>}
          {steps.map((x, i) => (
            <tr key={x.id} className="border-t border-border/60">
              <td className="px-3 py-1.5 font-medium text-primary">Step {i + 1}</td>
              <td className="px-3 py-1.5"><Input value={x.label} onChange={(e) => upd(x.id, { label: e.target.value })} disabled={disabled} className="h-7 text-xs" /></td>
              <td className="px-3 py-1.5"><Input type="number" min={0} step={0.5} value={x.amount} onChange={(e) => upd(x.id, { amount: Number(e.target.value) })} disabled={disabled} className="h-7 w-20 text-xs" /></td>
              <td className="px-3 py-1.5"><Input type="number" min={0} max={100} value={x.payPercent} onChange={(e) => upd(x.id, { payPercent: Number(e.target.value) })} disabled={disabled} className="h-7 w-20 text-xs" /></td>
              <td className="px-3 py-1.5">
                {!disabled && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onChange(steps.filter((y) => y.id !== x.id))}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServiceBands({ bands, unitWord, disabled, onChange }: { bands: ServiceBand[]; unitWord: string; disabled: boolean; onChange: (b: ServiceBand[]) => void }) {
  const sorted = [...bands].sort((a, b) => a.minServiceMonths - b.minServiceMonths);
  return (
    <div className="space-y-3">
      {sorted.map((b) => (
        <div key={b.id} className="rounded-md border border-border p-3">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span>After</span>
            <Input type="number" min={0} value={b.minServiceMonths} disabled={disabled} onChange={(e) => onChange(bands.map((x) => (x.id === b.id ? { ...x, minServiceMonths: Number(e.target.value) } : x)))} className="h-7 w-20 text-xs" />
            <span>months&apos; service</span>
            {!disabled && <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={() => onChange(bands.filter((x) => x.id !== b.id))}><Trash2 className="h-3.5 w-3.5" /></Button>}
          </div>
          <StepsTable steps={b.steps} unitWord={unitWord} disabled={disabled} onChange={(st) => onChange(bands.map((x) => (x.id === b.id ? { ...x, steps: st } : x)))} />
        </div>
      ))}
      {!disabled && (
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onChange([...bands, { id: `b${Date.now()}`, minServiceMonths: (sorted[sorted.length - 1]?.minServiceMonths ?? -12) + 12, steps: [{ id: "s1", label: "Sick at full pay", amount: 4, payPercent: 100 }] }])}>
          <Plus className="h-3.5 w-3.5" /> Add service band
        </Button>
      )}
    </div>
  );
}

function RolePicker({ value, onChange, disabled, text }: { value: string[]; onChange: (v: string[]) => void; disabled: boolean; text: string }) {
  const [q, setQ] = useState("");
  const list = NOTIFY_ROLES.filter((r) => r.label.toLowerCase().includes(q.toLowerCase()));
  const allSelected = value.length === NOTIFY_ROLES.length;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{text}</p>
      <div className="rounded-md border border-border p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find" className="h-8 pl-7 text-xs" />
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs">
          <Checkbox disabled={disabled} checked={allSelected} onCheckedChange={(c) => onChange(c ? NOTIFY_ROLES.map((r) => r.id) : [])} />
          SELECT ALL <span className="text-muted-foreground">{value.length} of {NOTIFY_ROLES.length} item(s) selected</span>
        </label>
      </div>
      <div className="space-y-1">
        {[...list].sort((a, b) => Number(value.includes(b.id)) - Number(value.includes(a.id))).map((r) => (
          <label key={r.id} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${value.includes(r.id) ? "border-primary/40 bg-[color-mix(in_oklab,var(--primary)_7%,var(--card))]" : "border-border"}`}>
            <Checkbox disabled={disabled} checked={value.includes(r.id)} onCheckedChange={(c) => onChange(c ? [...value, r.id] : value.filter((x) => x !== r.id))} />
            {r.label}
          </label>
        ))}
      </div>
    </div>
  );
}
