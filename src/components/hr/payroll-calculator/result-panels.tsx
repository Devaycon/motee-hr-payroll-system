"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ExportTable } from "@/src/lib/payroll/exports";
import type { SalaryCalculations, SalaryInputs } from "@/src/lib/payroll-calculator/tax-calculations";
import { formatCurrency } from "@/src/lib/payroll-calculator/format";
import { cn } from "@/src/lib/utils";

export const naira = (n: number) => `₦${formatCurrency(n)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

type Line = { label: string; monthly: number; annual: number; strong?: boolean; hint?: string };

/** Employee deductions, monthly and annual side by side. */
export function deductionLines(i: SalaryInputs, c: SalaryCalculations): Line[] {
  return [
    { label: "Pension (8% of BHT)", monthly: c.employeePension, annual: c.annualEmployeePension },
    ...(c.voluntaryPension > 0 ? [{ label: "Voluntary pension", monthly: c.voluntaryPension, annual: c.annualVoluntaryPension }] : []),
    ...(i.includeNHF ? [{ label: `NHF (2.5% of ${i.nhfBasis === "basic" ? "basic" : "gross"})`, monthly: c.nhf, annual: c.annualNHF }] : []),
    ...(i.includeNHIS ? [{ label: "NHIS (5% of basic)", monthly: c.employeeNHIS, annual: c.annualEmployeeNHIS }] : []),
    { label: c.isMinimumTaxApplied ? "PAYE (minimum tax)" : "PAYE", monthly: c.monthlyPAYE, annual: c.annualPAYE },
    { label: "Total deductions", monthly: c.totalMonthlyDeductions, annual: c.totalMonthlyDeductions * 12, strong: true },
  ];
}

/** Annual reliefs that reduce taxable income. */
export function reliefLines(c: SalaryCalculations): { label: string; amount: number; strong?: boolean }[] {
  return [
    { label: "Pension contribution (8% of BHT)", amount: c.annualEmployeePension },
    ...(c.annualVoluntaryPension > 0 ? [{ label: "Voluntary pension contribution", amount: c.annualVoluntaryPension }] : []),
    { label: "NHF contribution", amount: c.annualNHF },
    { label: "NHIS contribution", amount: c.annualEmployeeNHIS },
    { label: "Rent relief (20%, max ₦500k)", amount: c.rentRelief },
    { label: "Mortgage interest relief", amount: c.mortgageInterestRelief },
    { label: "Life insurance relief", amount: c.lifeInsuranceRelief },
    { label: "Total annual relief", amount: c.totalAnnualRelief, strong: true },
  ];
}

/** Employer contributions, monthly and annual. */
export function employerLines(i: SalaryInputs, c: SalaryCalculations): Line[] {
  return [
    { label: "Pension (10% of BHT)", monthly: c.employerPension, annual: c.employerPension * 12 },
    ...(i.includeNHIS ? [{ label: "NHIS (10% of basic)", monthly: c.employerNHIS, annual: c.employerNHIS * 12 }] : []),
    { label: "NSITF (1% of payroll)", monthly: c.employerNSITF, annual: c.employerNSITF * 12 },
    ...(i.includeITF ? [{ label: "ITF (1% of annual payroll)", monthly: c.employerITF, annual: c.annualEmployerITF }] : []),
    {
      label: "Group life premium",
      monthly: c.monthlyGroupLifePremium,
      annual: c.annualGroupLifePremium,
      hint: `${i.groupLifePremiumRate}% of ${naira(c.groupLifeMinimumCover)} cover (3× annual ${i.groupLifeBasis === "bht" ? "BHT" : "gross"}), ${i.groupLifeMonthsOfCover} month${i.groupLifeMonthsOfCover === 1 ? "" : "s"}`,
    },
    { label: "Total employer contributions", monthly: c.totalEmployerContributions, annual: c.totalEmployerContributions * 12, strong: true },
  ];
}

/** The whole calculation, as a table for Excel / CSV / PDF. */
export function calculationTable(i: SalaryInputs, c: SalaryCalculations, title: string): ExportTable {
  const r = (n: number) => round2(n);
  const data: (string | number)[][] = [
    ["INPUTS", "", ""],
    ["Monthly basic salary", r(i.basicSalary), r(i.basicSalary * 12)],
    ["Monthly housing allowance", r(i.housingAllowance), r(i.housingAllowance * 12)],
    ["Monthly transport allowance", r(i.transportAllowance), r(i.transportAllowance * 12)],
    ["Monthly other allowances", r(i.otherAllowances), r(i.otherAllowances * 12)],
    ["Gross pay", r(c.monthlyGross), r(c.annualGross)],
    ["", "", ""],
    ["EMPLOYEE DEDUCTIONS", "", ""],
    ...deductionLines(i, c).map((l) => [l.label, r(l.monthly), r(l.annual)]),
    ["Net pay", r(c.monthlyNetPay), r(c.monthlyNetPay * 12)],
    ["", "", ""],
    ["TAX", "", ""],
    ...reliefLines(c).map((l) => [l.label, "", r(l.amount)]),
    ["Taxable income", "", r(c.annualTaxableIncome)],
    ...c.taxBandBreakdown.map((b) => [`  ${b.band}`, "", r(b.taxDue)]),
    [c.isMinimumTaxApplied ? "PAYE — minimum tax (1% of gross) applied" : "PAYE", r(c.monthlyPAYE), r(c.annualPAYE)],
    ["Effective tax rate (%)", r(c.effectiveTaxRate), ""],
    ["", "", ""],
    ["EMPLOYER CONTRIBUTIONS", "", ""],
    ...employerLines(i, c).map((l) => [l.label, r(l.monthly), r(l.annual)]),
    ["Total cost to company", r(c.totalEmployerCost), r(c.annualEmployerCost)],
  ];
  return { preamble: [[title], ["Nigeria Tax Act 2025 · calculator only, nothing saved to payroll"], []], headers: ["Item", "Monthly (₦)", "Annual (₦)"], data };
}

/** Results: net pay, headline figures and the four breakdown tables. */
export function CalculationResult({ inputs, c, compact = false }: { inputs: SalaryInputs; c: SalaryCalculations; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Monthly take-home pay</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{naira(c.monthlyNetPay)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {c.effectiveTaxRate.toFixed(1)}% effective tax rate · {naira(c.monthlyNetPay * 12)} a year
        </p>
        {c.isMinimumTaxApplied && c.monthlyGross > 0 && (
          <p className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Reliefs bring tax to nil, so the minimum tax of 1% of gross ({naira(c.minimumTax)} a year) applies.
          </p>
        )}
      </div>

      <div className={cn("grid gap-3", compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 xl:grid-cols-4")}>
        <Tile label="Monthly gross" value={naira(c.monthlyGross)} />
        <Tile label="Annual gross" value={naira(c.annualGross)} />
        <Tile label="PAYE (annual)" value={naira(c.annualPAYE)} sub={`${naira(c.monthlyPAYE)} a month`} />
        <Tile label="Cost to company" value={naira(c.totalEmployerCost)} sub={`${naira(c.annualEmployerCost)} a year`} />
      </div>

      <Panel title="Employee deductions" note="taken from pay">
        <MoneyTable lines={deductionLines(inputs, c)} />
      </Panel>

      <div className={cn("grid gap-4", !compact && "2xl:grid-cols-2")}>
        <Panel title="Tax reliefs & taxable income" note="annual">
          <table className="w-full text-xs">
            <tbody>
              {reliefLines(c).map((l) => (
                <tr key={l.label} className={cn("border-t first:border-t-0", l.strong && "font-semibold")}>
                  <td className="py-1.5">{l.label}</td>
                  <td className="py-1.5 text-right tabular-nums">{naira(l.amount)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-foreground/20 font-semibold">
                <td className="py-1.5">Taxable income</td>
                <td className="py-1.5 text-right tabular-nums">{naira(c.annualTaxableIncome)}</td>
              </tr>
            </tbody>
          </table>
        </Panel>
        <Panel title="PAYE by band" note="Nigeria Tax Act 2025">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr><th className="pb-1 font-medium">Band</th><th className="pb-1 text-right font-medium">Taxable</th><th className="pb-1 text-right font-medium">Tax</th></tr>
            </thead>
            <tbody>
              {c.taxBandBreakdown.map((b) => (
                <tr key={b.band} className="border-t">
                  <td className="py-1.5">{b.band}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">{naira(b.taxableIncome)}</td>
                  <td className="py-1.5 text-right tabular-nums">{naira(b.taxDue)}</td>
                </tr>
              ))}
              {!c.taxBandBreakdown.length && <tr><td colSpan={3} className="py-2 text-muted-foreground">Enter a salary to see the bands.</td></tr>}
              <tr className="border-t-2 border-foreground/20 font-semibold">
                <td className="py-1.5">{c.isMinimumTaxApplied ? "Minimum tax applies" : "Annual PAYE"}</td>
                <td />
                <td className="py-1.5 text-right tabular-nums">{naira(c.annualPAYE)}</td>
              </tr>
            </tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Employer contributions" note="paid on top of gross — not deducted">
        <MoneyTable lines={employerLines(inputs, c)} />
        <div className="mt-2 flex justify-between border-t-2 border-foreground/20 pt-2 text-xs font-semibold">
          <span>Total cost to company</span>
          <span className="tabular-nums">{naira(c.totalEmployerCost)} <span className="font-normal text-muted-foreground">/ {naira(c.annualEmployerCost)} a year</span></span>
        </div>
      </Panel>
    </div>
  );
}

function MoneyTable({ lines }: { lines: Line[] }) {
  return (
    <table className="w-full text-xs">
      <thead className="text-left text-muted-foreground">
        <tr><th className="pb-1 font-medium" /><th className="pb-1 text-right font-medium">Monthly</th><th className="pb-1 text-right font-medium">Annual</th></tr>
      </thead>
      <tbody>
        {lines.map((l) => (
          <tr key={l.label} className={cn("border-t", l.strong && "font-semibold")}>
            <td className="py-1.5">{l.label}{l.hint && <span className="block text-[10px] font-normal text-muted-foreground">{l.hint}</span>}</td>
            <td className="py-1.5 text-right tabular-nums">{naira(l.monthly)}</td>
            <td className="py-1.5 text-right tabular-nums text-muted-foreground">{naira(l.annual)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-2 text-sm font-semibold">{title}{note && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">· {note}</span>}</p>
      {children}
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-base font-semibold tabular-nums">{value}</p>
      {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
