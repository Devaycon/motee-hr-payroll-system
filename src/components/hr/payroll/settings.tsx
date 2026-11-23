"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { HmoEnrolmentFields, HmoSettingsTab } from "./settings-hmo";
import { AvcRequestsPanel } from "./avc-requests";
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
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { ListPagination } from "@/src/components/shared/list-pagination";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_HREF, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { ELEMENT_GROUP_LABELS, ELEMENT_GROUP_ORDER } from "@/src/lib/payroll/elements-seed";
import { bandLabel, groupLifeOf, leaveAllowanceOf, nhfBasisOf, EMPLOYER_LINE_LABELS, employerLineShown } from "@/src/lib/payroll/ng/rate-sets";
import { round2 } from "@/src/lib/payroll/ng/engine";
import { structureOn } from "@/src/lib/payroll/run-builder";
import { calcLabel, diffElement, taxTreatmentOf } from "@/src/lib/payroll/config";
import { earliestOpenRun, useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { ApprovalFramework, ConfigHistory, SalaryProposal } from "./settings-extras";
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
  const pendingChanges = (data.configChanges ?? []).filter((c) => c.status === "pending").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Payroll
        </Link>
        <h1 className="mt-1 text-3xl font-semibold">Payroll Settings</h1>
        <p className="text-xs text-muted-foreground">
          How pay is calculated. Every change is effective-dated and recorded in Change History (who, what, when, from when, approved by) — finalized runs, and any re-run of an earlier month, keep the rules they were paid under.
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
            { value: "hmo", label: "Health (HMO)" },
            { value: "payslip", label: "Payslip" },
            { value: "history", label: `Change History${pendingChanges ? ` (${pendingChanges} pending)` : ""}` },
          ]}
        />
        <TabsContent value="general" className="mt-4"><General settings={data.settings} employmentTypes={bundle.employmentTypes} canEdit={canEdit} /></TabsContent>
        <TabsContent value="elements" className="mt-4"><Elements elements={data.elements} enabled={data.settings.enabledGroups} canEdit={canEdit} /></TabsContent>
        <TabsContent value="structures" className="mt-4"><Structures canEdit={canEdit} /></TabsContent>
        <TabsContent value="profiles" className="mt-4 space-y-4"><AvcRequestsPanel canEdit={canEdit} /><Profiles canEdit={canEdit} focus={params.get("employee")} /></TabsContent>
        <TabsContent value="rates" className="mt-4"><Rates rateSets={data.rateSets} settings={data.settings} canEdit={canEdit} /></TabsContent>
        <TabsContent value="hmo" className="mt-4"><HmoSettingsTab settings={data.settings} canEdit={canEdit} /></TabsContent>
        <TabsContent value="payslip" className="mt-4"><PayslipOptions settings={data.settings} canEdit={canEdit} /></TabsContent>
        <TabsContent value="history" className="mt-4"><ConfigHistory canEdit={canEdit} /></TabsContent>
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

const TYPES_PAGE_SIZE = 6;

const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2026, i, 1)).toLocaleString("en-GB", { month: "long", timeZone: "UTC" }));

/** When and how much leave allowance payroll pays (once per tax year per employee). */
function LeaveAllowanceCard({ settings, canEdit, onSave }: { settings: PayrollSettings; canEdit: boolean; onSave: (c: Partial<PayrollSettings>) => void }) {
  const p = leaveAllowanceOf(settings);
  const save = (c: Partial<typeof p>) => onSave({ leaveAllowance: { ...p, ...c } });
  const basisLabel = p.basis === "basic" ? "annual basic" : p.basis === "bht" ? "annual basic + housing + transport" : "annual gross";
  return (
    <Card
      title="Leave allowance"
      description={
        p.mode === "none"
          ? "Not paid through payroll."
          : `${p.ratePct}% of ${basisLabel}, paid ${p.mode === "anniversary" ? "in each employee's anniversary month (from the first anniversary)" : `to everyone in ${MONTH_NAMES[p.month - 1]}`}. Never twice in a tax year.`
      }
    >
      <Row label="When it's paid" hint="Anniversary: the month the employee joined. One month: everyone together, e.g. December.">
        <Select value={p.mode} onValueChange={(v) => save({ mode: v as typeof p.mode })} disabled={!canEdit}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="anniversary">Anniversary month</SelectItem>
            <SelectItem value="month">One month for everyone</SelectItem>
            <SelectItem value="none">Not through payroll</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      {p.mode !== "none" && (
        <>
          {p.mode === "month" && (
            <>
              <Row label="Month">
                <Select value={String(p.month)} onValueChange={(v) => save({ month: Number(v) })} disabled={!canEdit}>
                  <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Pro-rate in the joining year" hint="Someone who joined in October gets 3/12 of it that December.">
                <Switch checked={p.prorateFirstYear} disabled={!canEdit} onCheckedChange={(v) => save({ prorateFirstYear: v })} />
              </Row>
            </>
          )}
          <Row label="Rate" hint="Percentage of the annual amount below.">
            <div className="flex items-center gap-1"><NumberSetting value={p.ratePct} className="w-20" disabled={!canEdit} clamp={[0, 100]} onCommit={(v) => save({ ratePct: v })} /><span className="text-xs">%</span></div>
          </Row>
          <Row label="Based on">
            <Select value={p.basis} onValueChange={(v) => save({ basis: v as typeof p.basis })} disabled={!canEdit}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Annual basic</SelectItem>
                <SelectItem value="bht">Basic + housing + transport</SelectItem>
                <SelectItem value="gross">Annual gross</SelectItem>
              </SelectContent>
            </Select>
          </Row>
        </>
      )}
    </Card>
  );
}

