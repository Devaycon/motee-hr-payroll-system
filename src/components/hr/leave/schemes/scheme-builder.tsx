"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal, Plus, Trash2 } from "lucide-react";
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
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { deleteLeaveScheme, leaveSchemeId, upsertLeaveScheme } from "@/src/lib/stores/leave-schemes-slice";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_OPTIONS } from "@/src/data/leave-demo";
import {
  ACCRUAL_LABELS,
  LEAVE_NOTIFY_ROLES,
  LEAVE_PART_TIME_LABELS,
  type AccrualMethod,
  type LeaveEntitlementRule,
  type LeavePartTimeFormula,
  type LeaveScheme,
  type LeaveUnit,
} from "@/src/lib/types/leave-schemes";
import { cn } from "@/src/lib/utils";
import { useLeaveSchemes } from "./hooks";

const BACK = "/time-payroll/leave?tab=schemes";
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleString("en-GB", { month: "long" }));

function blank(tenantId: string, id: string): LeaveScheme {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id,
    tenantId,
    name: "",
    description: "",
    status: "active",
    kind: "custom",
    leaveYearStartMonth: 1,
    entitlements: [
      { id: "annual", leaveType: "annual", amount: 25, unit: "days", accrual: "upfront", proRataJoiners: true, carryOverMax: 5, carryOverExpiryMonths: 3, paid: true },
    ],
    serviceIncrements: [],
    maxServiceExtraDays: 0,
    publicHolidays: "in_addition",
    fullTimeDaysPerWeek: 5,
    fullTimeWeeklyHours: 37.5,
    partTimeFormula: "days_ratio",
    booking: { minNoticeDays: 5, maxConsecutiveDays: 15, allowHalfDays: true, allowNegativeBalance: false },
    eligibility: { minServiceDays: 0, employmentTypeIds: [] },
    notifyOnRequest: ["line_manager"],
    notifyOnApproval: ["employee", "hr_contact"],
    lastModifiedBy: "",
    lastModifiedAt: today,
    createdAt: today,
  };
}

export function LeaveSchemeBuilder({ schemeId }: { schemeId: string }) {
  const ls = useLeaveSchemes();
  const [newId] = useState(() => leaveSchemeId("LVS"));
  if (!ls.ready || !ls.tenantId) return <Skeleton className="m-6 h-96" />;
  const existing = ls.schemes.find((s) => s.id === schemeId);
  if (schemeId !== "new" && !existing) {
    return <p className="py-12 text-sm text-muted-foreground">Leave scheme not found. <Link href={BACK} className="text-primary hover:underline">Back to schemes</Link></p>;
  }
  return <Builder key={schemeId} initial={existing ?? blank(ls.tenantId, `${ls.tenantId}-${newId}`)} isNew={!existing} />;
}

