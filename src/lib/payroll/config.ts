import type {
  ConfigFieldChange,
  PayElement,
  PayElementVersion,
  PayrollSettings,
  SettingsVersion,
  StatutoryRateSet,
} from "./types";
import { ELEMENT_RULE_KEYS } from "./types";

/**
 * Effective-dated payroll configuration and its change history.
 *
 * Nothing that drives a calculation is overwritten in place:
 *   • statutory rate sets are chosen by the period's date (`resolveRateSet`);
 *   • a pay element keeps its earlier rules in `history`, each valid until
 *     the date the change took effect (`elementOn`);
 *   • tenant settings keep a version per change (`settingsOn`).
 * So recalculating September 2026 in January 2027 uses September's rules.
 */

// ── Pay elements ────────────────────────────────────────────────────────────

/** The tax treatment an element has, whether set explicitly or implied by `taxable`. */
export function taxTreatmentOf(el: Pick<PayElement, "taxTreatment" | "taxable">) {
  return el.taxTreatment ?? (el.taxable ? "taxable" : "exempt");
}

/** The element's rules as they stood on `date` (ISO). Null when it isn't in force yet. */
export function elementOn(el: PayElement, date: string): PayElement | null {
  if (el.effectiveFrom && date < el.effectiveFrom) return null;
  // History is newest first; the version in force is the oldest one that ends after `date`.
  let rules: Partial<PayElement> = {};
  for (const v of el.history ?? []) if (date < v.effectiveTo) rules = v.rules;
  const resolved = { ...el, ...rules };
  // A conditional element is taxable (above its cap) — the engine relieves the exempt part.
  return { ...resolved, taxable: taxTreatmentOf(resolved) !== "exempt" };
}

/** Element master as it stood on `date`, keyed by code. */
export function elementMapOn(elements: PayElement[], date: string): Map<string, PayElement> {
  const m = new Map<string, PayElement>();
  for (const e of elements) {
    const on = elementOn(e, date);
    if (on) m.set(e.code, on);
  }
  return m;
}

/**
 * Apply an edit to an element from `effectiveFrom`: the old rules go into
 * `history` so earlier periods keep them. Edits that don't touch a rule
 * (description, approval) just apply.
 */
export function versionElement(before: PayElement, after: PayElement, effectiveFrom: string): PayElement {
  const ruleChanged = ELEMENT_RULE_KEYS.some((k) => (before[k] ?? null) !== (after[k] ?? null));
  if (!ruleChanged) return { ...after, history: before.history };
  const rules = Object.fromEntries(ELEMENT_RULE_KEYS.map((k) => [k, before[k]])) as PayElementVersion["rules"];
  return { ...after, history: [{ effectiveTo: effectiveFrom, rules }, ...(before.history ?? [])] };
}

const yesNo = (v: unknown) => (v ? "Yes" : "No");
const CALC_LABEL: Record<string, string> = {
  fixed: "Fixed amount",
  percent_of_basic: "% of basic",
  percent_of_gross: "% of gross",
  rate_x_units: "Rate × units",
  formula: "Formula",
  manual: "Variable (keyed each period)",
};
export const calcLabel = (c: string) => CALC_LABEL[c] ?? c;

const ELEMENT_FIELDS: { key: keyof PayElement; label: string; show: (e: PayElement) => string }[] = [
  { key: "name", label: "Description", show: (e) => e.name },
  { key: "category", label: "Category", show: (e) => e.category },
  { key: "calculationType", label: "Calculation method", show: (e) => calcLabel(e.calculationType) },
  { key: "taxTreatment", label: "Tax treatment", show: (e) => taxTreatmentOf(e) + (taxTreatmentOf(e) === "conditional" ? ` (exempt up to ₦${(e.taxExemptMonthlyCap ?? 0).toLocaleString("en-NG")}/month)` : "") },
  { key: "pensionable", label: "Pensionable", show: (e) => yesNo(e.pensionable) },
  { key: "recurring", label: "Recurrence", show: (e) => (e.recurring ? "Recurring" : "One-off") },
  { key: "proratable", label: "Pro-rated", show: (e) => yesNo(e.proratable) },
  { key: "glCode", label: "Accounting code", show: (e) => e.glCode || "—" },
  { key: "approval", label: "Approval requirement", show: (e) => (e.approval === "two_person" ? "Second approver" : "Payroll settings admin") },
  { key: "effectiveFrom", label: "Effective date", show: (e) => e.effectiveFrom || "—" },
  { key: "active", label: "Active", show: (e) => yesNo(e.active) },
];

export function diffElement(before: PayElement | null, after: PayElement): ConfigFieldChange[] {
  return ELEMENT_FIELDS.map((f) => ({ field: f.label, before: before ? f.show(before) : "—", after: f.show(after) })).filter((c) => c.before !== c.after);
}