function General({ settings, employmentTypes, canEdit }: { settings: PayrollSettings; employmentTypes: { id: string; name: string }[]; canEdit: boolean }) {
  const actions = usePayrollActions();
  const { data } = useTenantPayroll();
  const openFrom = data ? earliestOpenRun(data)?.period.start : undefined;
  const [effectiveFrom, setEffectiveFrom] = useState<string>("");
  const set = (c: Partial<PayrollSettings>) => {
    const from = effectiveFrom || openFrom;
    actions.updateSettings(c, { effectiveFrom: from });
    toast.success("Saved", { description: from ? `Calculation changes apply to pay periods from ${from}.` : undefined });
  };
  const [page, setTypePage] = useState(1);
  const typePages = Math.max(1, Math.ceil(employmentTypes.length / TYPES_PAGE_SIZE));
  const typePage = Math.min(page, typePages);
  const typeStart = (typePage - 1) * TYPES_PAGE_SIZE;
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card title="Effective date of changes" description="Calculation settings are versioned. Periods before this date keep the settings they had; the change is logged in Change History.">
        <Row label="Changes below apply from" hint={openFrom ? `Default: the first open pay period (${openFrom}). Pick a later date to schedule a change, e.g. 1 January.` : "Default: today."}>
          <Input type="date" className="h-8 w-44 text-xs" disabled={!canEdit} value={effectiveFrom || openFrom || ""} min={openFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
        </Row>
      </Card>
      <ApprovalFramework />
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
        <Row label="Pay day" hint="Day of the month salaries are paid. On a weekend or public holiday (e.g. 25 December) pay moves back to the working day before; a short month pays on its last working day.">
          <NumberSetting value={settings.payDay} className="w-24" disabled={!canEdit} clamp={[1, 31]} onCommit={(v) => set({ payDay: v })} />
        </Row>
        <Row label="Input cut-off day" hint="Overtime, bonuses and changes after this day roll into next month.">
          <NumberSetting value={settings.inputCutoffDay} className="w-24" disabled={!canEdit} clamp={[1, 31]} onCommit={(v) => set({ inputCutoffDay: v })} />
        </Row>
      </Card>

      <Card title="Contributions & integrations">
        <Row label="Voluntary pension (AVC) relieved from PAYE" hint="AVCs are set per employee (Tax & Statutory Profiles) separately from the statutory 8%, need the employee's signed mandate, and are remitted to the PFA with the mandatory contribution. Withdrawals within 5 years may be taxable — confirm treatment with your adviser.">
          <Switch checked={settings.avcTaxRelieved !== false} disabled={!canEdit} onCheckedChange={(v) => set({ avcTaxRelieved: v })} />
        </Row>
        <Row label="Remittance reminders (days before deadline)" hint="Payroll and finance users are notified this many days before each statutory deadline, on the day, and when overdue.">
          <NumberSetting value={settings.remittanceReminderDays ?? 5} className="w-24" disabled={!canEdit} clamp={[1, 30]} onCommit={(v) => set({ remittanceReminderDays: v })} />
        </Row>
        <Row label="NHIA health insurance deductions" hint="Off when the company provides a private HMO instead.">
          <Switch checked={settings.nhisEnabled} disabled={!canEdit} onCheckedChange={(v) => set({ nhisEnabled: v })} />
        </Row>
        <Row label="NHF basis" hint="2.5% NHF on monthly gross (Business Facilitation Act 2022) or on basic salary, as some employers still do.">
          <Select value={nhfBasisOf(settings)} onValueChange={(v) => set({ nhfBasis: v as PayrollSettings["nhfBasis"] })} disabled={!canEdit}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gross">Gross pay</SelectItem>
              <SelectItem value="basic">Basic salary</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Group life assurance" hint="Employer-paid cover of 3× annual emoluments (Pension Reform Act 2014). The premium is charged as a monthly employer cost.">
          <Switch checked={groupLifeOf(settings).enabled} disabled={!canEdit} onCheckedChange={(v) => set({ groupLife: { ...groupLifeOf(settings), enabled: v } })} />
        </Row>
        {groupLifeOf(settings).enabled && (
          <>
            <Row label="Group life premium rate (%)" hint="The insurer's rate on the sum assured, e.g. 0.6 for 0.6%.">
              <NumberSetting
                value={groupLifeOf(settings).ratePct}
                className="w-24"
                disabled={!canEdit}
                clamp={[0, 10]}
                onCommit={(v) => set({ groupLife: { ...groupLifeOf(settings), ratePct: v } })}
              />
            </Row>
            <Row label="Group life basis" hint="What the 3× sum assured is based on.">
              <Select
                value={groupLifeOf(settings).basis}
                onValueChange={(v) => set({ groupLife: { ...groupLifeOf(settings), basis: v as "gross" | "bht" } })}
                disabled={!canEdit}
              >
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross">Gross pay</SelectItem>
                  <SelectItem value="bht">Basic + housing + transport</SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </>
        )}
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

      <LeaveAllowanceCard settings={settings} canEdit={canEdit} onSave={set} />

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
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-xs">
            <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
              <tr><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Tax</th><th className="px-3 py-2 font-medium">Pension</th><th className="px-3 py-2 font-medium">NHF</th></tr>
            </thead>
            <tbody>
              {employmentTypes.slice(typeStart, typeStart + TYPES_PAGE_SIZE).map((t) => {
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
        <ListPagination
          page={typePage}
          totalPages={typePages}
          onPageChange={setTypePage}
          summary={`Showing ${typeStart + 1}–${Math.min(typeStart + TYPES_PAGE_SIZE, employmentTypes.length)} of ${employmentTypes.length} types`}
        />
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
  const { data } = useTenantPayroll();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PayElement | null>(null);
  const pendingCodes = new Set((data?.configChanges ?? []).filter((c) => c.status === "pending" && c.area === "element").map((c) => c.target));
  const save = (el: PayElement, effectiveFrom: string) => {
    const { pending } = actions.upsertElement(el, { effectiveFrom });
    toast.success(pending ? `${el.name}: sent for a second approver` : `${el.name} saved`, { description: pending ? "It takes effect once another payroll settings user approves it in Change History." : `Applies to pay periods from ${effectiveFrom}; earlier periods keep the old rules.` });
  };
  return (
    <Card
      title="Pay Element Master"
      description="Every earning, deduction and employer contribution: code, description, category, tax and pension treatment, calculation method, recurrence, effective date, accounting code and who can change it. Click an element to view or change it — changes are effective-dated and earlier periods keep the old rules."
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
                {items.map((e) => {
                  const pending = pendingCodes.has(e.code);
                  return (
                    <button type="button" key={e.code} onClick={() => setEditing(e)} className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-muted/40">
                      <div className="min-w-0">
                        <p className="truncate text-xs">
                          {e.name} {e.custom && <Badge variant="outline" className="ml-1 text-[9px]">Custom</Badge>}
                          {!e.active && <Badge variant="outline" className="ml-1 text-[9px]">Inactive</Badge>}
                          {pending && <Badge variant="outline" className="ml-1 border-amber-500/40 text-[9px] text-amber-700">Change pending</Badge>}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {e.code}
                          {e.glCode && ` · GL ${e.glCode}`}
                          {e.effectiveFrom && ` · from ${e.effectiveFrom}`}
                          {!!e.history?.length && ` · ${e.history.length} earlier version${e.history.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Flag on={e.statutory} label="Statutory" />
                        <Flag on={e.category === "earning" && taxTreatmentOf(e) === "taxable"} label="Taxable" />
                        <Flag on={e.category === "earning" && taxTreatmentOf(e) === "exempt"} label="Exempt" />
                        <Flag on={e.category === "earning" && taxTreatmentOf(e) === "conditional"} label="Conditional" />
                        <Flag on={e.pensionable} label="Pensionable" />
                        <Flag on={e.recurring} label="Recurring" />
                        <Flag on={!!e.preTax} label="Pre-tax" />
                        <Flag on={e.approval === "two_person"} label="2nd approver" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {(adding || editing) && (
        <ElementDialog
          key={editing?.code ?? "new"}
          element={editing}
          existing={elements}
          canEdit={canEdit}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSave={(el, from) => save(el, from)}
        />
      )}
    </Card>
  );
}

const CALC_OPTIONS: { value: PayElement["calculationType"]; label: string }[] = [
  { value: "fixed", label: "Fixed amount" },
  { value: "percent_of_basic", label: "Percentage of basic" },
  { value: "percent_of_gross", label: "Percentage of gross" },
  { value: "rate_x_units", label: "Formula — hourly rate × multiplier × units" },
  { value: "manual", label: "Variable — keyed each period" },
];

function ElementDialog({
  element,
  existing,
  canEdit,
  onClose,
  onSave,
}: {
  element: PayElement | null;
  existing: PayElement[];
  canEdit: boolean;
  onClose: () => void;
  onSave: (e: PayElement, effectiveFrom: string) => void;
}) {
  const { data } = useTenantPayroll();
  const openFrom = (data ? earliestOpenRun(data)?.period.start : undefined) ?? new Date().toISOString().slice(0, 10);
  const isNew = !element;
  const readOnly = !canEdit || !!element?.statutory;
  const [el, setEl] = useState<PayElement>(
    () =>
      element ?? {
        code: "",
        name: "",
        category: "earning",
        group: "allowances",
        calculationType: "fixed",
        taxable: true,
        taxTreatment: "taxable",
        pensionable: false,
        recurring: false,
        proratable: false,
        statutory: false,
        active: true,
        custom: true,
        approval: "settings_admin",
      },
  );
  const [from, setFrom] = useState(element?.effectiveFrom && element.effectiveFrom > openFrom ? element.effectiveFrom : openFrom);
  const set = (c: Partial<PayElement>) => setEl((x) => ({ ...x, ...c }));
  const code = isNew ? el.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 24) : el.code;
  const clash = isNew && existing.some((e) => e.code === code);
  const treatment = taxTreatmentOf(el);
  const diff = diffElement(element, { ...el, code });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "New pay element" : `${element.name}`}</DialogTitle>
          <DialogDescription>
            {element?.statutory ? "System-owned statutory element — its rules follow the law and the statutory rate sets." : "Pay element configuration. Changes take effect from the date you choose; earlier periods keep the rules they were paid under."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Description (payslip label)</Label>
            <Input value={el.name} disabled={readOnly} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Generator Allowance" />
            <p className={cn("font-mono text-[10px]", clash ? "text-rose-600" : "text-muted-foreground")}>Pay element code: {code || "—"}{clash && " — already exists"}{!isNew && " (never changes)"}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={el.category} disabled={readOnly || !isNew} onValueChange={(v) => set({ category: v as PayElement["category"], group: v === "earning" ? "allowances" : v === "deduction" ? "other_deductions" : "employer", taxable: v === "earning", taxTreatment: v === "earning" ? "taxable" : "exempt", pensionable: false })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="earning">Earnings</SelectItem>
                <SelectItem value="deduction">Deductions</SelectItem>
                <SelectItem value="employer">Employer cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Group</Label>
            <Select value={el.group} disabled={readOnly} onValueChange={(v) => set({ group: v as PayElementGroup })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ELEMENT_GROUP_ORDER.filter((g) => (el.category === "earning" ? g !== "other_deductions" && g !== "statutory" && g !== "employer" : el.category === "deduction" ? g === "other_deductions" || (el.statutory && g === "statutory") : g === "employer")).map((g) => (
                  <SelectItem key={g} value={g} className="text-xs">{ELEMENT_GROUP_LABELS[g]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tax treatment</Label>
            <Select value={treatment} disabled={readOnly || el.category !== "earning"} onValueChange={(v) => set({ taxTreatment: v as PayElement["taxTreatment"], taxable: v !== "exempt" })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="taxable">Taxable</SelectItem>
                <SelectItem value="exempt">Exempt</SelectItem>
                <SelectItem value="conditional">Conditional — exempt up to a monthly limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {treatment === "conditional" && el.category === "earning" ? (
            <div className="space-y-1">
              <Label className="text-xs">Tax-free up to (₦ a month)</Label>
              <Input type="number" disabled={readOnly} value={el.taxExemptMonthlyCap ?? 0} onChange={(e) => set({ taxExemptMonthlyCap: Math.max(0, Number(e.target.value) || 0) })} />
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Pension treatment</Label>
              <Select value={el.pensionable ? "yes" : "no"} disabled={readOnly || el.category !== "earning"} onValueChange={(v) => set({ pensionable: v === "yes" })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Pensionable</SelectItem>
                  <SelectItem value="no">Non-pensionable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {treatment === "conditional" && el.category === "earning" && (
            <div className="space-y-1">
              <Label className="text-xs">Pension treatment</Label>
              <Select value={el.pensionable ? "yes" : "no"} disabled={readOnly} onValueChange={(v) => set({ pensionable: v === "yes" })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Pensionable</SelectItem>
                  <SelectItem value="no">Non-pensionable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Calculation method</Label>
            <Select value={el.calculationType} disabled={readOnly} onValueChange={(v) => set({ calculationType: v as PayElement["calculationType"] })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CALC_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                {el.calculationType === "formula" && <SelectItem value="formula" className="text-xs">Formula</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {el.calculationType === "rate_x_units" && (
            <div className="space-y-1">
              <Label className="text-xs">Multiplier</Label>
              <Input type="number" step={0.25} disabled={readOnly} value={el.multiplier ?? 1} onChange={(e) => set({ multiplier: Math.max(0, Number(e.target.value) || 0) })} />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Recurrence</Label>
            <Select value={el.recurring ? "recurring" : "one_off"} disabled={readOnly} onValueChange={(v) => set({ recurring: v === "recurring", proratable: v === "recurring" })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recurring">Recurring every month</SelectItem>
                <SelectItem value="one_off">One-off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Accounting code (GL)</Label>
            <Input value={el.glCode ?? ""} disabled={!canEdit} onChange={(e) => set({ glCode: e.target.value.trim() || undefined })} placeholder="Blank = posts with salaries / other deductions" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Approval requirement</Label>
            <Select value={el.approval ?? "settings_admin"} disabled={!canEdit} onValueChange={(v) => set({ approval: v as PayElement["approval"] })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="settings_admin">Settings admin</SelectItem>
                <SelectItem value="two_person">Second approver</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{isNew ? "Effective date" : "Change applies from"}</Label>
            <Input type="date" disabled={!canEdit} min={openFrom} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Notes</Label>
            <Input value={el.description ?? ""} disabled={readOnly} onChange={(e) => set({ description: e.target.value || undefined })} placeholder="What it's for, eligibility" />
          </div>
          {!isNew && (
            <Row label="Active" hint="Inactive elements stop being paid from the effective date; history keeps them.">
              <Switch checked={el.active} disabled={readOnly} onCheckedChange={(v) => set({ active: v })} />
            </Row>
          )}
        </div>
        {!!element?.history?.length && (
          <div className="rounded-lg border p-3 text-[11px]">
            <p className="mb-1 font-semibold">Earlier versions</p>
            {element.history.map((v) => (
              <p key={v.effectiveTo} className="text-muted-foreground">
                Until {v.effectiveTo}: {calcLabel(v.rules.calculationType)} · {taxTreatmentOf(v.rules)} · {v.rules.pensionable ? "pensionable" : "non-pensionable"} · {v.rules.recurring ? "recurring" : "one-off"}
                {v.rules.glCode ? ` · GL ${v.rules.glCode}` : ""}
              </p>
            ))}
          </div>
        )}
        {!isNew && diff.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3 text-[11px]">
            <p className="mb-1 font-semibold">This change</p>
            {diff.map((d) => <p key={d.field}><span className="text-muted-foreground">{d.field}:</span> {d.before} → <b>{d.after}</b></p>)}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{canEdit ? "Cancel" : "Close"}</Button>
          {canEdit && (
            <Button
              disabled={!code || clash || !el.name.trim() || (!isNew && !diff.length)}
              onClick={() => {
                onSave({ ...el, code, name: el.name.trim(), effectiveFrom: isNew ? from : el.effectiveFrom, taxable: el.category === "earning" ? treatment !== "exempt" : false }, from);
                onClose();
              }}
            >
              {el.approval === "two_person" || element?.approval === "two_person" ? "Send for approval" : isNew ? "Add element" : "Save change"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Salary structures ───────────────────────────────────────────────────────

function Structures({ canEdit }: { canEdit: boolean }) {
  const { data, bundle } = useTenantPayroll();
  const people = (bundle?.employees ?? []).filter((e) => e.status !== "terminated");
  // Leavers have no salary to change; keep them out of the picker. Memoised so the picker's list isn't rebuilt every render.
  const leavers = useMemo(() => (bundle?.employees ?? []).filter((e) => e.status === "terminated").map((e) => e.id), [bundle]);
  const [employeeId, setEmployeeId] = useState(people[0]?.id ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const versions = (data?.structures ?? []).filter((s) => s.employeeId === employeeId).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const current = data ? structureOn(data.structures, employeeId, today) : null;
  const elements = data?.elements ?? [];
  const total = (lines: { amount: number }[]) => round2(lines.reduce((s, l) => s + l.amount, 0));

  return (
    <Card
      title="Salary structures"
      description="What each person is paid every month, versioned: a raise is a new version from its effective date, so “what were they paid in March” always has an answer. Propose → see the financial impact → approval → applied in the right period (back-dated changes pay arrears) → kept in the salary history with its evidence."
      right={
        <EmployeePicker
          className="w-72"
          value={employeeId}
          excludeIds={leavers}
          clearable={false}
          placeholder="Search employees…"
          onChange={(e) => {
            if (!e) return;
            setEmployeeId(e.id);
          }}
        />
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.id} className={cn("rounded-lg border p-3", v === current && "border-primary/40 bg-[color-mix(in_oklab,var(--primary)_5%,var(--card))]", v.status === "rejected" && "opacity-50")}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">
                  {v.effectiveFrom} → {v.status === "pending" || v.status === "rejected" ? "—" : v.effectiveTo ?? "now"}{" "}
                  {v === current && <Badge className="ml-1 text-[9px]">Current</Badge>}
                  {v.status === "pending" && <Badge variant="outline" className="ml-1 border-amber-500/40 text-[9px] text-amber-700">Awaiting approval</Badge>}
                  {v.status === "rejected" && <Badge variant="outline" className="ml-1 text-[9px]">Rejected</Badge>}
                </p>
                <p className="text-xs font-semibold tabular-nums">{money(total(v.lines))}/mo</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {v.reason}
                {v.proposedBy ? ` · proposed by ${v.proposedBy}` : ""}
                {v.approvedBy ? ` · ${v.status === "rejected" ? "rejected" : "approved"} by ${v.approvedBy}` : ""}
                {v.batchId ? ` · bulk review ${v.batchId}` : ""}
              </p>
              {v.evidence && <p className="text-[10px] text-muted-foreground">Evidence: {v.evidence.fileName}</p>}
              {v.impact && (
                <p className="text-[10px] text-muted-foreground">
                  Net {money(v.impact.before.net, 0)} → {money(v.impact.after.net, 0)} · employer cost {money(v.impact.before.employerCost, 0)} → {money(v.impact.after.employerCost, 0)} a month
                </p>
              )}
              <div className="mt-2 grid grid-cols-2 gap-x-4 text-[11px]">
                {v.lines.map((l) => (
                  <div key={l.code} className="flex justify-between"><span className="text-muted-foreground">{elements.find((e) => e.code === l.code)?.name ?? l.code}</span><span className="tabular-nums">{money(l.amount, 0)}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {canEdit && current && !versions.some((v) => v.status === "pending") && <SalaryProposal key={employeeId + current.id} employeeId={employeeId} current={current} />}
      </div>
    </Card>
  );
}

// ── Tax profiles ────────────────────────────────────────────────────────────

const PROFILES_PAGE_SIZE = 10;

function Profiles({ canEdit, focus }: { canEdit: boolean; focus: string | null }) {
  const { data, bundle } = useTenantPayroll();
  const [editing, setEditing] = useState<string | null>(focus);
  const people = new Map((bundle?.employees ?? []).map((e) => [e.id, e]));
  const rows = (data?.profiles ?? []).filter((p) => people.get(p.employeeId)?.status !== "terminated");
  const profile = rows.find((p) => p.employeeId === editing) ?? null;

  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? rows.filter((p) => {
        const e = people.get(p.employeeId);
        return [e?.fullName, e?.employeeNumber, p.employeeId, p.tin].some((v) => v?.toLowerCase().includes(needle));
      })
    : rows;
  // Open on the page holding a deep-linked (?focus=) employee.
  const [page, setPage] = useState(() => {
    const i = focus ? rows.findIndex((p) => p.employeeId === focus) : -1;
    return i > 0 ? Math.floor(i / PROFILES_PAGE_SIZE) + 1 : 1;
  });
  const totalPages = Math.max(1, Math.ceil(shown.length / PROFILES_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PROFILES_PAGE_SIZE;
  const pageRows = shown.slice(pageStart, pageStart + PROFILES_PAGE_SIZE);

  return (
    <Card
      title="Tax & statutory profiles"
      description="Everything the statutory engine needs per person. Rent Relief only applies once the tenancy agreement or receipt is verified."
      right={
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 pl-8 text-xs"
            placeholder="Search by name, employee ID or TIN"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
      }
    >
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[820px] text-xs">
          <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Employee</th><th className="px-3 py-2 font-medium">TIN</th><th className="px-3 py-2 font-medium">Tax state</th>
              <th className="px-3 py-2 font-medium">PFA · RSA PIN</th><th className="px-3 py-2 text-right font-medium">Annual rent</th><th className="px-3 py-2 font-medium">Evidence</th><th className="px-3 py-2 font-medium">Bank</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr className="border-t">
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  {rows.length ? `No employee matches “${q.trim()}”.` : "No tax profiles yet."}
                </td>
              </tr>
            )}
            {pageRows.map((p) => (
              <tr key={p.employeeId} className={cn("cursor-pointer border-t hover:bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))]", focus === p.employeeId && "bg-[color-mix(in_oklab,var(--primary)_5%,var(--card))]")} onClick={() => setEditing(p.employeeId)}>
                <td className="px-3 py-2">
                  <p className="font-medium">{people.get(p.employeeId)?.fullName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{people.get(p.employeeId)?.employeeNumber ?? p.employeeId}</p>
                </td>
                <td className={cn("px-3 py-2 font-mono", !p.tin && "text-rose-600")}>{p.tin || "Missing"}</td>
                <td className="px-3 py-2">{p.stateOfResidence}</td>
                <td className="px-3 py-2">
                  <p>{p.pfaName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{p.rsaPin || "—"}</p>
                  {!!p.avc?.value && <p className="text-[10px] text-primary">AVC {p.avc.mode === "percent" ? `${p.avc.value}%` : `${money(p.avc.value, 0)}/mo`}</p>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{p.annualRentDeclared ? money(p.annualRentDeclared, 0) : "—"}</td>
                <td className="px-3 py-2">{p.annualRentDeclared ? (p.rentEvidenceVerified ? <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-600">Verified</Badge> : <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-600">To verify</Badge>) : "—"}</td>
                <td className="px-3 py-2">{p.bankName} <span className="text-muted-foreground">({p.bankCode || "no code"})</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListPagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        summary={`Showing ${pageStart + 1}–${pageStart + pageRows.length} of ${shown.length} employees`}
      />
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
        <div className="space-y-2 rounded-lg border bg-card p-3">
          <Row label="Rent evidence verified" hint={p.rentEvidence ? `On file: ${p.rentEvidence.fileName}` : "No tenancy agreement or receipt uploaded."}>
            <Switch checked={p.rentEvidenceVerified} disabled={!canEdit || !p.annualRentDeclared} onCheckedChange={(v) => setP({ ...p, rentEvidenceVerified: v })} />
          </Row>
          <Row label="NHF eligible"><Switch checked={p.nhfEligible} disabled={!canEdit} onCheckedChange={(v) => setP({ ...p, nhfEligible: v })} /></Row>
          <Row label="Enrolled in NHIA"><Switch checked={p.nhisEnrolled} disabled={!canEdit} onCheckedChange={(v) => setP({ ...p, nhisEnrolled: v })} /></Row>
        </div>
        <div className="space-y-2 rounded-lg border bg-card p-3">
          <p className="text-xs font-medium">Private health plan (HMO)</p>
          <HmoEnrolmentFields profile={p} canEdit={canEdit} onChange={(hmo) => setP({ ...p, hmo })} />
        </div>
        <div className="space-y-2 rounded-lg border bg-card p-3">
          <Row label="Voluntary pension (AVC)" hint="Extra contribution to the employee's RSA, deducted from pay each month, remitted to the PFA with the mandatory 8% and relieved from PAYE.">
            <div className="flex items-center gap-2">
              <Select
                value={p.avc?.value ? p.avc.mode : "none"}
                disabled={!canEdit}
                onValueChange={(v) =>
                  setP({ ...p, avc: v === "none" ? null : { mode: v as "fixed" | "percent", value: p.avc?.value || (v === "percent" ? 2 : 10_000), startDate: p.avc?.startDate ?? new Date().toISOString().slice(0, 10) } })
                }
              >
                <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">None</SelectItem>
                  <SelectItem value="fixed" className="text-xs">Fixed ₦ a month</SelectItem>
                  <SelectItem value="percent" className="text-xs">% of pensionable pay</SelectItem>
                </SelectContent>
              </Select>
              {!!p.avc?.value && (
                <Input
                  type="number"
                  min={0}
                  step={p.avc.mode === "percent" ? 0.5 : 1000}
                  className="h-8 w-28 text-xs"
                  disabled={!canEdit}
                  aria-label={p.avc.mode === "percent" ? "AVC percentage" : "AVC monthly amount"}
                  value={p.avc.value}
                  onChange={(e) => setP({ ...p, avc: { ...p.avc!, value: Math.max(0, Number(e.target.value) || 0) } })}
                />
              )}
            </div>
          </Row>
          {!!p.avc?.value && (
            <Row label="Employee mandate" hint="The employee's signed instruction to deduct the AVC. Without it payroll flags a warning on every run.">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <Input className="h-8 w-32 text-xs" disabled={!canEdit} placeholder="Reference" value={p.avc.mandate?.reference ?? ""} onChange={(e) => setP({ ...p, avc: { ...p.avc!, mandate: e.target.value ? { reference: e.target.value, signedOn: p.avc!.mandate?.signedOn ?? new Date().toISOString().slice(0, 10), fileName: p.avc!.mandate?.fileName } : null } })} />
                <Input type="date" className="h-8 w-36 text-xs" disabled={!canEdit || !p.avc.mandate} value={p.avc.mandate?.signedOn ?? ""} onChange={(e) => setP({ ...p, avc: { ...p.avc!, mandate: { ...p.avc!.mandate!, signedOn: e.target.value } } })} />
              </div>
            </Row>
          )}
          {!!p.avc?.value && (
            <Row label="AVC starts">
              <Input type="date" className="h-8 w-40 text-xs" disabled={!canEdit} value={p.avc.startDate ?? ""} onChange={(e) => setP({ ...p, avc: { ...p.avc!, startDate: e.target.value || undefined } })} />
            </Row>
          )}
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

function Rates({ rateSets, settings, canEdit }: { rateSets: StatutoryRateSet[]; settings: PayrollSettings; canEdit: boolean }) {
  const actions = usePayrollActions();
  const sorted = [...rateSets].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const [adding, setAdding] = useState(false);
  const latest = sorted[0];
  const actor = useCurrentActor();
  const { data } = useTenantPayroll();
  const [effective, setEffective] = useState(`${Math.max(new Date().getFullYear() + 1, Number(latest.effectiveFrom.slice(0, 4)) + 1)}-01-01`);
  const [label, setLabel] = useState("");
  const [rates, setRates] = useState(latest.payeBands.map((b) => b.rate * 100));
  const [other, setOther] = useState(() => ({
    minimumWageMonthly: latest.minimumWageMonthly,
    employeePensionRate: latest.employeePensionRate * 100,
    employerPensionRate: latest.employerPensionRate * 100,
    nhfRate: latest.nhfRate * 100,
    nsitfRate: latest.nsitfRate * 100,
    itfRate: latest.itfRate * 100,
    rentReliefRate: latest.rentReliefRate * 100,
    rentReliefCap: latest.rentReliefCap,
    lossOfOfficeExemption: latest.lossOfOfficeExemption,
  }));
  const pending = (data?.configChanges ?? []).filter((c) => c.status === "pending" && c.area === "rate_set");
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
              setOther({
                minimumWageMonthly: latest.minimumWageMonthly,
                employeePensionRate: latest.employeePensionRate * 100,
                employerPensionRate: latest.employerPensionRate * 100,
                nhfRate: latest.nhfRate * 100,
                nsitfRate: latest.nsitfRate * 100,
                itfRate: latest.itfRate * 100,
                rentReliefRate: latest.rentReliefRate * 100,
                rentReliefCap: latest.rentReliefCap,
                lossOfOfficeExemption: latest.lossOfOfficeExemption,
              });
              setAdding(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> New rate set
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {pending.map((c) => (
          <div key={c.id} className="rounded-lg border border-dashed border-amber-500/50 p-3 text-xs">
            <p className="font-semibold">{c.summary} <Badge variant="outline" className="ml-1 border-amber-500/40 text-[9px] text-amber-700">Awaiting second approver</Badge></p>
            <p className="text-muted-foreground">Requested by {c.requestedBy} · effective {c.effectiveFrom} · approve it in Change History.</p>
          </div>
        ))}
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
                  ["NHF", `${rs.nhfRate * 100}% of ${nhfBasisOf(settings) === "gross" ? "gross pay" : "basic"}`],
                  ["NHIA", `${rs.nhisEmployeeRate * 100}% / ${rs.nhisEmployerRate * 100}% of basic`],
                  ["NSITF", `${rs.nsitfRate * 100}% of payroll`],
                  ["ITF", `${rs.itfRate * 100}% of payroll`],
                  ["Group life", `${rs.groupLifeMultiplier}× annual emoluments${groupLifeOf(settings).enabled ? ` · ${groupLifeOf(settings).ratePct}% premium` : " · off"}`],
                  ["Loss-of-office exempt", money(rs.lossOfOfficeExemption, 0)],
                  ["CRA", "Repealed from 1 Jan 2026"],
                ].map(([k, v]) => (
                  <div key={k} className="contents"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <p className="rounded-lg bg-[color-mix(in_oklab,var(--color-amber-500)_10%,var(--card))] px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
          Rates are seeded from industry reporting of the Nigeria Tax Act 2025. Confirm them against Nigeria Revenue Service guidance with your tax adviser before the first live payroll.
        </p>
      </div>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New statutory rate set</DialogTitle>
            <DialogDescription>Starts from the latest set. Pay periods from the effective date use it; earlier periods keep their rules. Statutory changes take effect only once a second payroll settings user approves them.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Effective from</Label>
                <Input type="date" min={latest.effectiveFrom} value={effective} onChange={(e) => setEffective(e.target.value.slice(0, 8) + "01")} />
                {effective.slice(5) !== "01-01" && rates.some((r, j) => r !== latest.payeBands[j].rate * 100) && <p className="text-[10px] text-amber-700">PAYE bands changing mid-year: cumulative PAYE re-spreads the year from this month.</p>}
              </div>
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {(
                [
                  ["minimumWageMonthly", "Minimum wage (₦/month)", 1000],
                  ["employeePensionRate", "Employee pension (%)", 0.5],
                  ["employerPensionRate", "Employer pension (%)", 0.5],
                  ["nhfRate", "NHF (%)", 0.5],
                  ["nsitfRate", "NSITF (%)", 0.5],
                  ["itfRate", "ITF (%)", 0.5],
                  ["rentReliefRate", "Rent relief (% of rent)", 1],
                  ["rentReliefCap", "Rent relief cap (₦/year)", 10000],
                  ["lossOfOfficeExemption", "Loss-of-office exemption (₦)", 1000000],
                ] as const
              ).map(([k, l, step]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{l}</span>
                  <Input type="number" step={step} className="h-7 w-28 text-right text-xs" value={other[k]} onChange={(e) => setOther({ ...other, [k]: Math.max(0, Number(e.target.value) || 0) })} />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            <Button
              disabled={!label.trim() || effective <= latest.effectiveFrom}
              onClick={() => {
                actions.addRateSet({
                  ...latest,
                  id: `NG-RS-${effective}`,
                  label: label.trim(),
                  effectiveFrom: effective,
                  payeBands: latest.payeBands.map((b, j) => ({ ...b, rate: rates[j] / 100 })),
                  minimumWageMonthly: other.minimumWageMonthly,
                  employeePensionRate: other.employeePensionRate / 100,
                  employerPensionRate: other.employerPensionRate / 100,
                  nhfRate: other.nhfRate / 100,
                  nsitfRate: other.nsitfRate / 100,
                  itfRate: other.itfRate / 100,
                  rentReliefRate: other.rentReliefRate / 100,
                  rentReliefCap: other.rentReliefCap,
                  lossOfOfficeExemption: other.lossOfOfficeExemption,
                  createdBy: actor.name,
                  createdAt: new Date().toISOString().slice(0, 10),
                });
                setAdding(false);
                toast.success("Rate set sent for approval", { description: `Once a second person approves it in Change History, it applies to pay periods from ${effective}.` });
              }}
            >
              Send for approval
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
      <Card title="Employer lines on the payslip" description="Which employer contributions appear under “Paid by your employer”. Hiding a line changes the payslip only — it is still calculated, remitted and shown on the employer's breakdowns and statutory reports.">
        {EMPLOYER_LINE_LABELS.map((l) => (
          <Row key={l.code} label={l.label} hint={l.hint}>
            <Switch
              checked={employerLineShown(p, l.code)}
              disabled={!canEdit || !p.showEmployerContributions}
              onCheckedChange={(v) => set({ employerLines: { ...(p.employerLines ?? {}), [l.code]: v } })}
            />
          </Row>
        ))}
        {!p.showEmployerContributions && <p className="text-[11px] text-muted-foreground">Employer contributions are switched off for the whole payslip.</p>}
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