function Builder({ initial, isNew }: { initial: LeaveScheme; isNew: boolean }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const ls = useLeaveSchemes();
  const actor = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const employmentTypes = useAppSelector((s) => s.locale.data?.employmentTypes) ?? [];
  const canManage = useCan("time-payroll.leave", "edit");
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof LeaveScheme>(k: K, v: LeaveScheme[K]) => setF((x) => ({ ...x, [k]: v }));
  const updRule = (id: string, patch: Partial<LeaveEntitlementRule>) => set("entitlements", f.entitlements.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const unused = LEAVE_TYPE_OPTIONS.filter((t) => !f.entitlements.some((r) => r.leaveType === t));
  const disabled = !canManage;

  function save() {
    if (f.name.trim().length < 3) return setError("Give the scheme a name.");
    if (!f.entitlements.length) return setError("Add at least one leave entitlement.");
    if (f.entitlements.some((r) => r.amount < 0 || r.carryOverMax < 0)) return setError("Amounts and carry-over can't be negative.");
    if (f.fullTimeDaysPerWeek <= 0 || f.fullTimeDaysPerWeek > 7) return setError("Full time days per week must be between 1 and 7.");
    dispatch(upsertLeaveScheme({ scheme: { ...f, name: f.name.trim() }, actor }));
    toast.success(isNew ? "Leave scheme created" : "Leave scheme saved");
    router.push(BACK);
  }

  return (
    <div className="flex flex-col gap-4 pb-10 pt-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1 text-muted-foreground" asChild>
        <Link href={BACK}><ChevronLeft className="h-4 w-4" /> Leave Management / Schemes</Link>
      </Button>
      <h1 className="text-3xl font-bold">{isNew ? "New Leave Scheme" : "Leave Scheme"}</h1>

      <Accordion type="multiple" defaultValue={["name", "entitlements"]} className="space-y-2">
        <Section value="name" title="Name and description">
          <Field label="Name" required><Input value={f.name} onChange={(e) => set("name", e.target.value)} disabled={disabled} placeholder="e.g. Standard UK Holiday Scheme" /></Field>
          <Field label="Description">
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} disabled={disabled} className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Reference code (optional)"><Input value={f.reference ?? ""} onChange={(e) => set("reference", e.target.value || undefined)} disabled={disabled} /></Field>
        </Section>

        <Section value="year" title="When does the leave year start?">
          <p className="text-xs text-muted-foreground">Allowances reset, and unused days carry over, at the start of each leave year.</p>
          <Field label="Leave year starts on 1st of" required>
            <Select value={String(f.leaveYearStartMonth)} onValueChange={(v) => set("leaveYearStartMonth", Number(v))} disabled={disabled}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </Section>

        <Section value="entitlements" title="How much leave is the employee entitled to?">
          <p className="text-xs text-muted-foreground">One row per leave type. Amounts are for a full-time employee for a full leave year.</p>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted text-muted-foreground">
                <tr>{["Leave type", "Amount", "Unit", "Accrual", "Pro-rata joiners", "Carry over (max)", "Carried days expire after", "Paid", ""].map((h) => <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {f.entitlements.map((r) => (
                  <tr key={r.id} className="border-t border-border/60">
                    <td className="px-2 py-1.5 font-medium">{LEAVE_TYPE_LABELS[r.leaveType]}</td>
                    <td className="px-2 py-1.5"><Input type="number" min={0} step={0.5} value={r.amount} onChange={(e) => updRule(r.id, { amount: Number(e.target.value) })} disabled={disabled} className="h-7 w-20 text-xs" /></td>
                    <td className="px-2 py-1.5">
                      <Select value={r.unit} onValueChange={(v) => updRule(r.id, { unit: v as LeaveUnit })} disabled={disabled}>
                        <SelectTrigger size="sm" className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="days" className="text-xs">Days</SelectItem><SelectItem value="weeks" className="text-xs">Weeks</SelectItem></SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Select value={r.accrual} onValueChange={(v) => updRule(r.id, { accrual: v as AccrualMethod })} disabled={disabled}>
                        <SelectTrigger size="sm" className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upfront" className="text-xs">Upfront</SelectItem>
                          <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-1.5"><Switch checked={r.proRataJoiners} onCheckedChange={(c) => updRule(r.id, { proRataJoiners: c })} disabled={disabled} /></td>
                    <td className="px-2 py-1.5"><Input type="number" min={0} value={r.carryOverMax} onChange={(e) => updRule(r.id, { carryOverMax: Number(e.target.value) })} disabled={disabled} className="h-7 w-16 text-xs" /></td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1"><Input type="number" min={0} value={r.carryOverExpiryMonths} onChange={(e) => updRule(r.id, { carryOverExpiryMonths: Number(e.target.value) })} disabled={disabled || r.carryOverMax === 0} className="h-7 w-14 text-xs" /><span className="text-muted-foreground">months</span></div>
                    </td>
                    <td className="px-2 py-1.5"><Switch checked={r.paid} onCheckedChange={(c) => updRule(r.id, { paid: c })} disabled={disabled} /></td>
                    <td className="px-2 py-1.5">
                      {!disabled && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => set("entitlements", f.entitlements.filter((x) => x.id !== r.id))}><Trash2 className="h-3.5 w-3.5" /></Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!disabled && unused.length > 0 && (
            <Select
              value=""
              onValueChange={(t) =>
                set("entitlements", [
                  ...f.entitlements,
                  { id: t, leaveType: t as LeaveEntitlementRule["leaveType"], amount: 5, unit: "days", accrual: "upfront", proRataJoiners: true, carryOverMax: 0, carryOverExpiryMonths: 0, paid: t !== "unpaid" },
                ])
              }
            >
              <SelectTrigger size="sm" className="h-8 w-56 text-xs"><Plus className="h-3.5 w-3.5" /><SelectValue placeholder="Add a leave type" /></SelectTrigger>
              <SelectContent>{unused.map((t) => <SelectItem key={t} value={t} className="text-xs">{LEAVE_TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <p className="text-[11px] text-muted-foreground">
            {Object.entries(ACCRUAL_LABELS).map(([k, v]) => `${k === "upfront" ? "Upfront" : "Monthly"}: ${v}.`).join(" ")} Sickness isn&apos;t listed — sick pay lives in Sickness Schemes.
          </p>
        </Section>

        <Section value="service" title="Does annual leave grow with length of service?">
          <div className="space-y-2">
            {[...f.serviceIncrements].sort((a, b) => a.afterYears - b.afterYears).map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <span>After</span>
                <Input type="number" min={0} value={s.afterYears} onChange={(e) => set("serviceIncrements", f.serviceIncrements.map((x) => (x.id === s.id ? { ...x, afterYears: Number(e.target.value) } : x)))} disabled={disabled} className="h-7 w-16 text-xs" />
                <span>years&apos; service, add</span>
                <Input type="number" min={0} value={s.extraDays} onChange={(e) => set("serviceIncrements", f.serviceIncrements.map((x) => (x.id === s.id ? { ...x, extraDays: Number(e.target.value) } : x)))} disabled={disabled} className="h-7 w-16 text-xs" />
                <span>days</span>
                {!disabled && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => set("serviceIncrements", f.serviceIncrements.filter((x) => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
            ))}
            {!disabled && (
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => set("serviceIncrements", [...f.serviceIncrements, { id: `s${f.serviceIncrements.length + 1}-${f.serviceIncrements.reduce((m, s) => Math.max(m, s.afterYears), 0) + 1}`, afterYears: f.serviceIncrements.reduce((m, s) => Math.max(m, s.afterYears), 1) + 1, extraDays: f.serviceIncrements.reduce((m, s) => Math.max(m, s.extraDays), 0) + 1 }])}>
                <Plus className="h-3.5 w-3.5" /> Add service step
              </Button>
            )}
            <Field label="Maximum extra days for service">
              <Input type="number" min={0} value={f.maxServiceExtraDays} onChange={(e) => set("maxServiceExtraDays", Number(e.target.value))} disabled={disabled} className="w-32" />
            </Field>
          </div>
        </Section>

        <Section value="holidays" title="How are public holidays treated?">
          <RadioGroup value={f.publicHolidays} onValueChange={(v) => set("publicHolidays", v as LeaveScheme["publicHolidays"])} disabled={disabled}>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="in_addition" /> Given in addition to the annual allowance</label>
            <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="included" /> Included within the annual allowance (e.g. UK 5.6 weeks incl. bank holidays)</label>
          </RadioGroup>
        </Section>

        <Section value="part-time" title="How is this scheme applied to part time workers?">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full time days per week" required><Input type="number" step={0.5} value={f.fullTimeDaysPerWeek} onChange={(e) => set("fullTimeDaysPerWeek", Number(e.target.value))} disabled={disabled} /></Field>
            <Field label="Full time weekly hours" required><Input type="number" step={0.5} value={f.fullTimeWeeklyHours} onChange={(e) => set("fullTimeWeeklyHours", Number(e.target.value))} disabled={disabled} /></Field>
          </div>
          <Field label="Pro-rating formula" required>
            <Select value={f.partTimeFormula} onValueChange={(v) => set("partTimeFormula", v as LeavePartTimeFormula)} disabled={disabled}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(LEAVE_PART_TIME_LABELS) as LeavePartTimeFormula[]).map((k) => <SelectItem key={k} value={k}>{LEAVE_PART_TIME_LABELS[k]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </Section>

        <Section value="booking" title="Booking rules">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Minimum notice (days)"><Input type="number" min={0} value={f.booking.minNoticeDays} onChange={(e) => set("booking", { ...f.booking, minNoticeDays: Number(e.target.value) })} disabled={disabled} /></Field>
            <Field label="Maximum consecutive days"><Input type="number" min={1} value={f.booking.maxConsecutiveDays} onChange={(e) => set("booking", { ...f.booking, maxConsecutiveDays: Number(e.target.value) })} disabled={disabled} /></Field>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm">Allow half-day bookings<Switch checked={f.booking.allowHalfDays} onCheckedChange={(c) => set("booking", { ...f.booking, allowHalfDays: c })} disabled={disabled} /></label>
          <label className="flex items-center justify-between gap-3 text-sm">Allow booking beyond the remaining balance<Switch checked={f.booking.allowNegativeBalance} onCheckedChange={(c) => set("booking", { ...f.booking, allowNegativeBalance: c })} disabled={disabled} /></label>
        </Section>

        <Section value="eligibility" title="Who is eligible?">
          <Field label="Minimum service before eligible (days)"><Input type="number" min={0} value={f.eligibility.minServiceDays} onChange={(e) => set("eligibility", { ...f.eligibility, minServiceDays: Number(e.target.value) })} disabled={disabled} className="w-40" /></Field>
          {employmentTypes.length > 0 && (
            <div>
              <Label className="text-xs">Employment types (none ticked = all)</Label>
              <div className="mt-1 grid gap-1.5 sm:grid-cols-3">
                {employmentTypes.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs">
                    <Checkbox disabled={disabled} checked={f.eligibility.employmentTypeIds.includes(t.id)} onCheckedChange={(c) => set("eligibility", { ...f.eligibility, employmentTypeIds: c ? [...f.eligibility.employmentTypeIds, t.id] : f.eligibility.employmentTypeIds.filter((x) => x !== t.id) })} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section value="notify" title="Who is notified?">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["notifyOnRequest", "When leave is requested"],
                ["notifyOnApproval", "When leave is approved or rejected"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <p className="mb-1 text-xs font-medium">{label}</p>
                <div className="space-y-1">
                  {LEAVE_NOTIFY_ROLES.map((r) => (
                    <label key={r.id} className={cn("flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs", f[key].includes(r.id) ? "border-primary bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))]" : "border-border bg-card")}>
                      <Checkbox disabled={disabled} checked={f[key].includes(r.id)} onCheckedChange={(c) => set(key, c ? [...f[key], r.id] : f[key].filter((x) => x !== r.id))} />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section value="status" title="Status">
          <Select value={f.status} onValueChange={(v) => set("status", v as LeaveScheme["status"])} disabled={disabled}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </Section>
      </Accordion>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {canManage && (
        <div className="flex items-center gap-2">
          <Button onClick={save}>Save</Button>
          <Button variant="outline" onClick={() => router.push(BACK)}>Cancel</Button>
          {!isNew && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 text-primary"><MoreHorizontal className="h-4 w-4" /> Other actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  disabled={f.kind === "system" || ls.enrolments.some((e) => e.schemeId === f.id && !e.effectiveTo)}
                  className="text-destructive"
                  onClick={() => { dispatch(deleteLeaveScheme(f.id)); toast.success("Scheme deleted"); router.push(BACK); }}
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
