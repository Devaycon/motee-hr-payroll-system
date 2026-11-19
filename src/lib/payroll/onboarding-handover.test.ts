import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { EmployeeRow } from "@/src/lib/types/employees";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { calculateRun, newRun, nubanCheckDigit, seedHistory, seedProfile, seedStructure, type TenantPayrollData } from "./run-builder";
import { withValidation } from "./use-payroll";
import { STARTER_SAMPLE_ROWS } from "./starter-import-sample";
import { buildStarterWorkbook, parseStarterWorkbook, toBatch, withImportedStaff, type ImportCtx } from "./starter-import";
import { handoverQueue, handoverWorkbook, hireRefs, hrHiresFrom, joinerExceptions, stageHandover, type HrHire } from "./onboarding-handover";

/**
 * HR onboarding → payroll: hires cleared from onboarding are set up in payroll
 * from what onboarding collected, through the same checks as the starter
 * upload, under the HR record's own id; the run's joiners check flags anyone
 * due pay who isn't in it.
 */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const base = {
  elements: SEED_PAY_ELEMENTS,
  rateSets: NG_RATE_SETS,
  settings,
  structures: bundle.employees.map((e) => seedStructure(e, settings)),
  profiles: bundle.employees.map(seedProfile),
};
const today = new Date("2026-11-18T12:00:00Z");
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today });
const nov = history.runs.find((r) => r.period.month === 11)!;
const data: TenantPayrollData = { ...base, ...history };
const ctx: ImportCtx = { bundle, elements: base.elements, settings, rateSets: base.rateSets, structures: base.structures, period: nov.period, year: 2026, importedBy: "Chinedu Lawal", batchId: "" };

const nuban = (bankCode: string, first9: string) => first9 + nubanCheckDigit(bankCode, first9);

/** A hire who cleared onboarding with everything payroll needs. */
const ready: EmployeeRow = {
  id: "emp-onb-bulk-1",
  referenceId: "NG3001",
  name: "Halima Bello",
  initials: "HB",
  email: "halima.bello@sahelfintech.ng",
  phone: "+234 803 111 2222",
  department: "Engineering",
  jobTitle: "Backend Engineer",
  employmentType: "full_time",
  status: "onboarded",
  startDate: "2026-11-02",
  salary: 0,
  managerId: null,
  managerName: null,
  state: "Lagos",
  taxId: "23456789-0001",
  pfaName: "Stanbic IBTC Pension Managers",
  pensionId: "PEN100200300400",
  bankName: "GTBank",
  bankAccountNumber: nuban("058", "012345678"),
  bankAccountName: "Halima Bello",
  bvn: "22123456789",
  payBreakdown: { basic: 300_000, housing: 150_000, transport: 60_000 },
};
/** Cleared onboarding with only an annual salary and no bank yet. */
const gaps: EmployeeRow = { ...ready, id: "emp-onb-bulk-2", referenceId: undefined, name: "Tunde Bakare", email: "tunde.bakare@sahelfintech.ng", payBreakdown: undefined, salary: 7_200_000, bankName: undefined, bankAccountNumber: undefined, bankAccountName: undefined };
/** An intern — onboarding says "Internship", the company calls it "Intern". */
const intern: EmployeeRow = { ...ready, id: "emp-onb-bulk-3", referenceId: undefined, name: "Ifeoma Nnaji", email: "ifeoma.nnaji@sahelfintech.ng", employmentType: "internship", payBreakdown: { basic: 120_000 }, bankAccountNumber: nuban("058", "098765432") };

const record = (id: string, name: string, startDate: string): OnboardingRecord =>
  ({ id, employeeName: name, employeeInitials: "XX", email: `${id}@sahelfintech.ng`, jobTitle: "Analyst", department: "Engineering", startDate, stage: "pre_boarding", status: "in_progress", tasks: [], completedTasks: 0, totalTasks: 0, welcomeEmailSent: true, initiatedAt: "2026-10-01", mode: "bulk" }) as OnboardingRecord;

const hires = hrHiresFrom([record("onb-nov", "Yusuf Danjuma", "2026-11-23"), record("onb-apr", "Old Record", "2026-04-10")], [ready, gaps, intern]);
const byId = (id: string) => hires.find((h) => h.id === id)!;

describe("who payroll still has to set up", () => {
  it("lists cleared hires and hires still onboarding who start this pay month or later", () => {
    expect(hires.map((h) => [h.id, h.status])).toEqual([
      ["emp-onb-bulk-1", "onboarded"],
      ["emp-onb-bulk-2", "onboarded"],
      ["emp-onb-bulk-3", "onboarded"],
      ["emp-onb-nov", "onboarding"],
      ["emp-onb-apr", "onboarding"],
    ]);
    const queue = handoverQueue(hires, new Set(bundle.employees.map((e) => e.id)), nov.period);
    expect(queue.map((h) => h.id)).toEqual(["emp-onb-bulk-1", "emp-onb-bulk-2", "emp-onb-bulk-3", "emp-onb-nov"]);
    // Once set up, a hire drops off the queue.
    expect(handoverQueue(hires, new Set(["emp-onb-bulk-1"]), nov.period).map((h) => h.id)).not.toContain("emp-onb-bulk-1");
  });
});