// ── Rate sets ───────────────────────────────────────────────────────────────

const pct = (n: number) => `${+(n * 100).toFixed(3)}%`;
const ngn = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export function diffRateSet(before: StatutoryRateSet, after: StatutoryRateSet): ConfigFieldChange[] {
  const out: ConfigFieldChange[] = [];
  const add = (field: string, a: string, b: string) => a !== b && out.push({ field, before: a, after: b });
  add("PAYE bands", before.payeBands.map((b) => pct(b.rate)).join(" / "), after.payeBands.map((b) => pct(b.rate)).join(" / "));
  add("Minimum wage (monthly)", ngn(before.minimumWageMonthly), ngn(after.minimumWageMonthly));
  add("Employee pension", pct(before.employeePensionRate), pct(after.employeePensionRate));
  add("Employer pension", pct(before.employerPensionRate), pct(after.employerPensionRate));
  add("NHF", pct(before.nhfRate), pct(after.nhfRate));
  add("NSITF", pct(before.nsitfRate), pct(after.nsitfRate));
  add("ITF", pct(before.itfRate), pct(after.itfRate));
  add("Rent relief", `${pct(before.rentReliefRate)} capped at ${ngn(before.rentReliefCap)}`, `${pct(after.rentReliefRate)} capped at ${ngn(after.rentReliefCap)}`);
  add("Loss-of-office exemption", ngn(before.lossOfOfficeExemption), ngn(after.lossOfOfficeExemption));
  add("Effective from", before.effectiveFrom, after.effectiveFrom);
  return out;
}

// ── Settings ────────────────────────────────────────────────────────────────

const SETTING_LABELS: Partial<Record<keyof PayrollSettings, string>> = {
  taxMethod: "PAYE method",
  prorationBasis: "Pro-ration basis",
  payDay: "Pay day",
  inputCutoffDay: "Input cut-off day",
  nhisEnabled: "Health insurance (NHIA)",
  nhfBasis: "NHF basis",
  groupLife: "Group life assurance",
  leaveAllowance: "Leave allowance policy",
  itfApplicable: "ITF applies",
  avcTaxRelieved: "AVC relieved from PAYE",
  deductLoansViaPayroll: "Deduct loans via payroll",
  payExpensesViaPayroll: "Pay expenses via payroll",
  varianceThresholdPct: "Variance threshold",
  allowPayeRefunds: "Allow PAYE refunds",
  employeePreview: "Employee preview",
  basicMin: "Basic salary minimum",
  basicMax: "Basic salary maximum",
  defaultSplit: "Default salary split",
  employmentTypeRules: "Treatment by employment type",
  payslip: "Payslip sections",
  employerIds: "Employer registrations",
  enabledGroups: "Enabled element groups",
  budget: "Payroll budget",
  hmo: "HMO providers & plans",
  budgetAlertPct: "Budget alert threshold",
  remittanceReminderDays: "Remittance reminder",
};

function show(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "boolean") return yesNo(v);
  if (typeof v === "number") return v.toLocaleString("en-NG");
  if (typeof v === "string") return v;
  return JSON.stringify(v).replace(/[{}"]/g, "").replace(/,/g, ", ").replace(/:/g, ": ").slice(0, 160);
}

export function diffSettings(before: PayrollSettings, changes: Partial<PayrollSettings>): ConfigFieldChange[] {
  return (Object.keys(changes) as (keyof PayrollSettings)[])
    .map((k) => ({ field: SETTING_LABELS[k] ?? String(k), before: show(before[k]), after: show(changes[k]) }))
    .filter((c) => c.before !== c.after);
}

/** Settings that change calculated figures — changes to these are effective-dated. */
export const CALC_SETTING_KEYS: (keyof PayrollSettings)[] = [
  "taxMethod",
  "prorationBasis",
  "nhisEnabled",
  "nhfBasis",
  "groupLife",
  "itfApplicable",
  "deductLoansViaPayroll",
  "payExpensesViaPayroll",
  "allowPayeRefunds",
  "employmentTypeRules",
  "enabledGroups",
  "leaveAllowance",
  "avcTaxRelieved",
  "hmo",
];

/**
 * The settings in force on `date`. Versions hold the settings as they were
 * FROM their date, so the latest version on or before `date` wins; a date
 * before every version uses the earliest.
 */
export function settingsOn(current: PayrollSettings, versions: SettingsVersion[] | undefined, date: string): PayrollSettings {
  if (!versions?.length) return current;
  const sorted = [...versions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom) || a.changedAt.localeCompare(b.changedAt));
  let chosen = sorted[0].settings;
  for (const v of sorted) if (v.effectiveFrom <= date) chosen = v.settings;
  // Display-only settings always follow the live values.
  return { ...chosen, payslip: current.payslip, employerIds: current.employerIds, budget: current.budget, remittanceReminderDays: current.remittanceReminderDays };
}
