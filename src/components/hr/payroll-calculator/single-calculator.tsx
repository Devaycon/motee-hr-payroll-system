"use client";

import { useMemo } from "react";
import { HeartPulse, Landmark, PiggyBank, RotateCcw, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { writeTable, type ExportFormat } from "@/src/lib/payroll/exports";
import {
  calculateSalary,
  DEFAULT_GROUP_LIFE_BASIS,
  DEFAULT_GROUP_LIFE_MONTHS_OF_COVER,
  DEFAULT_GROUP_LIFE_PREMIUM_RATE,
  DEFAULT_NHF_BASIS,
  type SalaryInputs,
} from "@/src/lib/payroll-calculator/tax-calculations";
import { DownloadMenu } from "../payroll/components/row-actions";
import { CalculationResult, calculationTable, naira } from "./result-panels";

/** The website calculator's starting values. */
export const DEFAULT_INPUTS: SalaryInputs = {
  basicSalary: 0,
  housingAllowance: 0,
  transportAllowance: 0,
  otherAllowances: 0,
  annualRentPaid: 0,
  annualMortgageInterest: 0,
  annualLifeInsurancePremium: 0,
  monthlyVoluntaryPension: 0,
  includeNHF: true,
  nhfBasis: DEFAULT_NHF_BASIS,
  includeNHIS: true,
  includeITF: true,
  groupLifePremiumRate: DEFAULT_GROUP_LIFE_PREMIUM_RATE,
  groupLifeMonthsOfCover: DEFAULT_GROUP_LIFE_MONTHS_OF_COVER,
  groupLifeBasis: DEFAULT_GROUP_LIFE_BASIS,
};

/** Single employee: inputs on the left, the full breakdown on the right, recalculated as you type. */
export function SingleCalculator({ inputs, onChange, label }: { inputs: SalaryInputs; onChange: (i: SalaryInputs) => void; label?: string }) {
  const c = useMemo(() => calculateSalary(inputs), [inputs]);
  const set = (p: Partial<SalaryInputs>) => onChange({ ...inputs, ...p });
  const changed = JSON.stringify(inputs) !== JSON.stringify(DEFAULT_INPUTS);
  const download = (f: ExportFormat) => writeTable(`payroll-calculation${label ? `-${label.replace(/\W+/g, "-").toLowerCase()}` : ""}`, "Calculation", calculationTable(inputs, c, `Payroll calculation${label ? ` — ${label}` : ""}`), f);

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <div className="flex flex-col gap-3">
        <Section icon={Wallet} title="Monthly pay" right={<span className="text-xs text-muted-foreground">Gross <span className="font-semibold tabular-nums text-foreground">{naira(c.monthlyGross)}</span></span>}>
          <MoneyField label="Basic salary" value={inputs.basicSalary} onChange={(v) => set({ basicSalary: v })} />
          <MoneyField label="Housing allowance" value={inputs.housingAllowance} onChange={(v) => set({ housingAllowance: v })} />
          <MoneyField label="Transport allowance" value={inputs.transportAllowance} onChange={(v) => set({ transportAllowance: v })} />
          <MoneyField label="Other allowances" value={inputs.otherAllowances} onChange={(v) => set({ otherAllowances: v })} />
        </Section>

        <Section icon={PiggyBank} title="Voluntary pension & reliefs" sub="Reduce taxable income">
          <MoneyField label="Voluntary pension (monthly)" value={inputs.monthlyVoluntaryPension} onChange={(v) => set({ monthlyVoluntaryPension: v })} />
          <MoneyField label="Annual rent paid" hint="20% relieved, max ₦500,000" value={inputs.annualRentPaid} onChange={(v) => set({ annualRentPaid: v })} />
          <MoneyField label="Annual mortgage interest" hint="Owner-occupied home" value={inputs.annualMortgageInterest} onChange={(v) => set({ annualMortgageInterest: v })} />
          <MoneyField label="Annual life insurance premium" value={inputs.annualLifeInsurancePremium} onChange={(v) => set({ annualLifeInsurancePremium: v })} />
        </Section>

        <Section icon={Landmark} title="Statutory contributions">
          <ToggleRow label="National Housing Fund (2.5%)" checked={inputs.includeNHF} onChange={(v) => set({ includeNHF: v })}>
            {inputs.includeNHF && (
              <Select value={inputs.nhfBasis} onValueChange={(v) => set({ nhfBasis: v as SalaryInputs["nhfBasis"] })}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross" className="text-xs">On gross pay</SelectItem>
                  <SelectItem value="basic" className="text-xs">On basic salary</SelectItem>
                </SelectContent>
              </Select>
            )}
          </ToggleRow>
          <ToggleRow label="Health insurance (NHIS)" hint="Employee 5%, employer 10% of basic" checked={inputs.includeNHIS} onChange={(v) => set({ includeNHIS: v })} />
          <ToggleRow label="Industrial Training Fund (ITF)" hint="1% of payroll, employer" checked={inputs.includeITF} onChange={(v) => set({ includeITF: v })} />
        </Section>

        <Section icon={HeartPulse} title="Group life assurance" sub="Employer-paid, 3× annual pay cover">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Premium rate (%)">
              <Input type="number" min={0} step={0.05} className="h-8 text-xs" value={inputs.groupLifePremiumRate} onChange={(e) => set({ groupLifePremiumRate: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
            <Field label="Months of cover">
              <Input type="number" min={0} max={12} className="h-8 text-xs" value={inputs.groupLifeMonthsOfCover} onChange={(e) => set({ groupLifeMonthsOfCover: Math.min(12, Math.max(0, Math.round(Number(e.target.value) || 0))) })} />
            </Field>
            <Field label="Cover based on">
              <Select value={inputs.groupLifeBasis} onValueChange={(v) => set({ groupLifeBasis: v as SalaryInputs["groupLifeBasis"] })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross" className="text-xs">Gross</SelectItem>
                  <SelectItem value="bht" className="text-xs">BHT</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!changed} onClick={() => onChange(DEFAULT_INPUTS)}><RotateCcw className="h-3.5 w-3.5" /> Reset</Button>
          <div className="ml-auto"><DownloadMenu label="Download" disabled={c.monthlyGross <= 0} onDownload={download} /></div>
        </div>
      </div>

      <div className="min-w-0">
        {label && <p className="mb-2 text-xs text-muted-foreground">Showing <span className="font-medium text-foreground">{label}</span> from the uploaded sheet — edit any figure to recalculate.</p>}
        <CalculationResult inputs={inputs} c={c} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, sub, right, children }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold"><Icon className="h-4 w-4 text-primary" /> {title}{sub && <span className="font-normal text-muted-foreground">· {sub}</span>}</p>
        {right}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}{hint && <span className="ml-1 font-normal opacity-80">· {hint}</span>}</Label>
      {children}
    </div>
  );
}

/** ₦ amount input: blank shows as empty, typing a number updates immediately. */
function MoneyField({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₦</span>
        <Input type="number" min={0} step={1000} inputMode="decimal" className="h-9 pl-6 text-sm tabular-nums" value={value || ""} placeholder="0" onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
      </div>
    </Field>
  );
}

function ToggleRow({ label, hint, checked, onChange, children }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="flex min-w-0 items-center gap-2 text-xs">
        <Switch checked={checked} onCheckedChange={onChange} />
        <span className="min-w-0">{label}{hint && <span className="block text-[10px] text-muted-foreground">{hint}</span>}</span>
      </label>
      {children}
    </div>
  );
}