describe("onboarding details run through the starter checks", () => {
  const staged = stageHandover([byId("emp-onb-bulk-1"), byId("emp-onb-bulk-2"), byId("emp-onb-bulk-3")], ctx);

  it("keeps the HR id and builds the structure, tax, pension and bank profile", () => {
    const [h] = staged;
    expect(h.errors).toEqual([]);
    expect(h.record!.employee.id).toBe("emp-onb-bulk-1");
    expect(h.record!.employee.employeeNumber).toBe("NG3001");
    expect(h.record!.structure.lines).toEqual([
      { code: "BASIC", amount: 300_000 },
      { code: "HOUSING", amount: 150_000 },
      { code: "TRANSPORT", amount: 60_000 },
    ]);
    expect(h.record!.profile).toMatchObject({ stateOfResidence: "Lagos", tin: "23456789-0001", pfaName: "Stanbic IBTC Pension Managers", rsaPin: "PEN100200300400", bankCode: "058", accountNumber: ready.bankAccountNumber });
  });

  it("says exactly what onboarding didn't collect", () => {
    const [, t] = staged;
    expect(t.record).toBeNull();
    expect(t.errors.map((e) => e.column)).toEqual(["Bank", "Account number"]);
  });

  it("maps onboarding's employment type to the company's own", () => {
    expect(staged[2].record!.employee.employmentTypeId).toBe("ET-IN");
  });

  it("pre-fills the template so payroll only has to complete the gaps", () => {
    const wb = handoverWorkbook({ elements: base.elements, settings, bundle }, [byId("emp-onb-bulk-2")]);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets.Employees, { range: 1 });
    expect(rows[0]).toMatchObject({ "First name *": "Tunde", "Surname *": "Bakare", "Annual gross salary": 7_200_000, "State of residence *": "Lagos" });
    expect(rows[0]["Bank *"] ?? "").toBe("");
  });
});

describe("joiners check on the pay run", () => {
  const payrollIds = new Set(bundle.employees.map((e) => e.id));

  it("blocks a run that leaves out an onboarded joiner, and warns about one still onboarding", () => {
    const ex = joinerExceptions(nov, hires, payrollIds);
    expect(ex.filter((e) => e.severity === "error").map((e) => e.employeeId)).toEqual(["emp-onb-bulk-1", "emp-onb-bulk-2", "emp-onb-bulk-3"]);
    expect(ex.filter((e) => e.severity === "warning").map((e) => e.employeeId)).toEqual(["emp-onb-nov"]);
    // The April hire started months ago and is a stale onboarding record, not this month's joiner.
    expect(ex.some((e) => e.employeeId === "emp-onb-apr")).toBe(false);
    expect(ex[0].message).toContain("isn't set up in payroll");
  });

  it("clears once the hires are set up and added to the run", () => {
    const staged = stageHandover([byId("emp-onb-bulk-1"), byId("emp-onb-bulk-3")], ctx);
    const { batch, structures, profiles } = toBatch(staged, { id: "IMP-ONB", fileName: "Onboarding hand-over", importedBy: "Chinedu Lawal" });
    const d: TenantPayrollData = { ...data, structures: [...data.structures, ...structures], profiles: [...data.profiles, ...profiles] };
    const merged = withImportedStaff(bundle, [batch]);
    const fresh = newRun({ tenantId: bundle.tenant.id, type: "regular", period: nov.period, preparedBy: nov.preparedBy, bundle: merged, data: d, loans: [], today, id: nov.id });
    const run = withValidation(calculateRun(fresh, d, merged), d, merged, hires);
    const halima = run.employees.find((e) => e.employeeId === "emp-onb-bulk-1")!;
    // Joined Mon 2 Nov: 29 of 30 days of ₦510,000.
    expect(halima.computation!.gross).toBe(493_000);
    const joiners = run.exceptions.filter((e) => e.rule === "joiner_not_in_payroll" || e.rule === "joiner_still_onboarding").map((e) => e.employeeId);
    expect(joiners).toEqual(["emp-onb-bulk-2", "emp-onb-nov"]);
  });
});

describe("matching the two uploads", () => {
  const sampleBook = XLSX.read(XLSX.write(buildStarterWorkbook({ elements: base.elements, settings, bundle }, STARTER_SAMPLE_ROWS), { type: "buffer", bookType: "xlsx" }), { type: "buffer", cellDates: true });
  const first = STARTER_SAMPLE_ROWS[0];
  const twin: HrHire = { id: "emp-onb-twin", status: "onboarding", row: { ...ready, id: "emp-onb-twin", name: `${first.firstName} ${first.lastName}`, email: String(first.email), referenceId: undefined } };

  it("links a payroll upload row to the same person in onboarding instead of adding them twice", () => {
    const res = parseStarterWorkbook(sampleBook, { ...ctx, hrHires: hireRefs([twin]) });
    const row = res.rows[0];
    expect(row.record!.employee.id).toBe("emp-onb-twin");
    expect(row.warnings.map((w) => w.message).join(" ")).toContain("linked to that record, not added twice");
    // Everyone else keeps a payroll-only id.
    expect(res.rows[1].record!.employee.id.startsWith("IMP-")).toBe(true);
  });

  it("rejects a hire already set up in payroll", () => {
    const staged = stageHandover([byId("emp-onb-bulk-1")], ctx);
    const { batch } = toBatch(staged, { id: "IMP-ONB", fileName: "x", importedBy: "x" });
    const again = stageHandover([byId("emp-onb-bulk-1")], { ...ctx, bundle: withImportedStaff(bundle, [batch]) });
    expect(again[0].record).toBeNull();
    expect(again[0].errors.map((e) => e.message).join(" ")).toMatch(/already/i);
  });
});
