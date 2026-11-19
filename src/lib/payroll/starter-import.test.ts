import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { repaymentSchedule } from "@/src/lib/loans/loans";
import { leaveAllowanceOf } from "./ng/rate-sets";
import { buildPayslips, calculateRun, leaveAllowanceFor, newRun, seedHistory, seedProfile, seedStructure, type TenantPayrollData } from "./run-builder";
import { buildBreakdown } from "./breakdowns";
import { buildExport, remittanceAmounts } from "./exports";
import { REMITTANCE_ITEMS, remittanceStatement } from "./remittances";
import { withValidation } from "./use-payroll";
import { STARTER_SAMPLE_ROWS } from "./starter-import-sample";
import {
  EMPLOYEES_SHEET,
  buildStarterWorkbook,
  parseDate,
  parseStarterWorkbook,
  reconcileBatch,
  starterColumns,
  templateHeader,
  toBatch,
  withImportedStaff,
  type ImportCtx,
} from "./starter-import";

/**
 * End-to-end payroll simulation for client onboarding: fill the New Starter
 * template with a 24-person team, upload it, add them to November's run,
 * calculate, reconcile against the figures an independent calculator
 * produced, finalize, and check every report the client relies on.
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

const roundTrip = (wb: XLSX.WorkBook) => XLSX.read(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }), { type: "buffer", cellDates: true });
const ctx: ImportCtx = {
  bundle,
  elements: base.elements,
  settings,
  rateSets: base.rateSets,
  structures: base.structures,
  period: nov.period,
  year: 2026,
  importedBy: "Chinedu Lawal",
  batchId: "IMP-TEST",
};
const template = { elements: base.elements, settings, bundle, companyName: bundle.tenant.name };
const sampleBook = roundTrip(buildStarterWorkbook(template, STARTER_SAMPLE_ROWS));
const parsed = parseStarterWorkbook(sampleBook, ctx);

// Apply the import the way the slice does, then add the starters to November.
const { batch, structures, profiles, openingYtd } = toBatch(parsed.rows, { id: "IMP-TEST", fileName: "sample.xlsx", importedBy: "Chinedu Lawal", runId: nov.id });
const data: TenantPayrollData = {
  ...base,
  ...history,
  structures: [...base.structures, ...structures],
  profiles: [...base.profiles, ...profiles],
  openingYtd: { ...history.openingYtd, ...openingYtd },
};
const merged = withImportedStaff(bundle, [batch]);
const ids = new Set(batch.employees.map((e) => e.id));
const fresh = newRun({ tenantId: bundle.tenant.id, type: "regular", period: nov.period, preparedBy: nov.preparedBy, bundle: merged, data, loans: merged.loans ?? [], today, id: nov.id });
const withStarters = {
  ...nov,
  employees: [...nov.employees, ...fresh.employees.filter((e) => ids.has(e.employeeId))],
  inputs: [...nov.inputs, ...fresh.inputs.filter((i) => ids.has(i.employeeId))],
};
const run = withValidation(calculateRun(withStarters, data, merged), data, merged);
const recon = reconcileBatch(batch, run, data.openingYtd);
const starter = (email: string) => batch.employees.find((e) => e.email === email)!;
const comp = (email: string) => run.employees.find((e) => e.employeeId === starter(email).id)!.computation!;
const line = (email: string, code: string) => comp(email).lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);

describe("the template", () => {
  it("has every sheet a client needs and marks required columns", () => {
    const wb = buildStarterWorkbook(template);
    expect(wb.SheetNames).toEqual(["Read me", EMPLOYEES_SHEET, "Column guide", "Valid values", "Pay elements"]);
    const header = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[EMPLOYEES_SHEET], { header: 1 })[1];
    expect(header).toContain("First name *");
    expect(header).toContain("Account number *");
    expect(header).toContain("PAYE YTD");
    expect(header).toContain("Expected net pay");
    expect(header.length).toBe(starterColumns(base.elements).length);
  });

  it("a blank template parses with no rows and no errors", () => {
    const r = parseStarterWorkbook(roundTrip(buildStarterWorkbook(template)), ctx);
    expect(r.fileErrors).toEqual([]);
    expect(r.rows).toEqual([]);
  });

  it("reads Nigerian dates, Excel dates and serials", () => {
    expect(parseDate("01/11/2026")).toBe("2026-11-01");
    expect(parseDate("2026-11-16")).toBe("2026-11-16");
    expect(parseDate("16 Nov 2026")).toBe("2026-11-16");
    expect(parseDate(46327)).toBe("2026-11-01");
    expect(parseDate("31/02/2026")).toBeNull();
  });
});

describe("uploading the sample (24 employees)", () => {
  it("imports every row with no errors", () => {
    expect(parsed.fileErrors).toEqual([]);
    expect(parsed.unknownColumns).toEqual([]);
    expect(parsed.rows).toHaveLength(24);
    expect(parsed.rows.filter((r) => r.errors.length).map((r) => [r.row, r.errors])).toEqual([]);
    expect(batch.employees).toHaveLength(24);
  });

  it("only warns about things HR should know", () => {
    const warnings = parsed.rows.flatMap((r) => r.warnings.map((w) => `${r.name}: ${w.message}`));
    expect(warnings.some((w) => /Field Operations.*new department/.test(w))).toBe(true);
    expect(warnings.some((w) => /Precious Etim: Joins mid-month/.test(w))).toBe(true);
    expect(warnings.some((w) => /Oluwaseun Adeyemi: Rent relief waits/.test(w))).toBe(true);
    expect(warnings.some((w) => /no year-to-date/.test(w))).toBe(false);
  });

  it("builds the salary structure from the annual gross when there's no breakdown", () => {
    const s = structures.find((x) => x.employeeId === starter("aisha.bello@sahelfintech.ng").id)!;
    expect(s.lines.reduce((t, l) => t + l.amount, 0)).toBeCloseTo(600_000, 2);
    expect(s.lines.find((l) => l.code === "BASIC")?.amount).toBe(300_000);
  });

  it("brings the year to date forward with the reliefs already given", () => {
    const y = openingYtd[starter("adaeze.okafor@sahelfintech.ng").id];
    expect(y.months).toBe(10);
    expect(y.reliefs["Rent relief (20% of rent, max ₦500k)"]).toBeCloseTo((500_000 * 10) / 12, 2);
    expect(y.chargeable).toBeLessThan(y.taxableGross);
  });
});

describe("November payroll with the new starters", () => {
  it("pays all 24 (pro-rating the mid-month joiner)", () => {
    const paid = run.employees.filter((e) => ids.has(e.employeeId) && e.included && e.computation);
    expect(paid).toHaveLength(24);
    expect(comp("precious.etim@sahelfintech.ng").prorationFactor).toBeCloseTo(15 / 30, 5);
  });

  it("reconciles to the kobo with the independent calculator", () => {
    const byStatus = (s: string) => recon.filter((r) => r.status === s).map((r) => r.name);
    expect(byStatus("not_in_run")).toEqual([]);
    expect(byStatus("no_expected")).toEqual(["Precious Etim"]);
    // First job this year: cumulative PAYE spreads the tax-free band over 11 months.
    expect(byStatus("variance").sort()).toEqual(["Chidera Okeke", "Musa Garba"]);
    expect(byStatus("match")).toHaveLength(21);
    for (const r of recon.filter((x) => x.status === "variance")) {
      expect(r.figures.gross.diff).toBe(0);
      expect(r.figures.pensionEmployee.diff).toBe(0);
      expect(r.figures.paye.diff!).toBeLessThan(0);
      expect(r.explained).toBe(true);
      expect(r.explanations.join(" ")).toMatch(/cumulative PAYE taxes what is actually earned/);
    }
  });

  it("deducts voluntary pension, recurring deductions and WHT", () => {
    expect(line("adaeze.okafor@sahelfintech.ng", "VOL_PENSION")).toBeCloseTo(0.05 * 1_020_000, 2);
    expect(line("segun.olatunji@sahelfintech.ng", "VOL_PENSION")).toBe(250_000);
    expect(line("oluwaseun.adeyemi@sahelfintech.ng", "STAFF_LOAN")).toBe(45_000);
    expect(line("adaeze.okafor@sahelfintech.ng", "COOP_CONTRIB")).toBe(30_000);
    expect(line("chioma.nwosu@sahelfintech.ng", "UNION_DUES")).toBe(2_500);
    expect(line("kunle.afolabi@sahelfintech.ng", "WHT")).toBe(20_000);
    expect(line("kunle.afolabi@sahelfintech.ng", "PAYE")).toBe(0);
    expect(line("tobi.akinola@sahelfintech.ng", "PENSION_EE")).toBe(0);
    expect(line("tobi.akinola@sahelfintech.ng", "NHF")).toBe(0);
  });

  it("raises no blocking exceptions for the starters", () => {
    const blocking = run.exceptions.filter((x) => x.severity === "error" && x.employeeId && ids.has(x.employeeId));
    expect(blocking.map((x) => `${x.employeeId}: ${x.message}`)).toEqual([]);
  });
});

describe("reports for the new starters", () => {
  const people = new Map(merged.employees.map((e) => [e.id, e]));
  const profileMap = new Map(data.profiles.map((p) => [p.employeeId, p]));
  const bctx = { people, profiles: profileMap };

  it("net pay drill-down and bank file carry their bank details", () => {
    const net = buildBreakdown("net", run, bctx);
    const zainab = net.rows.find((r) => r.employeeId === starter("zainab.lawal@sahelfintech.ng").id)!;
    expect(zainab.cells.bank).toBe("UBA");
    expect(String(zainab.cells.account)).toMatch(/^•{6}\d{4}$/);
    const nibss = buildExport("nibss", { run, people, profiles: profileMap, settings });
    expect(nibss.excluded ?? []).toEqual([]);
    expect(nibss.data.length).toBe(run.employees.filter((e) => e.included && e.computation && e.computation.net > 0).length);
  });

  it("PAYE goes to each starter's State IRS and pension to their PFA", () => {
    const paye = buildBreakdown("paye", run, bctx);
    expect(paye.rows.find((r) => r.employeeId === starter("tamuno.briggs@sahelfintech.ng").id)?.cells.state).toBe("Rivers");
    const pension = buildBreakdown("pension", run, bctx);
    expect(pension.rows.find((r) => r.employeeId === starter("yusuf.danjuma@sahelfintech.ng").id)?.group).toBe("NLPC Pension Fund Administrators");
  });

  it("finalizes into payslips whose YTD continues the previous payroll", () => {
    const finalized = { ...run, status: "finalized" as const };
    const slips = buildPayslips({ run: finalized, bundle: merged, data, status: "final", approvedBy: "Test", generatedAt: "2026-11-20T10:00:00Z" });
    const s = slips.find((p) => p.employeeId === starter("emeka.obi@sahelfintech.ng").id)!;
    const y = openingYtd[s.employeeId];
    expect(s.computation.ytd.gross).toBeCloseTo(y.gross + s.computation.gross, 2);
    expect(s.computation.ytd.paye).toBeCloseTo(y.paye + line("emeka.obi@sahelfintech.ng", "PAYE"), 2);
  });

  it("remittance statements cover the starters and agree with the totals", () => {
    const finalized = { ...run, status: "finalized" as const };
    const amounts = remittanceAmounts([finalized]);
    for (const item of REMITTANCE_ITEMS) {
      const st = remittanceStatement(item, [finalized], { people, profiles: profileMap, settings })!;
      expect(Math.round(st.groups.reduce((t, g) => t + g.amount, 0) * 100) / 100).toBe(amounts[item]);
    }
    const avc = remittanceStatement("avc", [finalized], { people, profiles: profileMap, settings })!;
    expect(avc.contributors).toBeGreaterThanOrEqual(4);
  });
});

describe("validation catches common onboarding mistakes", () => {
  const broken = STARTER_SAMPLE_ROWS.slice(0, 6).map((r) => ({ ...r }));
  broken[0].accountNumber = "1082120035"; // check digit wrong
  broken[1].state = "Lagoss";
  broken[2].email = broken[3].email; // duplicate
  broken[4].employmentType = "Permanent staff";
  broken[5]["pay:BASIC"] = "";
  broken[5]["pay:HOUSING"] = 100000;
  const r = parseStarterWorkbook(roundTrip(buildStarterWorkbook(template, broken)), ctx);
  const errs = (i: number) => r.rows[i].errors.map((e) => `${e.column}: ${e.message}`).join(" | ");

  it("blocks the bad rows with a reason in plain English", () => {
    expect(errs(0)).toMatch(/Account number: .*fails the NUBAN check/);
    expect(errs(1)).toMatch(/State of residence: .*isn't a Nigerian state/);
    expect(errs(3)).toMatch(/Work email: Also used on row/);
    expect(errs(4)).toMatch(/Employment type: .*isn't an employment type/);
    expect(errs(5)).toMatch(/Basic salary is required/);
    expect(r.rows[2].errors).toEqual([]);
  });

  it("warns when long-serving staff come without year-to-date", () => {
    const noYtd = [{ ...STARTER_SAMPLE_ROWS[1], ytdMonth: "", ytdGross: "", ytdTaxable: "", ytdPaye: "", ytdPensionEe: "", ytdPensionEr: "", ytdNhf: "", ytdAvc: "", ytdNet: "" }];
    const w = parseStarterWorkbook(roundTrip(buildStarterWorkbook(template, noYtd)), ctx).rows[0].warnings.map((x) => x.message).join(" ");
    expect(w).toMatch(/cumulative PAYE will treat November 2026 as the first pay/);
  });

  it("refuses a file that isn't the template", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Name", "Salary"], ["A", 1]]), "Sheet1");
    expect(parseStarterWorkbook(wb, ctx).fileErrors[0]).toMatch(/No Employees sheet/);
  });

  it("required headers carry an asterisk in the template", () => {
    const first = starterColumns(base.elements).find((c) => c.key === "firstName")!;
    expect(templateHeader(first)).toBe("First name *");
  });
});

describe("loans brought forward", () => {
  const id = () => starter("oluwaseun.adeyemi@sahelfintech.ng").id;
  it("become a payroll loan with the outstanding balance and fixed instalment", () => {
    const loan = batch.loans!.find((l) => l.employeeId === id())!;
    expect(loan).toMatchObject({ amount: 405_000, fixedInstalment: 45_000, repaymentMonths: 9, loanType: "staff_loan", status: "active" });
  });

  it("show the balance left on the payslip line", () => {
    const l = comp("oluwaseun.adeyemi@sahelfintech.ng").lines.find((x) => x.code === "STAFF_LOAN")!;
    expect(l.amount).toBe(45_000);
    expect(l.source).toBe("loan");
    expect(l.note ?? "").toMatch(/instalment 1 of 9 · ₦360,000 left/);
  });

  it("take only what's left in the last month", () => {
    const loan = { ...batch.loans![0], amount: 100_000, fixedInstalment: 45_000, repaymentMonths: 3 };
    expect(repaymentSchedule(loan, today).map((i) => i.amount)).toEqual([45_000, 45_000, 10_000]);
  });

  it("need both a balance and a repayment", () => {
    const rows = [{ ...STARTER_SAMPLE_ROWS[0], loanBalance: 200_000, loanRepayment: "" }, { ...STARTER_SAMPLE_ROWS[1], loanBalance: "", loanRepayment: 20_000 }];
    const r = parseStarterWorkbook(roundTrip(buildStarterWorkbook(template, rows)), ctx);
    expect(r.rows[0].errors[0].message).toMatch(/monthly repayment/);
    expect(r.rows[1].errors[0].message).toMatch(/outstanding balance/);
  });
});

describe("leave allowance policy", () => {
  const lines = [
    { code: "BASIC", amount: 300_000 },
    { code: "HOUSING", amount: 150_000 },
    { code: "TRANSPORT", amount: 50_000 },
    { code: "UTILITY", amount: 100_000 },
  ];
  const dec = { year: 2026, month: 12, start: "2026-12-01", end: "2026-12-31" };
  const with_ = (leaveAllowance: Partial<typeof settings.leaveAllowance>) => ({ ...settings, leaveAllowance: { ...leaveAllowanceOf(settings), ...leaveAllowance } });

  it("defaults to 10% of annual basic in the anniversary month, from the first anniversary", () => {
    expect(leaveAllowanceFor({ startDate: "2020-12-07", period: dec, settings, lines })?.amount).toBe(360_000);
    expect(leaveAllowanceFor({ startDate: "2026-12-07", period: dec, settings, lines })).toBeNull();
    expect(leaveAllowanceFor({ startDate: "2020-06-07", period: dec, settings, lines })).toBeNull();
  });

  it("can pay everyone in one month, pro-rated in the joining year, on another basis", () => {
    const s = with_({ mode: "month", month: 12, ratePct: 15, basis: "bht", prorateFirstYear: true });
    expect(leaveAllowanceFor({ startDate: "2020-06-07", period: dec, settings: s, lines })?.amount).toBe(900_000);
    const joiner = leaveAllowanceFor({ startDate: "2026-10-01", period: dec, settings: s, lines })!;
    expect(joiner.amount).toBe(225_000);
    expect(joiner.description).toMatch(/pro-rated 3\/12/);
    expect(leaveAllowanceFor({ startDate: "2020-06-07", period: { ...dec, month: 11 }, settings: s, lines })).toBeNull();
    expect(leaveAllowanceFor({ startDate: "2020-06-07", period: dec, settings: with_({ mode: "month", month: 12, basis: "gross" }), lines })?.amount).toBe(720_000);
  });

  it("can be switched off", () => {
    expect(leaveAllowanceFor({ startDate: "2020-12-07", period: dec, settings: with_({ mode: "none" }), lines })).toBeNull();
  });

  it("isn't paid again when the previous payroll already paid it this year", () => {
    // Gbenga joined in November 2025: November is his anniversary month, but the template says it was paid.
    expect(line("gbenga.fashola@sahelfintech.ng", "LEAVE_ALLOW")).toBe(0);
    expect(profiles.find((p) => p.employeeId === starter("gbenga.fashola@sahelfintech.ng").id)?.leaveAllowancePaidYear).toBe(2026);
    expect(recon.find((r) => r.name === "Gbenga Fashola")?.status).toBe("match");
  });

  it("warns at upload when it falls due in the first MOTEE month", () => {
    const row = { ...STARTER_SAMPLE_ROWS.find((r) => r.firstName === "Gbenga")!, leaveAllowancePaid: "" };
    const w = parseStarterWorkbook(roundTrip(buildStarterWorkbook(template, [row])), ctx).rows[0].warnings.map((x) => x.message).join(" ");
    expect(w).toMatch(/Leave allowance of ₦336,000 is due in November 2026/);
  });
});

describe("loan repayments carry into the next month", () => {
  it("records November's repayment on the imported loan, so December takes instalment 2", async () => {
    const { default: reducer, seedTenantPayroll, importStarters, recordImportedLoanRepayment } = await import("@/src/lib/stores/payroll-slice");
    const tenantId = bundle.tenant.id;
    let state = reducer(undefined, seedTenantPayroll({ tenantId, data: { ...data, runs: history.runs, audit: [], remittances: {} } }));
    state = reducer(state, importStarters({ tenantId, actor: "Test", batch, structures: [], profiles: [], openingYtd: {} }));
    const loanId = batch.loans![0].id;
    state = reducer(state, recordImportedLoanRepayment({ tenantId, loanId, amountRepaid: 45_000 }));
    const saved = state.byTenant[tenantId].imports![0];
    expect(saved.loans![0].amountRepaid).toBe(45_000);

    const decPeriod = { ...nov.period, month: 12, label: "December 2026", start: "2026-12-01", end: "2026-12-31", payDate: "2026-12-24" };
    const mergedAfter = withImportedStaff(bundle, [saved]);
    const dec = newRun({ tenantId, type: "regular", period: decPeriod, preparedBy: nov.preparedBy, bundle: mergedAfter, data, loans: mergedAfter.loans ?? [], today: new Date("2026-12-10T12:00:00Z") });
    const input = dec.inputs.find((i) => i.refId === loanId)!;
    expect(input.amount).toBe(45_000);
    expect(input.description).toMatch(/instalment 2 of 9 · ₦315,000 left/);
  });
});
