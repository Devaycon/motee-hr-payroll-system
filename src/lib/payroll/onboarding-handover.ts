import * as XLSX from "xlsx";
import type { EmployeeRow } from "@/src/lib/types/employees";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { EMPLOYMENT_TYPE_LABELS } from "@/src/lib/constants/employment-types";
import { onboardingRecordToPendingEmployee } from "@/src/lib/demo/pending-employees";
import { buildStarterWorkbook, parseStarterWorkbook, type HrHireRef, type ImportCtx, type StagedRow, type TemplateCtx } from "./starter-import";
import type { PayPeriod, PayrollException, PayrollRun } from "./types";

/**
 * The bridge from HR onboarding to payroll.
 *
 * Onboarding is where genuinely new hires come in; the payroll starter import
 * is for staff moving from another payroll (with year-to-date). A hire who
 * clears onboarding — or is still onboarding but starts this pay month — shows
 * up in payroll as "awaiting payroll setup". Their onboarding details are
 * turned into a starter-template row and run through exactly the same checks
 * as an upload, then added to payroll under the HR record's own id, so both
 * modules count the same person once.
 */

export interface HrHire {
  /** The Employees-module id (`emp-<onboarding id>`) — payroll keeps it. */
  id: string;
  status: "onboarding" | "onboarded";
  row: EmployeeRow;
}

/** Everyone HR has hired through onboarding: cleared hires first, then those still in the workflow. */
export function hrHiresFrom(records: OnboardingRecord[], cleared: EmployeeRow[]): HrHire[] {
  const out = new Map<string, HrHire>();
  for (const row of cleared) if (!out.has(row.id)) out.set(row.id, { id: row.id, status: "onboarded", row });
  for (const r of records) {
    if (r.status === "completed") continue;
    const row = onboardingRecordToPendingEmployee(r);
    if (!out.has(row.id)) out.set(row.id, { id: row.id, status: "onboarding", row });
  }
  return [...out.values()];
}

export const hireRefs = (hires: HrHire[]): HrHireRef[] =>
  hires.map((h) => ({ id: h.id, name: h.row.name, email: h.row.email, employeeNumber: h.row.referenceId, status: h.status }));

/**
 * Who payroll still has to set up: onboarded hires not on payroll yet, plus
 * hires still onboarding whose start date falls in (or before the end of) the
 * open pay month and not earlier than it — payroll can set them up before HR
 * finishes so their first pay isn't missed.
 */
export function handoverQueue(hires: HrHire[], payrollIds: Set<string>, period: Pick<PayPeriod, "start" | "end"> | null): HrHire[] {
  return hires.filter((h) => {
    if (payrollIds.has(h.id)) return false;
    if (h.status === "onboarded") return true;
    return !!period && !!h.row.startDate && h.row.startDate >= period.start;
  });
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Onboarding's employment type → the company's own type name (Internship → Intern). */
function typeName(row: EmployeeRow, types: { id: string; name: string }[]): string {
  const label = EMPLOYMENT_TYPE_LABELS[row.employmentType] ?? String(row.employmentType ?? "");
  const l = norm(label);
  return types.find((t) => norm(t.name) === l)?.name ?? types.find((t) => l.startsWith(norm(t.name)) || norm(t.name).startsWith(l))?.name ?? label;
}

function splitName(name: string): { firstName: string; otherNames: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], otherNames: "", lastName: "" };
  return { firstName: parts[0], otherNames: parts.slice(1, -1).join(" "), lastName: parts[parts.length - 1] };
}

/** One hire as a starter-template row (column keys), from what onboarding collected. */
export function hireToTemplateRow(h: HrHire, bundle: Pick<LocaleBundle, "employmentTypes">): Record<string, string | number> {
  const r = h.row;
  const n = splitName(r.name);
  const out: Record<string, string | number> = {
    employeeNumber: r.referenceId ?? "",
    ...n,
    gender: r.gender ? (/^f/i.test(r.gender) ? "Female" : /^m/i.test(r.gender) ? "Male" : "") : "",
    dateOfBirth: r.dateOfBirth ?? "",
    email: r.email,
    phone: r.phone,
    nin: r.ninNumber ?? "",
    address: r.address ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    jobTitle: r.jobTitle,
    department: r.department,
    branch: r.branchName ?? r.workLocation ?? "",
    grade: r.grade ?? "",
    employmentType: typeName(r, bundle.employmentTypes),
    startDate: r.startDate,
    tin: r.taxId ?? "",
    pfa: r.pfaName ?? "",
    rsaPin: r.pensionId ?? "",
    nhfNumber: r.nhfNumber ?? "",
    bankName: r.bankName ?? "",
    bankCode: r.bankCode ?? "",
    accountNumber: r.bankAccountNumber ?? "",
    accountName: r.bankAccountName ?? "",
    bvn: r.bvn ?? "",
  };
  if (r.payBreakdown?.basic) {
    out["pay:BASIC"] = r.payBreakdown.basic;
    if (r.payBreakdown.housing) out["pay:HOUSING"] = r.payBreakdown.housing;
    if (r.payBreakdown.transport) out["pay:TRANSPORT"] = r.payBreakdown.transport;
  } else if (r.salary > 0) out.annualGross = r.salary;
  return out;
}

/** The starter template pre-filled with these hires — payroll completes the gaps and uploads it. */
export function handoverWorkbook(ctx: TemplateCtx, hires: HrHire[]): XLSX.WorkBook {
  return buildStarterWorkbook(ctx, hires.map((h) => hireToTemplateRow(h, ctx.bundle)));
}

/** Runs the hires through the starter checks, keeping each HR id. Rows come back in `hires` order. */
export function stageHandover(hires: HrHire[], ctx: ImportCtx): StagedRow[] {
  if (!hires.length) return [];
  const templateCtx: TemplateCtx = { elements: ctx.elements, settings: ctx.settings, bundle: ctx.bundle as TemplateCtx["bundle"] };
  // Round-trip through a real workbook so the checks are byte-for-byte the upload's.
  const wb = XLSX.read(XLSX.write(handoverWorkbook(templateCtx, hires), { type: "array", bookType: "xlsx" }), { type: "array", cellDates: true });
  return parseStarterWorkbook(wb, { ...ctx, ids: hires.map((h) => h.id), hrHires: [] }).rows;
}

const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Joiners check for a regular run: every HR hire who should be paid in this
 * month is either in the run or flagged with the reason.
 *   - onboarded, started by the period end, not on payroll  → error (they'd go unpaid)
 *   - onboarded and on payroll but left out of this run     → warning
 *   - still onboarding, starting inside this month           → warning
 */
export function joinerExceptions(run: Pick<PayrollRun, "type" | "period" | "employees">, hires: HrHire[], payrollIds: Set<string>): Omit<PayrollException, "acknowledged">[] {
  if (run.type !== "regular" || !hires.length) return [];
  const { start, end, label } = run.period;
  const inRun = new Set(run.employees.filter((e) => e.included).map((e) => e.employeeId));
  const out: Omit<PayrollException, "acknowledged">[] = [];
  for (const h of hires) {
    const sd = h.row.startDate;
    if (!sd || sd > end || inRun.has(h.id)) continue;
    const name = h.row.name;
    if (h.status === "onboarded" && !payrollIds.has(h.id)) {
      out.push({
        id: `joiner:${h.id}:${run.period.year}-${run.period.month}`,
        rule: "joiner_not_in_payroll",
        severity: "error",
        employeeId: h.id,
        message: `${name} cleared onboarding (started ${fmt(sd)}) but isn't set up in payroll, so won't be paid for ${label}. Set them up from Import starters → From onboarding${sd < start ? " — back pay from their start date will be due" : ""}.`,
      });
    } else if (h.status === "onboarded") {
      out.push({
        id: `joiner-out:${h.id}:${run.period.year}-${run.period.month}`,
        rule: "joiner_not_in_payroll",
        severity: "warning",
        employeeId: h.id,
        message: `${name} joined on ${fmt(sd)} and is set up in payroll but isn't in this run. Add them, or acknowledge why they're paid later.`,
      });
    } else if (sd >= start) {
      out.push({
        id: `joiner-onb:${h.id}:${run.period.year}-${run.period.month}`,
        rule: "joiner_still_onboarding",
        severity: "warning",
        employeeId: h.id,
        message: `${name} starts on ${fmt(sd)} but is still in onboarding${payrollIds.has(h.id) ? "" : " and isn't set up in payroll yet"}. Set them up now so ${label} pay isn't missed, or acknowledge that they're paid next month.`,
      });
    }
  }
  return out;
}
