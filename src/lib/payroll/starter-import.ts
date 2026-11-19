import * as XLSX from "xlsx";
import type { LocaleBundle, LocaleEmployee, LocaleLoan } from "@/src/lib/types/locale";
import { RELIEF, emptyYtd, round2, splitSalary } from "./ng/engine";
import { NG_BANKS, NG_PFAS, NG_STATES, matchBank, matchPfa, matchState } from "./ng/reference";
import { leaveAllowanceOf, resolveRateSet, ruleFor } from "./ng/rate-sets";
import { isValidNuban, leaveAllowanceFor } from "./run-builder";
import type { EmployeeTaxProfile, PayElement, PayPeriod, PayrollRun, PayrollSettings, SalaryLine, SalaryStructure, StatutoryRateSet, YtdTotals } from "./types";

/**
 * New-starter bulk import: one spreadsheet row per employee carrying
 * everything payroll needs (personal and employment details, the salary
 * structure, tax, pension, NHF and bank details, recurring deductions, the
 * year-to-date brought forward from the previous payroll and, optionally,
 * the figures the previous payroll paid so the first MOTEE run can be
 * reconciled against them).
 *
 * The column dictionary below is the single source for the template, the
 * parser, the validation and the column guide, so they can't drift apart.
 * Everything here is pure; the screen and the slice only move the results.
 */

// ── Column dictionary ───────────────────────────────────────────────────────

export type ColKind = "text" | "money" | "date" | "yesno" | "number" | "list";

export interface StarterColumn {
  key: string;
  header: string;
  section: string;
  /** true = always; "conditional" = see the help text. */
  required?: true | "conditional";
  kind: ColKind;
  help: string;
  example: string | number;
  aliases?: string[];
}

/** Recurring earnings with their own column. Any other earning element can be added by its code. */
export const STARTER_PAY_CODES = [
  "BASIC",
  "HOUSING",
  "TRANSPORT",
  "UTILITY",
  "MEAL",
  "COMMUNICATION",
  "MEDICAL",
  "ENTERTAINMENT",
  "EDUCATION",
  "DOMESTIC",
  "FURNITURE",
  "CLOTHING",
  "RESPONSIBILITY",
  "LOCATION",
  "HAZARD",
  "CAR",
  "FUEL",
  "OTHER_ALLOW",
] as const;

/** Recurring deductions with their own column. */
export const STARTER_DEDUCTION_CODES = ["UNION_DUES", "COOP_CONTRIB", "WELFARE", "SAVINGS", "OTHER_DED"] as const;

/** Loans brought forward: template label -> Loans-module loan type (and so the payroll element). */
export const STARTER_LOAN_TYPES: Record<string, string> = {
  "Staff loan": "staff_loan",
  "Salary advance": "salary_advance",
  "Cooperative loan": "cooperative_loan",
  "Emergency loan": "emergency_loan",
};
const LOAN_CODES = new Set(["STAFF_LOAN", "SALARY_ADVANCE", "COOP_LOAN", "EMERGENCY_LOAN"]);

const DEDUCTION_LABELS: Record<(typeof STARTER_DEDUCTION_CODES)[number], string> = {
  UNION_DUES: "Union dues",
  COOP_CONTRIB: "Cooperative contribution",
  WELFARE: "Staff welfare",
  SAVINGS: "Savings scheme",
  OTHER_DED: "Other deduction",
};

const PAY_EXAMPLES: Record<string, number> = { BASIC: 250_000, HOUSING: 125_000, TRANSPORT: 50_000, UTILITY: 25_000, MEAL: 25_000, COMMUNICATION: 25_000 };

export function starterColumns(elements: PayElement[]): StarterColumn[] {
  const el = new Map(elements.map((e) => [e.code, e]));
  const pay: StarterColumn[] = STARTER_PAY_CODES.map((code) => {
    const e = el.get(code);
    const name = e?.name ?? code;
    return {
      key: `pay:${code}`,
      header: `${name} (monthly)`,
      section: code === "BASIC" || code === "HOUSING" || code === "TRANSPORT" ? "Salary — monthly" : "Allowances — monthly",
      required: code === "BASIC" ? "conditional" : undefined,
      kind: "money",
      help:
        code === "BASIC"
          ? "Monthly basic salary. Required unless Annual gross salary is given instead. Basic, housing and transport are pensionable."
          : `${name} paid every month${e?.pensionable ? " (pensionable)" : ""}${e && !e.taxable ? " (not taxable)" : ""}.`,
      example: PAY_EXAMPLES[code] ?? "",
      aliases: [code, name, `${name} monthly`],
    };
  });
  const ded: StarterColumn[] = STARTER_DEDUCTION_CODES.map((code) => ({
    key: `ded:${code}`,
    header: `${DEDUCTION_LABELS[code]} (monthly)`,
    section: "Recurring deductions — monthly",
    kind: "money",
    help:
      code === "OTHER_DED"
          ? "Any other monthly deduction after tax. Describe it in Other deduction description."
          : `${DEDUCTION_LABELS[code]} deducted after tax every month.`,
    example: code === "UNION_DUES" ? 2_500 : code === "COOP_CONTRIB" ? 20_000 : "",
    aliases: [code, DEDUCTION_LABELS[code], el.get(code)?.name ?? code],
  }));

  return [
    // Personal
    { key: "employeeNumber", header: "Employee ID", section: "Personal", kind: "text", help: "Your staff number. Leave blank and MOTEE numbers new starters for you. Must be unique.", example: "NG2001", aliases: ["staff id", "staff number", "employee number", "employee no"] },
    { key: "firstName", header: "First name", section: "Personal", required: true, kind: "text", help: "Given name as on the bank account.", example: "Adaeze" },
    { key: "otherNames", header: "Middle name", section: "Personal", kind: "text", help: "Other names, if any.", example: "Chiamaka", aliases: ["other names", "middle names"] },
    { key: "lastName", header: "Surname", section: "Personal", required: true, kind: "text", help: "Family name.", example: "Okafor", aliases: ["last name", "family name"] },
    { key: "gender", header: "Gender", section: "Personal", kind: "list", help: "Female or Male.", example: "Female" },
    { key: "dateOfBirth", header: "Date of birth", section: "Personal", kind: "date", help: "DD/MM/YYYY or YYYY-MM-DD.", example: "14/03/1994", aliases: ["dob"] },
    { key: "email", header: "Work email", section: "Personal", required: true, kind: "text", help: "Used for payslips and the self-service login. Must be unique.", example: "adaeze.okafor@company.ng", aliases: ["email", "email address"] },
    { key: "phone", header: "Phone", section: "Personal", kind: "text", help: "Mobile number.", example: "+234 803 000 0000", aliases: ["phone number", "mobile"] },
    { key: "nin", header: "NIN", section: "Personal", kind: "text", help: "National Identification Number (11 digits).", example: "12345678901" },
    { key: "address", header: "Home address", section: "Personal", kind: "text", help: "Street address.", example: "12 Admiralty Way, Lekki", aliases: ["address"] },
    { key: "city", header: "City", section: "Personal", kind: "text", help: "Town or city.", example: "Lagos" },
    { key: "state", header: "State of residence", section: "Personal", required: true, kind: "list", help: "Where the employee LIVES — PAYE is paid to that State's IRS. See Valid values.", example: "Lagos", aliases: ["state", "residence state", "tax state"] },

    // Employment
    { key: "jobTitle", header: "Job title", section: "Employment", required: true, kind: "text", help: "Role.", example: "Operations Analyst", aliases: ["position", "role", "designation"] },
    { key: "department", header: "Department", section: "Employment", required: true, kind: "text", help: "A department in MOTEE (see Valid values). A new name is created as a payroll department.", example: "Finance & Treasury", aliases: ["dept"] },
    { key: "branch", header: "Branch / location", section: "Employment", kind: "text", help: "Office the employee works from.", example: "Lagos HQ", aliases: ["branch", "location", "work location"] },
    { key: "grade", header: "Grade", section: "Employment", kind: "text", help: "Pay grade or level.", example: "L3", aliases: ["level", "pay grade"] },
    { key: "employmentType", header: "Employment type", section: "Employment", required: true, kind: "list", help: "Decides PAYE vs WHT and whether pension and NHF apply. See Valid values.", example: "Full-time", aliases: ["contract type", "type of employment"] },
    { key: "startDate", header: "Start date", section: "Employment", required: true, kind: "date", help: "First day of employment (the original hire date for staff moving from another payroll). A start date inside the pay month is pro-rated.", example: "01/11/2026", aliases: ["date joined", "hire date", "date of employment", "resumption date"] },

    // Salary
    { key: "annualGross", header: "Annual gross salary", section: "Salary — monthly", required: "conditional", kind: "money", help: "Only when you don't have the monthly breakdown: MOTEE splits it using the company's default split (Payroll Settings). Ignored when Basic salary is filled.", example: "", aliases: ["annual salary", "gross annual", "annual gross"] },
    ...pay,

    // Tax
    { key: "tin", header: "Tax ID (TIN)", section: "Tax", kind: "text", help: "Employee's TIN — printed on the PAYE schedule.", example: "23456789-0001", aliases: ["tin", "tax id", "jtb tin"] },
    { key: "annualRent", header: "Annual rent paid", section: "Tax", kind: "money", help: "Rent the employee pays a year. Rent relief is 20% of it, capped at ₦500,000 — only once the evidence is verified.", example: 1_200_000, aliases: ["rent", "annual rent"] },
    { key: "rentVerified", header: "Rent evidence verified", section: "Tax", kind: "yesno", help: "Yes when you've seen the tenancy agreement or receipt. No = relief waits for verification.", example: "Yes", aliases: ["rent evidence seen", "rent verified"] },
    { key: "lifeAssurance", header: "Life assurance premium (annual)", section: "Tax", kind: "money", help: "Annual premium on the employee's own life policy — tax-relieved.", example: "", aliases: ["life assurance", "life insurance premium"] },
    { key: "mortgageInterest", header: "Mortgage interest (annual)", section: "Tax", kind: "money", help: "Annual interest on a mortgage for the employee's own home — tax-relieved.", example: "", aliases: ["mortgage interest"] },

    // Pension
    { key: "pfa", header: "PFA", section: "Pension", required: "conditional", kind: "list", help: "Pension Fund Administrator. Required when the employment type has pension. See Valid values.", example: "Stanbic IBTC Pension Managers", aliases: ["pension fund administrator", "pfa name"] },
    { key: "rsaPin", header: "RSA PIN", section: "Pension", kind: "text", help: "PEN followed by 12 digits.", example: "PEN100123456789", aliases: ["rsa", "pension pin", "pension id"] },
    { key: "avcType", header: "Voluntary pension type", section: "Pension", kind: "list", help: "Additional voluntary contribution (AVC): Fixed (₦ a month), Percent (% of basic + housing + transport) or blank for none. Tax-relieved.", example: "Percent", aliases: ["avc type"] },
    { key: "avcValue", header: "Voluntary pension amount or %", section: "Pension", kind: "number", help: "₦ a month for Fixed, a percentage for Percent (5 = 5%).", example: 5, aliases: ["avc amount", "avc value", "avc"] },

    // NHF & health
    { key: "nhfEligible", header: "NHF applies", section: "NHF & health insurance", kind: "yesno", help: "National Housing Fund (2.5%). Blank = the employment type's rule.", example: "Yes", aliases: ["nhf", "include nhf"] },
    { key: "nhfNumber", header: "NHF number", section: "NHF & health insurance", kind: "text", help: "Federal Mortgage Bank NHF number.", example: "", aliases: ["nhf no"] },
    { key: "nhisEnrolled", header: "NHIA enrolled", section: "NHF & health insurance", kind: "yesno", help: "Health insurance through payroll. Only deducted when health insurance is switched on in Payroll Settings.", example: "No", aliases: ["nhis", "nhia", "health insurance"] },

    // Bank
    { key: "bankName", header: "Bank", section: "Bank", required: true, kind: "list", help: "Salary bank. See Valid values.", example: "GTBank", aliases: ["bank name"] },
    { key: "bankCode", header: "Bank code", section: "Bank", kind: "text", help: "CBN/NIBSS code. Optional — filled from the bank name.", example: "058", aliases: ["sort code", "cbn code"] },
    { key: "accountNumber", header: "Account number", section: "Bank", required: true, kind: "text", help: "10-digit NUBAN. Format the column as Text so leading zeros stay.", example: "0123456789", aliases: ["nuban", "account no", "bank account number"] },
    { key: "accountName", header: "Account name", section: "Bank", kind: "text", help: "As the bank holds it. Blank = the employee's name.", example: "Adaeze C. Okafor" },
    { key: "bvn", header: "BVN", section: "Bank", kind: "text", help: "Bank Verification Number (11 digits).", example: "22123456789" },

    // Recurring deductions
    ...ded,
    { key: "otherDedLabel", header: "Other deduction description", section: "Recurring deductions — monthly", kind: "text", help: "What the other deduction is, as it should read on the payslip.", example: "", aliases: ["other deduction label"] },

    // Loan brought forward
    { key: "loanType", header: "Loan type", section: "Loan brought forward", kind: "list", help: "A loan the employee is still repaying: Staff loan, Salary advance, Cooperative loan or Emergency loan. Blank = Staff loan.", example: "Staff loan", aliases: ["type of loan"] },
    { key: "loanBalance", header: "Loan outstanding balance", section: "Loan brought forward", required: "conditional", kind: "money", help: "What is still owed on the day MOTEE takes over. Required with a monthly repayment — MOTEE stops deducting once it is repaid.", example: "", aliases: ["loan balance", "outstanding loan", "loan outstanding"] },
    { key: "loanRepayment", header: "Loan monthly repayment", section: "Loan brought forward", required: "conditional", kind: "money", help: "Agreed monthly instalment. The last instalment takes whatever is left.", example: "", aliases: ["loan repayment", "staff loan repayment", "staff loan repayment (monthly)", "monthly loan repayment", "loan instalment"] },

    // Leave allowance
    { key: "leaveAllowancePaid", header: "Leave allowance paid this year", section: "Leave allowance", kind: "yesno", help: "Yes when the previous payroll already paid this year's leave allowance, so MOTEE doesn't pay it again this year. When and how much is set by the leave allowance policy in Payroll Settings.", example: "No", aliases: ["leave allowance paid", "leave allowance already paid"] },

    // Opening YTD
    { key: "ytdMonth", header: "YTD up to month", section: "Year to date brought forward", required: "conditional", kind: "number", help: "Last month (1–12) the previous payroll paid this tax year. Required when any YTD figure is filled.", example: 10, aliases: ["ytd month", "ytd to month"] },
    { key: "ytdGross", header: "Gross pay YTD", section: "Year to date brought forward", kind: "money", help: "Gross paid this tax year before MOTEE (from the previous payroll, or the previous employer's tax deduction card).", example: "", aliases: ["ytd gross"] },
    { key: "ytdTaxable", header: "Taxable pay YTD", section: "Year to date brought forward", kind: "money", help: "Taxable gross this year. Blank = Gross pay YTD.", example: "", aliases: ["ytd taxable"] },
    { key: "ytdPaye", header: "PAYE YTD", section: "Year to date brought forward", kind: "money", help: "PAYE already deducted this tax year. Cumulative PAYE needs it to be right.", example: "", aliases: ["ytd paye", "tax ytd"] },
    { key: "ytdPensionEe", header: "Employee pension YTD", section: "Year to date brought forward", kind: "money", help: "Employee pension (8%) deducted this year.", example: "", aliases: ["ytd pension", "ytd employee pension"] },
    { key: "ytdPensionEr", header: "Employer pension YTD", section: "Year to date brought forward", kind: "money", help: "Employer pension (10%) paid this year.", example: "", aliases: ["ytd employer pension"] },
    { key: "ytdNhf", header: "NHF YTD", section: "Year to date brought forward", kind: "money", help: "NHF deducted this year.", example: "", aliases: ["ytd nhf"] },
    { key: "ytdAvc", header: "Voluntary pension YTD", section: "Year to date brought forward", kind: "money", help: "AVC deducted this year.", example: "", aliases: ["ytd avc"] },
    { key: "ytdNet", header: "Net pay YTD", section: "Year to date brought forward", kind: "money", help: "Net paid this year. Blank = gross less PAYE, pension, NHF and AVC.", example: "", aliases: ["ytd net"] },

    // Reconciliation
    { key: "expGross", header: "Expected gross pay", section: "Reconciliation (optional)", kind: "money", help: "What the previous payroll (or your calculator) pays this employee for the first MOTEE month. MOTEE compares after calculating.", example: "", aliases: ["previous gross", "legacy gross"] },
    { key: "expPaye", header: "Expected PAYE", section: "Reconciliation (optional)", kind: "money", help: "Expected PAYE for the first MOTEE month.", example: "", aliases: ["previous paye", "legacy paye"] },
    { key: "expPension", header: "Expected employee pension", section: "Reconciliation (optional)", kind: "money", help: "Expected employee pension for the first MOTEE month.", example: "", aliases: ["previous pension", "legacy pension"] },
    { key: "expNhf", header: "Expected NHF", section: "Reconciliation (optional)", kind: "money", help: "Expected NHF for the first MOTEE month.", example: "", aliases: ["previous nhf", "legacy nhf"] },
    { key: "expNet", header: "Expected net pay", section: "Reconciliation (optional)", kind: "money", help: "Expected net pay for the first MOTEE month.", example: "", aliases: ["previous net", "legacy net"] },
  ];
}

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, (m) => (/(monthly|annual)/.test(m) ? m : ""))
    .replace(/[^a-z0-9%]/g, "");

/** Column header as written in the template (required ones end with *). */
export const templateHeader = (c: StarterColumn) => (c.required === true ? `${c.header} *` : c.header);

// ── Template workbook ───────────────────────────────────────────────────────

export interface TemplateCtx {
  elements: PayElement[];
  settings: PayrollSettings;
  bundle: Pick<LocaleBundle, "employmentTypes" | "departments" | "branches" | "tenant">;
  companyName?: string;
}

export const EMPLOYEES_SHEET = "Employees";

/**
 * The blank (or sample-filled) template: Read me, Employees, Column guide,
 * Valid values and Pay elements sheets.
 */
export function buildStarterWorkbook(ctx: TemplateCtx, rows: Record<string, string | number>[] = []): XLSX.WorkBook {
  const cols = starterColumns(ctx.elements);
  const wb = XLSX.utils.book_new();

  const readMe: (string | number)[][] = [
    ["MOTEE Payroll — New Starter Bulk Upload Template"],
    [ctx.companyName ? `Company: ${ctx.companyName}` : ""],
    [],
    ["What this is for"],
    ["One row per employee joining MOTEE payroll — new hires, or a whole company moving its payroll to MOTEE."],
    ["After upload MOTEE checks every row, creates the employee, salary structure, tax / pension / bank profile and recurring deductions, and adds them to the open pay run."],
    [],
    ["How to fill it"],
    ["1. Fill the Employees sheet, one row per person. Columns marked * are required. The Column guide explains every column."],
    ["2. Pay figures are MONTHLY in naira, numbers only (no ₦ or commas needed). Annual figures say so in the column name."],
    ["3. Either give the monthly breakdown (Basic, Housing, Transport, allowances…) or just Annual gross salary — MOTEE then applies the company's default split."],
    ["4. Any other recurring allowance in the Pay elements sheet can be added as an extra column headed with its code (e.g. COLA)."],
    ["   Loans still being repaid: give the outstanding balance and the monthly repayment. MOTEE shows the balance left on each payslip and stops when it is repaid."],
    ["   Leave allowance follows the policy in Payroll Settings. If the previous payroll already paid this year's, put Yes in 'Leave allowance paid this year'."],
    ["5. Staff already paid this year by another payroll: fill the 'Year to date brought forward' columns. MOTEE uses cumulative PAYE, so without them November tax is understated."],
    ["6. Optional: fill the Reconciliation columns with what the previous payroll paid. After the first run MOTEE shows every difference."],
    ["7. Keep Account number, BVN, NIN and RSA PIN as text so leading zeros stay."],
    ["8. Dates: DD/MM/YYYY or YYYY-MM-DD. Yes/No columns accept Yes, No, Y, N."],
    [],
    ["Upload: Payroll → Import new starters. Nothing is saved until you confirm the checked rows."],
  ];
  const rm = XLSX.utils.aoa_to_sheet(readMe);
  rm["!cols"] = [{ wch: 140 }];
  XLSX.utils.book_append_sheet(wb, rm, "Read me");

  const header = cols.map(templateHeader);
  const sectionRow = cols.map((c, i) => (i === 0 || cols[i - 1].section !== c.section ? c.section.toUpperCase() : ""));
  const body = rows.map((r) => cols.map((c) => r[c.key] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([sectionRow, header, ...body]);
  ws["!cols"] = cols.map((c) => ({ wch: Math.max(14, Math.min(34, c.header.length + 4)) }));
  ws["!freeze"] = { xSplit: 3, ySplit: 2 };
  // Text cells for identifiers so Excel keeps leading zeros.
  const textKeys = new Set(["accountNumber", "bvn", "nin", "rsaPin", "bankCode", "tin", "employeeNumber", "phone"]);
  cols.forEach((c, ci) => {
    if (!textKeys.has(c.key)) return;
    for (let r = 2; r < 2 + Math.max(rows.length, 200); r++) {
      const ref = XLSX.utils.encode_cell({ r, c: ci });
      const cell = ws[ref];
      if (cell) {
        cell.t = "s";
        cell.v = String(cell.v);
        cell.z = "@";
      } else if (r < 2 + 200) ws[ref] = { t: "s", v: "", z: "@" };
    }
  });
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  range.e.r = Math.max(range.e.r, 1 + 200);
  ws["!ref"] = XLSX.utils.encode_range(range);
  XLSX.utils.book_append_sheet(wb, ws, EMPLOYEES_SHEET);

  const guide = XLSX.utils.aoa_to_sheet([
    ["Section", "Column", "Required", "Format", "What to enter", "Example"],
    ...cols.map((c) => [c.section, c.header, c.required === true ? "Yes" : c.required === "conditional" ? "Conditional" : "No", KIND_LABEL[c.kind], c.help, c.example]),
  ]);
  guide["!cols"] = [{ wch: 30 }, { wch: 36 }, { wch: 12 }, { wch: 14 }, { wch: 100 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, guide, "Column guide");

  const types = ctx.bundle.employmentTypes.map((t) => {
    const r = ruleFor(ctx.settings, t.id);
    return [t.name, r.excluded ? "Not paid through payroll" : r.regime === "wht" ? "WHT (5%)" : "PAYE", r.pension ? "Yes" : "No", r.nhf ? "Yes" : "No"];
  });
  const lists: (string | number)[][] = [["EMPLOYMENT TYPES", "Tax", "Pension", "NHF"], ...types, [], ["STATES OF RESIDENCE"], ...NG_STATES.map((s) => [s]), [], ["BANKS", "Code"], ...NG_BANKS.map((b) => [b.name, b.code]), [], ["PFAs"], ...NG_PFAS.map((p) => [p.name]), [], ["DEPARTMENTS"], ...ctx.bundle.departments.map((d) => [d.name]), [], ["BRANCHES"], ...(ctx.bundle.branches ?? []).map((b) => [b.name]), [], ["VOLUNTARY PENSION TYPE"], ["Fixed"], ["Percent"], [], ["GENDER"], ["Female"], ["Male"], [], ["YES / NO"], ["Yes"], ["No"]];
  const vl = XLSX.utils.aoa_to_sheet(lists);
  vl["!cols"] = [{ wch: 34 }, { wch: 22 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, vl, "Valid values");

  const recurring = ctx.elements.filter((e) => e.active && e.category === "earning" && e.recurring && !e.statutory);
  const els = XLSX.utils.aoa_to_sheet([
    ["Code", "Pay element", "Group", "Taxable", "Pensionable", "Has its own column"],
    ...recurring.map((e) => [e.code, e.name, e.group, e.taxable ? "Yes" : "No", e.pensionable ? "Yes" : "No", (STARTER_PAY_CODES as readonly string[]).includes(e.code) ? "Yes" : "Add a column headed with the code"]),
  ]);
  els["!cols"] = [{ wch: 18 }, { wch: 34 }, { wch: 16 }, { wch: 9 }, { wch: 12 }, { wch: 34 }];
  XLSX.utils.book_append_sheet(wb, els, "Pay elements");
  return wb;
}

const KIND_LABEL: Record<ColKind, string> = { text: "Text", money: "Naira amount", date: "Date", yesno: "Yes / No", number: "Number", list: "From Valid values" };

// ── Parsing ─────────────────────────────────────────────────────────────────

export type Cell = string | number | boolean | Date | null | undefined;

export interface ImportCtx {
  bundle: Pick<LocaleBundle, "employmentTypes" | "departments" | "branches" | "tenant" | "employees">;
  elements: PayElement[];
  settings: PayrollSettings;
  rateSets: StatutoryRateSet[];
  /** Existing salary structures / profiles, to spot duplicates. */
  structures: SalaryStructure[];
  /** The open regular period the starters join, if any. */
  period: PayPeriod | null;
  /** Tax year the year-to-date belongs to. */
  year: number;
  importedBy: string;
  batchId: string;
  /**
   * Payroll ids to use, one per data row in order (the onboarding hand-over
   * keeps the HR record's id so both modules mean the same person).
   */
  ids?: (string | undefined)[];
  /** People in HR onboarding — a row matching one is linked to it, not added twice. */
  hrHires?: HrHireRef[];
}

/** An HR hire (onboarding in progress or cleared) that payroll rows are matched against. */
export interface HrHireRef {
  id: string;
  name: string;
  email: string;
  employeeNumber?: string;
  status: "onboarding" | "onboarded";
}

export interface RowIssue {
  column?: string;
  message: string;
}

export interface StarterRecord {
  employee: LocaleEmployee;
  structure: SalaryStructure;
  profile: EmployeeTaxProfile;
  recurring: ImportedDeduction[];
  /** Loan brought forward from the previous payroll, repaid through MOTEE. */
  loan: LocaleLoan | null;
  opening: YtdTotals | null;
  expected: ExpectedFigures | null;
  /** A department that doesn't exist yet in MOTEE. */
  newDepartment?: { id: string; name: string };
}

export interface StagedRow {
  /** Spreadsheet row number, as Excel shows it. */
  row: number;
  name: string;
  employeeNumber: string;
  errors: RowIssue[];
  warnings: RowIssue[];
  record: StarterRecord | null;
}

export interface ParseResult {
  rows: StagedRow[];
  /** Headers that matched nothing — ignored, but reported. */
  unknownColumns: string[];
  /** Problems with the file itself (no Employees sheet, no header). */
  fileErrors: string[];
}

export interface ImportedDeduction {
  id: string;
  employeeId: string;
  code: string;
  label: string;
  amount: number;
  currency: string;
  frequency: "monthly";
  startDate: string;
  endDate?: string;
}

export interface ExpectedFigures {
  gross?: number;
  paye?: number;
  pensionEmployee?: number;
  nhf?: number;
  net?: number;
}

/** Reads the Employees sheet (or the first sheet that has a First name column) into rows of cells. */
export function readStarterSheet(wb: XLSX.WorkBook): { header: string[]; rows: { row: number; cells: Cell[] }[] } | null {
  const names = [EMPLOYEES_SHEET, ...wb.SheetNames.filter((n) => n !== EMPLOYEES_SHEET)];
  for (const name of names) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const aoa = XLSX.utils.sheet_to_json<Cell[]>(ws, { header: 1, raw: true, defval: null, blankrows: true });
    const h = aoa.findIndex((r) => (r ?? []).some((c) => /^first ?name/i.test(String(c ?? "").trim())));
    if (h < 0) continue;
    return {
      header: (aoa[h] ?? []).map((c) => String(c ?? "").trim()),
      rows: aoa
        .slice(h + 1)
        .map((cells, i) => ({ row: h + 2 + i, cells: cells ?? [] }))
        .filter((r) => r.cells.some((c) => c !== null && c !== undefined && String(c).trim() !== "")),
    };
  }
  return null;
}

/** Maps each header to a column key. Unknown earning/deduction codes map to `pay:CODE`/`ded:CODE`. */
export function mapHeaders(header: string[], cols: StarterColumn[], elements: PayElement[]): { keys: (string | null)[]; unknown: string[] } {
  const index = new Map<string, string>();
  for (const c of cols) {
    for (const a of [c.header, templateHeader(c), ...(c.aliases ?? [])]) if (!index.has(norm(a))) index.set(norm(a), c.key);
  }
  const extra = new Map<string, string>();
  for (const e of elements) {
    if (!e.active || e.statutory || LOAN_CODES.has(e.code)) continue;
    const key = e.category === "earning" && e.recurring ? `pay:${e.code}` : e.category === "deduction" && e.group === "other_deductions" ? `ded:${e.code}` : null;
    if (!key) continue;
    for (const a of [e.code, e.name, `${e.name} (monthly)`]) if (!index.has(norm(a)) && !extra.has(norm(a))) extra.set(norm(a), key);
  }
  const unknown: string[] = [];
  const keys = header.map((h) => {
    if (!h) return null;
    const k = index.get(norm(h)) ?? extra.get(norm(h)) ?? null;
    if (!k) unknown.push(h);
    return k;
  });
  return { keys, unknown };
}

const iso = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Excel serial, Date, ISO, DD/MM/YYYY (Nigerian order) or "1 Nov 2026" → ISO date. */
export function parseDate(v: Cell): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : iso(new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())));
  if (typeof v === "number") {
    if (v < 1 || v > 80_000) return null;
    return iso(new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86_400_000));
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) return valid(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[\s-]+([a-z]{3})[a-z]*\.?[\s-]+(\d{4})$/i);
  if (m && MONTHS.includes(m[2].toLowerCase())) return valid(+m[3], MONTHS.indexOf(m[2].toLowerCase()) + 1, +m[1]);
  return null;
}

function valid(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 ? iso(dt) : null;
}

/** "₦1,250,000.50", "1250000", 1250000 → 1250000.5. Blank → null; anything else → NaN. */
export function parseMoney(v: Cell): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[₦,\s]|NGN/gi, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function parseYesNo(v: Cell): boolean | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(s)) return true;
  if (["no", "n", "false", "0"].includes(s)) return false;
  return null;
}

const text = (v: Cell) => (v === null || v === undefined ? "" : v instanceof Date ? iso(v) : String(v).trim());
const digits = (v: Cell) => text(v).replace(/\D/g, "");
const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
const fmtN = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const monthName = (m: number) => new Date(Date.UTC(2026, m - 1, 1)).toLocaleString("en-GB", { month: "long", timeZone: "UTC" });

/** Next free employee number with the company's prefix (NG1001 → NG1021). */
function numberAllocator(existing: string[]): () => string {
  let prefix = "EMP";
  let max = 0;
  for (const n of existing) {
    const m = n.match(/^([A-Z]*)(\d+)$/i);
    if (!m) continue;
    if (Number(m[2]) > max) {
      max = Number(m[2]);
      prefix = m[1] || prefix;
    }
  }
  const taken = new Set(existing.map((n) => n.toUpperCase()));
  return () => {
    let next = `${prefix}${++max}`;
    while (taken.has(next.toUpperCase())) next = `${prefix}${++max}`;
    taken.add(next.toUpperCase());
    return next;
  };
}

/**
 * Parses and validates every row. Rows with errors carry no record; rows with
 * only warnings can be imported. Nothing here touches the store.
 */
export function parseStarterWorkbook(wb: XLSX.WorkBook, ctx: ImportCtx): ParseResult {
  const sheet = readStarterSheet(wb);
  if (!sheet) return { rows: [], unknownColumns: [], fileErrors: ["No Employees sheet with a 'First name' column was found. Use the MOTEE template."] };
  const cols = starterColumns(ctx.elements);
  const { keys, unknown } = mapHeaders(sheet.header, cols, ctx.elements);
  const fileErrors: string[] = [];
  for (const req of cols.filter((c) => c.required === true)) if (!keys.includes(req.key)) fileErrors.push(`Required column “${req.header}” is missing.`);
  if (!keys.some((k) => k === "pay:BASIC" || k === "annualGross")) fileErrors.push("Add either “Basic Salary (monthly)” or “Annual gross salary”.");
  if (fileErrors.length) return { rows: [], unknownColumns: unknown, fileErrors };

  const headerOf = new Map(cols.map((c) => [c.key, c.header]));
  const elements = new Map(ctx.elements.map((e) => [e.code, e]));
  const existingNumbers = ctx.bundle.employees.map((e) => e.employeeNumber);
  const nextNumber = numberAllocator([...existingNumbers, ...sheet.rows.map((r) => text(r.cells[keys.indexOf("employeeNumber")])).filter(Boolean)]);
  const takenNumbers = new Map(ctx.bundle.employees.map((e) => [e.employeeNumber.toUpperCase(), e.fullName]));
  const takenEmails = new Map(ctx.bundle.employees.map((e) => [e.email.toLowerCase(), e.fullName]));
  const takenAccounts = new Map<string, string>();
  const seenNumbers = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  const newDepartments = new Map<string, { id: string; name: string }>();
  const rateSet = resolveRateSet(ctx.rateSets, ctx.period?.end ?? `${ctx.year}-12-31`);

  const hireByEmail = new Map((ctx.hrHires ?? []).filter((h) => h.email).map((h) => [h.email.toLowerCase(), h]));
  const hireByNumber = new Map((ctx.hrHires ?? []).filter((h) => h.employeeNumber).map((h) => [h.employeeNumber!.toUpperCase(), h]));
  const linkedHires = new Map<string, number>();

  const rows = sheet.rows.map(({ row, cells }, index): StagedRow => {
    const errors: RowIssue[] = [];
    const warnings: RowIssue[] = [];
    const get = (key: string): Cell => {
      const i = keys.indexOf(key);
      return i < 0 ? null : cells[i];
    };
    const err = (key: string | undefined, message: string) => errors.push({ column: key ? headerOf.get(key) ?? key.replace(/^(pay|ded):/, "") : undefined, message });
    const warn = (key: string | undefined, message: string) => warnings.push({ column: key ? headerOf.get(key) ?? key.replace(/^(pay|ded):/, "") : undefined, message });
    const money = (key: string): number => {
      const n = parseMoney(get(key));
      if (n === null) return 0;
      if (Number.isNaN(n)) {
        err(key, `“${text(get(key))}” isn't an amount.`);
        return 0;
      }
      if (n < 0) {
        err(key, "Can't be negative.");
        return 0;
      }
      return round2(n);
    };
    const optMoney = (key: string): number | undefined => (parseMoney(get(key)) === null ? undefined : money(key));
    const date = (key: string): string | null => {
      const raw = get(key);
      const d = parseDate(raw);
      if (raw !== null && raw !== undefined && text(raw) !== "" && !d) err(key, `“${text(raw)}” isn't a date. Use DD/MM/YYYY.`);
      return d;
    };
    const yesNo = (key: string): boolean | null => {
      const raw = get(key);
      const b = parseYesNo(raw);
      if (b === null && text(raw)) err(key, `Use Yes or No (got “${text(raw)}”).`);
      return b;
    };

    // Personal
    const firstName = text(get("firstName"));
    const lastName = text(get("lastName"));
    const otherNames = text(get("otherNames"));
    if (!firstName) err("firstName", "Required.");
    if (!lastName) err("lastName", "Required.");
    const fullName = [firstName, otherNames, lastName].filter(Boolean).join(" ");
    const displayName = [firstName, lastName].filter(Boolean).join(" ");

    let employeeNumber = text(get("employeeNumber"));
    if (employeeNumber) {
      const key = employeeNumber.toUpperCase();
      if (takenNumbers.has(key)) err("employeeNumber", `${employeeNumber} already belongs to ${takenNumbers.get(key)}.`);
      else if (seenNumbers.has(key)) err("employeeNumber", `Also used on row ${seenNumbers.get(key)}.`);
      seenNumbers.set(key, row);
    } else employeeNumber = nextNumber();

    const email = text(get("email")).toLowerCase();
    if (!email) err("email", "Required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err("email", `“${email}” isn't an email address.`);
    else if (takenEmails.has(email)) err("email", `Already used by ${takenEmails.get(email)}.`);
    else if (seenEmails.has(email)) err("email", `Also used on row ${seenEmails.get(email)}.`);
    if (email) seenEmails.set(email, row);

    // The same person already in HR onboarding: link to that record instead of creating a second one.
    const givenNumber = text(get("employeeNumber")).toUpperCase();
    const hire = ctx.ids?.[index] ? undefined : (email && hireByEmail.get(email)) || (givenNumber && hireByNumber.get(givenNumber)) || undefined;
    if (hire) {
      if (linkedHires.has(hire.id)) err("email", `${hire.name} is already linked on row ${linkedHires.get(hire.id)}.`);
      linkedHires.set(hire.id, row);
      warn(
        "email",
        `Matches ${hire.name} in HR onboarding (${hire.status === "onboarded" ? "onboarded" : "still onboarding"}) — linked to that record, not added twice.${hire.email && email && hire.email.toLowerCase() !== email ? ` Note the onboarding email is ${hire.email}.` : ""}${hire.employeeNumber && givenNumber && hire.employeeNumber.toUpperCase() !== givenNumber ? ` Onboarding has Employee ID ${hire.employeeNumber}.` : ""}`,
      );
    }

    const gender = text(get("gender")).toLowerCase();
    if (gender && !/^(f|m|female|male)$/.test(gender)) warn("gender", `“${text(get("gender"))}” isn't Female or Male — left blank.`);
    const dob = date("dateOfBirth");
    const nin = digits(get("nin"));
    if (nin && nin.length !== 11) warn("nin", "NIN should be 11 digits.");

    const stateRaw = text(get("state"));
    const state = stateRaw ? matchState(stateRaw) : null;
    if (!stateRaw) err("state", "Required — PAYE goes to the State of residence.");
    else if (!state) err("state", `“${stateRaw}” isn't a Nigerian state. See Valid values.`);

    // Employment
    const jobTitle = text(get("jobTitle"));
    if (!jobTitle) err("jobTitle", "Required.");
    const deptRaw = text(get("department"));
    let department: { id: string; name: string } | null = null;
    if (!deptRaw) err("department", "Required.");
    else {
      const hit = ctx.bundle.departments.find((d) => norm(d.name) === norm(deptRaw) || norm(d.code) === norm(deptRaw) || d.id === deptRaw);
      if (hit) department = { id: hit.id, name: hit.name };
      else {
        department = newDepartments.get(norm(deptRaw)) ?? { id: `DEPT-IMP-${slug(deptRaw)}`, name: deptRaw };
        newDepartments.set(norm(deptRaw), department);
        warn("department", `“${deptRaw}” is a new department — it will be created for payroll.`);
      }
    }
    const branchRaw = text(get("branch"));
    const branch = branchRaw ? (ctx.bundle.branches ?? []).find((b) => norm(b.name) === norm(branchRaw)) : undefined;
    if (branchRaw && !branch) warn("branch", `“${branchRaw}” isn't a MOTEE branch — kept as the work location.`);

    const typeRaw = text(get("employmentType"));
    const type = typeRaw ? ctx.bundle.employmentTypes.find((t) => norm(t.name) === norm(typeRaw) || t.id.toLowerCase() === typeRaw.toLowerCase()) : undefined;
    if (!typeRaw) err("employmentType", "Required.");
    else if (!type) err("employmentType", `“${typeRaw}” isn't an employment type. See Valid values.`);
    const rule = ruleFor(ctx.settings, type?.id ?? "ET-FT");
    if (type && rule.excluded) warn("employmentType", `${type.name} staff aren't paid through payroll.`);

    const startDate = date("startDate");
    if (!text(get("startDate"))) err("startDate", "Required.");
    if (startDate && ctx.period && startDate > ctx.period.end) warn("startDate", `Starts after ${ctx.period.label} — first paid in a later month.`);
    if (startDate && ctx.period && startDate > ctx.period.start && startDate <= ctx.period.end) warn("startDate", `Joins mid-month — ${ctx.period.label} pay is pro-rated.`);

    // Salary structure
    const lines: SalaryLine[] = [];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!k?.startsWith("pay:")) continue;
      const code = k.slice(4);
      const amount = money(k);
      if (!amount) continue;
      const e = elements.get(code);
      if (!e || !e.active) {
        err(k, `${code} isn't an active pay element.`);
        continue;
      }
      if (!ctx.settings.enabledGroups.includes(e.group))
        warn(k, `${e.name} is in the ${e.group.replace(/_/g, " ")} pay group, which is switched off in Payroll Settings. It's still paid; switch the group on to adjust it from the run screens.`);
      const existing = lines.find((l) => l.code === code);
      if (existing) existing.amount = round2(existing.amount + amount);
      else lines.push({ code, amount });
    }
    const annualGross = optMoney("annualGross");
    let structureLines = lines;
    if (!lines.some((l) => l.code === "BASIC" || l.code === "CONSOLIDATED")) {
      if (lines.length) err("pay:BASIC", "Basic salary is required when other pay lines are given.");
      else if (annualGross) structureLines = splitSalary(annualGross, ctx.settings.defaultSplit);
      else err("pay:BASIC", "Give the monthly Basic salary (and allowances) or the Annual gross salary.");
    } else if (annualGross && Math.abs(annualGross - lines.reduce((s, l) => s + l.amount, 0) * 12) > 12) {
      warn("annualGross", `Annual gross ${fmtN(annualGross)} doesn't match the monthly lines × 12 (${fmtN(lines.reduce((s, l) => s + l.amount, 0) * 12)}) — the monthly lines are used.`);
    }
    const monthlyGross = round2(structureLines.reduce((s, l) => s + l.amount, 0));
    const basic = structureLines.find((l) => l.code === "BASIC" || l.code === "CONSOLIDATED")?.amount ?? 0;
    if (basic && (basic < ctx.settings.basicMin || basic > ctx.settings.basicMax))
      warn("pay:BASIC", `Basic ${fmtN(basic)} is outside the expected range ${fmtN(ctx.settings.basicMin)}–${fmtN(ctx.settings.basicMax)} (Payroll Settings).`);
    if (monthlyGross && monthlyGross <= rateSet.minimumWageMonthly && rule.regime === "paye")
      warn("pay:BASIC", `Monthly pay ${fmtN(monthlyGross)} is at or below the minimum wage (${fmtN(rateSet.minimumWageMonthly)}) — exempt from PAYE.`);

    // Tax
    const tin = text(get("tin"));
    if (!tin && rule.regime === "paye" && !rule.excluded) warn("tin", "No TIN — the PAYE schedule will show it blank.");
    const annualRent = money("annualRent");
    const rentVerified = yesNo("rentVerified");
    if (annualRent && rentVerified !== true) warn("rentVerified", "Rent relief waits until the evidence is marked verified.");
    const lifeAssurance = money("lifeAssurance");
    const mortgageInterest = money("mortgageInterest");

    // Pension
    const pfaRaw = text(get("pfa"));
    const pfa = pfaRaw ? matchPfa(pfaRaw) : null;
    const pfaFinal = pfa ?? (pfaRaw ? { code: `PFA-${slug(pfaRaw)}`, name: pfaRaw } : { code: "", name: "" });
    if (rule.pension && !rule.excluded && !pfaRaw) warn("pfa", "No PFA — pension is deducted but can't be remitted until one is recorded.");
    if (pfaRaw && !pfa) warn("pfa", `“${pfaRaw}” isn't on the list of licensed PFAs — check the spelling.`);
    const rsaPin = text(get("rsaPin")).toUpperCase().replace(/\s/g, "");
    if (rule.pension && !rule.excluded && !rsaPin) warn("rsaPin", "No RSA PIN — the PFA schedule needs it.");
    else if (rsaPin && !/^PEN\d{12}$/.test(rsaPin)) warn("rsaPin", `“${rsaPin}” doesn't look like an RSA PIN (PEN + 12 digits).`);

    const avcTypeRaw = text(get("avcType")).toLowerCase();
    const avcValue = parseMoney(get("avcValue"));
    let avc: EmployeeTaxProfile["avc"] = null;
    if (avcTypeRaw && !/^(none|no|-)$/.test(avcTypeRaw)) {
      const mode = /^(fixed|amount|naira|₦)/.test(avcTypeRaw) ? "fixed" : /^(percent|%|percentage|pct)/.test(avcTypeRaw) ? "percent" : null;
      if (!mode) err("avcType", `Use Fixed or Percent (got “${text(get("avcType"))}”).`);
      else if (avcValue === null || Number.isNaN(avcValue) || avcValue <= 0) err("avcValue", "Give the voluntary pension amount or percentage.");
      else if (mode === "percent" && avcValue > 100) err("avcValue", "A percentage can't be over 100.");
      else {
        if (!rule.pension) warn("avcType", `${type?.name ?? "This"} employment type has no pension — the voluntary contribution is still deducted.`);
        avc = { mode, value: avcValue, startDate: startDate && ctx.period && startDate > ctx.period.start ? startDate : undefined };
      }
    } else if (avcValue && !Number.isNaN(avcValue)) err("avcType", "Say whether the voluntary pension is Fixed or Percent.");

    // NHF & NHIA
    const nhfFlag = yesNo("nhfEligible");
    if (nhfFlag && !rule.nhf) warn("nhfEligible", `${type?.name ?? "This"} employment type doesn't pay NHF — the type's rule wins.`);
    const nhisEnrolled = yesNo("nhisEnrolled") ?? false;
    if (nhisEnrolled && !ctx.settings.nhisEnabled) warn("nhisEnrolled", "Health insurance is switched off in Payroll Settings — nothing is deducted until it's on.");

    // Bank
    const bankRaw = text(get("bankName"));
    const codeRaw = digits(get("bankCode"));
    const bank = bankRaw ? matchBank(bankRaw) : null;
    const bankByCode = codeRaw ? NG_BANKS.find((b) => b.code === codeRaw) : undefined;
    const bankName = bank?.name ?? bankByCode?.name ?? bankRaw;
    const bankCode = codeRaw || bank?.code || "";
    if (!bankRaw && !rule.excluded) err("bankName", "Required.");
    else if (bankRaw && !bank && !codeRaw) err("bankName", `“${bankRaw}” isn't a known bank — add its Bank code.`);
    if (bank && codeRaw && bank.code !== codeRaw) warn("bankCode", `${bank.name}'s code is ${bank.code}, not ${codeRaw} — the code given is used.`);
    const accountNumber = digits(get("accountNumber"));
    if (!accountNumber && !rule.excluded) err("accountNumber", "Required.");
    else if (accountNumber && accountNumber.length !== 10) err("accountNumber", `${accountNumber} isn't 10 digits${accountNumber.length === 9 ? " — was a leading 0 dropped? Format the column as Text" : ""}.`);
    else if (accountNumber && bankCode && !isValidNuban(accountNumber, bankCode)) err("accountNumber", `${accountNumber} fails the NUBAN check for ${bankName} — a digit is wrong or it's another bank's account.`);
    if (accountNumber) {
      const k = `${bankCode}:${accountNumber}`;
      if (takenAccounts.has(k)) warn("accountNumber", `Same account as ${takenAccounts.get(k)}.`);
      takenAccounts.set(k, displayName);
    }
    const accountName = text(get("accountName")) || fullName;
    if (text(get("accountName")) && !sharesName(accountName, [firstName, lastName, otherNames])) warn("accountName", `Account name “${accountName}” doesn't match the employee's name.`);
    const bvn = digits(get("bvn"));
    if (bvn && bvn.length !== 11) warn("bvn", "BVN should be 11 digits.");

    // Recurring deductions
    const recurring: Omit<ImportedDeduction, "id" | "employeeId">[] = [];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!k?.startsWith("ded:")) continue;
      const code = k.slice(4);
      const amount = money(k);
      if (!amount) continue;
      const label =
        code === "OTHER_DED" ? text(get("otherDedLabel")) || "Other deduction" : DEDUCTION_LABELS[code as keyof typeof DEDUCTION_LABELS] ?? elements.get(code)?.name ?? code;
      recurring.push({
        code,
        label,
        amount,
        currency: "NGN",
        frequency: "monthly",
        startDate: startDate && ctx.period && startDate > ctx.period.start ? startDate : ctx.period?.start ?? startDate ?? `${ctx.year}-01-01`,
      });
    }

    // Loan brought forward: becomes a payroll loan that stops when repaid.
    const loanBalance = money("loanBalance");
    let loanRepayment = money("loanRepayment");
    const loanTypeRaw = text(get("loanType"));
    const loanTypeLabel = Object.keys(STARTER_LOAN_TYPES).find((k) => norm(k) === norm(loanTypeRaw)) ?? (loanTypeRaw ? null : "Staff loan");
    let loan: Omit<LocaleLoan, "id" | "employeeId"> | null = null;
    if (loanBalance || loanRepayment) {
      if (!loanTypeLabel) err("loanType", `Use ${Object.keys(STARTER_LOAN_TYPES).join(", ")} (got “${loanTypeRaw}”).`);
      else if (!loanBalance) err("loanBalance", "Give the outstanding balance so MOTEE knows when the loan is repaid.");
      else if (!loanRepayment) err("loanRepayment", "Give the monthly repayment.");
      else {
        if (loanRepayment > loanBalance) {
          warn("loanRepayment", `The repayment is more than the balance — MOTEE deducts the ${fmtN(loanBalance)} left and closes the loan.`);
          loanRepayment = loanBalance;
        }
        // First instalment falls due in the first month MOTEE pays.
        const first = startDate && ctx.period && startDate > ctx.period.end ? startDate : ctx.period?.start ?? startDate ?? `${ctx.year}-01-01`;
        const [fy, fm] = first.split("-").map(Number);
        const issuedAt = iso(new Date(Date.UTC(fy, fm - 2, 1)));
        loan = {
          loanType: STARTER_LOAN_TYPES[loanTypeLabel],
          amount: loanBalance,
          currency: "NGN",
          purpose: "Balance brought forward from the previous payroll",
          repaymentMonths: Math.ceil(loanBalance / loanRepayment - 1e-9),
          monthlyRepayment: loanRepayment,
          fixedInstalment: loanRepayment,
          amountRepaid: 0,
          requestedAt: issuedAt,
          issuedAt,
          status: "active",
          approverId: null,
        };
        if (!ctx.settings.deductLoansViaPayroll) warn("loanRepayment", "Loan deductions are switched off in Payroll Settings — nothing is deducted until they're on.");
      }
    } else if (loanTypeRaw) warn("loanType", "Loan type given without a balance or repayment — ignored.");
    const recurringTotal = recurring.reduce((s, r) => s + r.amount, 0) + (loan?.monthlyRepayment ?? 0);
    if (monthlyGross && recurringTotal > monthlyGross / 3) warn(undefined, `Recurring deductions (${fmtN(recurringTotal)}) are over a third of gross pay — check net pay stays reasonable.`);

    // Year to date brought forward
    const ytdMonthRaw = parseMoney(get("ytdMonth"));
    const ytd = {
      gross: optMoney("ytdGross"),
      taxable: optMoney("ytdTaxable"),
      paye: optMoney("ytdPaye"),
      pensionEe: optMoney("ytdPensionEe"),
      pensionEr: optMoney("ytdPensionEr"),
      nhf: optMoney("ytdNhf"),
      avc: optMoney("ytdAvc"),
      net: optMoney("ytdNet"),
    };
    const anyYtd = Object.values(ytd).some((v) => v !== undefined);
    let opening: YtdTotals | null = null;
    if (anyYtd || ytdMonthRaw !== null) {
      const month = ytdMonthRaw === null || Number.isNaN(ytdMonthRaw) ? NaN : Math.round(ytdMonthRaw);
      if (!(month >= 1 && month <= 12)) err("ytdMonth", "Give the last month (1–12) the previous payroll paid.");
      else if (ctx.period && month >= ctx.period.month) err("ytdMonth", `YTD up to month ${month} overlaps ${ctx.period.label}, which MOTEE is about to pay.`);
      else if (ytd.gross === undefined) err("ytdGross", "Gross pay YTD is required with the other YTD figures.");
      else {
        const gross = ytd.gross;
        const taxable = ytd.taxable ?? gross;
        const paye = ytd.paye ?? 0;
        const pensionEe = ytd.pensionEe ?? 0;
        const nhf = ytd.nhf ?? 0;
        const avcYtd = ytd.avc ?? 0;
        if (taxable > gross + 0.01) err("ytdTaxable", "Taxable pay YTD can't be more than gross pay YTD.");
        if (paye > taxable) err("ytdPaye", "PAYE YTD can't be more than taxable pay YTD.");
        if (ytd.paye === undefined && rule.regime === "paye") warn("ytdPaye", "No PAYE YTD — MOTEE assumes none was deducted and will catch it all up this month.");
        // Annual reliefs are assumed given evenly by the previous payroll (annual × month/12).
        const scale = month / 12;
        const rentRelief = annualRent && rentVerified ? Math.min(annualRent * rateSet.rentReliefRate, rateSet.rentReliefCap) : 0;
        const reliefs: Record<string, number> = {};
        const put = (label: string, v: number) => v > 0 && (reliefs[label] = round2(v));
        put(RELIEF.pension, pensionEe);
        put(RELIEF.nhf, nhf);
        put(RELIEF.vol, avcYtd);
        put(RELIEF.rent, rentRelief * scale);
        put(RELIEF.life, lifeAssurance * scale);
        put(RELIEF.mortgage, mortgageInterest * scale);
        const reliefTotal = Object.values(reliefs).reduce((s, v) => s + v, 0);
        const totalDeductions = round2(paye + pensionEe + nhf + avcYtd);
        opening = {
          ...emptyYtd(ctx.year),
          months: month,
          gross,
          taxableGross: taxable,
          chargeable: round2(Math.max(0, taxable - reliefTotal)),
          paye,
          pensionEmployee: pensionEe,
          pensionEmployer: ytd.pensionEr ?? 0,
          nhf,
          totalDeductions: ytd.net !== undefined ? round2(gross - ytd.net) : totalDeductions,
          net: ytd.net ?? round2(gross - totalDeductions),
          reliefs,
        };
        if (startDate && startDate > `${ctx.year}-${String(month).padStart(2, "0")}-31` && gross > 0)
          warn("ytdMonth", "Year-to-date figures are dated before the start date — fine if they come from a previous employer.");
      }
    } else if (startDate && ctx.period && rule.regime === "paye" && !rule.excluded && startDate < ctx.period.start && ctx.period.month > 1 && startDate.slice(0, 4) <= String(ctx.year)) {
      const since = startDate < `${ctx.year}-01-01` ? `1 January ${ctx.year}` : startDate;
      warn("ytdGross", `Employed since ${since} but no year-to-date figures — cumulative PAYE will treat ${ctx.period.label} as the first pay this year and under-deduct. Add YTD up to ${monthName(ctx.period.month - 1)}.`);
    }

    // Leave allowance: say so when the policy pays it in the first MOTEE month.
    const laPaid = yesNo("leaveAllowancePaid");
    if (ctx.period && startDate && structureLines.length && laPaid !== true) {
      const due = leaveAllowanceFor({ startDate, period: ctx.period, settings: ctx.settings, lines: structureLines });
      if (due)
        warn(
          "leaveAllowancePaid",
          `Leave allowance of ${fmtN(due.amount)} is due in ${ctx.period.label} under the company policy and will be paid. If the previous payroll already paid it this year, put Yes in “Leave allowance paid this year”.`,
        );
    }
    if (laPaid && leaveAllowanceOf(ctx.settings).mode === "none") warn("leaveAllowancePaid", "Leave allowance isn't paid through payroll (Payroll Settings) — nothing to skip.");

    // Reconciliation
    const expected: ExpectedFigures = { gross: optMoney("expGross"), paye: optMoney("expPaye"), pensionEmployee: optMoney("expPension"), nhf: optMoney("expNhf"), net: optMoney("expNet") };
    const hasExpected = Object.values(expected).some((v) => v !== undefined);

    if (errors.length) return { row, name: displayName || "(no name)", employeeNumber, errors, warnings, record: null };

    const id = ctx.ids?.[index] ?? hire?.id ?? `IMP-${slug(employeeNumber)}`;
    const employee: LocaleEmployee = {
      id,
      tenantId: ctx.bundle.tenant.id,
      employeeNumber,
      firstName,
      lastName,
      fullName,
      initials: `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase(),
      email,
      phone: text(get("phone")),
      departmentId: department!.id,
      departmentName: department!.name,
      jobTitle,
      grade: text(get("grade")) || undefined,
      employmentTypeId: type!.id,
      status: "active",
      startDate: startDate!,
      salary: { amount: round2(monthlyGross * 12), currency: "NGN", period: "annual" },
      managerId: null,
      dateOfBirth: dob ?? undefined,
      gender: gender ? (gender.startsWith("f") ? "female" : "male") : undefined,
      nationality: "Nigerian",
      address: { line1: text(get("address")), city: text(get("city")), region: state!, country: "Nigeria", type: "Home" },
      branchId: branch?.id,
      workLocation: branch?.name ?? (branchRaw || undefined),
      identifiers: { nin, bvn, tin, pensionId: rsaPin, nhfNumber: text(get("nhfNumber")) },
      bankDetails: { bankName, accountName, accountNumber },
      onboardingMethod: "bulk",
    };
    const structure: SalaryStructure = {
      id: `SS-${id}-1`,
      employeeId: id,
      effectiveFrom: startDate!,
      effectiveTo: null,
      currency: "NGN",
      lines: structureLines,
      reason: "Imported from the new starter template",
      approvedBy: ctx.importedBy,
      approvedAt: new Date().toISOString().slice(0, 10),
    };
    const profile: EmployeeTaxProfile = {
      employeeId: id,
      tin,
      stateOfResidence: state!,
      pfaCode: pfaFinal.code,
      pfaName: pfaFinal.name,
      rsaPin,
      nhfNumber: text(get("nhfNumber")),
      nhfEligible: nhfFlag ?? rule.nhf,
      nhisEnrolled,
      annualRentDeclared: annualRent,
      rentEvidence: annualRent ? { fileName: "Declared on the starter template", uploadedAt: new Date().toISOString().slice(0, 10) } : null,
      rentEvidenceVerified: !!annualRent && rentVerified === true,
      lifeAssurancePremiumAnnual: lifeAssurance,
      mortgageInterestAnnual: mortgageInterest,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      bvn,
      avc,
      leaveAllowancePaidYear: laPaid ? ctx.year : undefined,
    };
    return {
      row,
      name: displayName,
      employeeNumber,
      errors,
      warnings,
      record: {
        employee,
        structure,
        profile,
        recurring: recurring.map((r, i) => ({ ...r, id: `RDED-${id}-${i + 1}`, employeeId: id })),
        loan: loan ? { ...loan, id: `LOAN-${id}-BF`, employeeId: id } : null,
        opening,
        expected: hasExpected ? expected : null,
        newDepartment: department && department.id.startsWith("DEPT-IMP-") ? department : undefined,
      },
    };
  });

  return { rows, unknownColumns: unknown, fileErrors };
}


function sharesName(accountName: string, parts: string[]): boolean {
  const words = new Set(accountName.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1));
  return parts.filter(Boolean).some((p) => p.toLowerCase().split(/[^a-z]+/).some((w) => w.length > 1 && words.has(w)));
}

// ── The import batch ────────────────────────────────────────────────────────

export interface StarterImportBatch {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  employees: LocaleEmployee[];
  recurringDeductions: ImportedDeduction[];
  /** Loans brought forward (repayments recorded here as runs are finalized). Optional for imports saved before loans existed. */
  loans?: LocaleLoan[];
  departments: { id: string; name: string }[];
  /** employeeId → the previous payroll's figures for the first month. */
  expected: Record<string, ExpectedFigures>;
  /** The run the starters were added to on import, if any. */
  runId?: string;
}

export function toBatch(rows: StagedRow[], meta: { id: string; fileName: string; importedBy: string; runId?: string }) {
  const records = rows.map((r) => r.record).filter((r): r is StarterRecord => !!r);
  const departments = new Map<string, { id: string; name: string }>();
  for (const r of records) if (r.newDepartment) departments.set(r.newDepartment.id, r.newDepartment);
  const batch: StarterImportBatch = {
    id: meta.id,
    fileName: meta.fileName,
    importedAt: new Date().toISOString(),
    importedBy: meta.importedBy,
    employees: records.map((r) => r.employee),
    recurringDeductions: records.flatMap((r) => r.recurring),
    loans: records.flatMap((r) => (r.loan ? [r.loan] : [])),
    departments: [...departments.values()],
    expected: Object.fromEntries(records.filter((r) => r.expected).map((r) => [r.employee.id, r.expected!])),
    runId: meta.runId,
  };
  return {
    batch,
    structures: records.map((r) => r.structure),
    profiles: records.map((r) => r.profile),
    openingYtd: Object.fromEntries(records.filter((r) => r.opening).map((r) => [r.employee.id, r.opening!])),
  };
}

/**
 * The bundle payroll works from: the company's HR records plus everyone
 * imported through the starter template (who exist only in payroll until the
 * HR record sync lands with the backend).
 */
export function withImportedStaff<B extends LocaleBundle>(bundle: B, imports: StarterImportBatch[] | undefined): B {
  if (!imports?.length) return bundle;
  const rec = bundle as unknown as { recurringDeductions?: unknown[] };
  const known = new Set(bundle.departments.map((d) => d.id));
  const extraDepts = imports.flatMap((b) => b.departments).filter((d, i, all) => !known.has(d.id) && all.findIndex((x) => x.id === d.id) === i);
  return {
    ...bundle,
    employees: [...bundle.employees, ...imports.flatMap((b) => b.employees)],
    loans: [...(bundle.loans ?? []), ...imports.flatMap((b) => b.loans ?? [])],
    departments: [...bundle.departments, ...extraDepts.map((d) => ({ id: d.id, name: d.name, code: d.id.replace("DEPT-IMP-", ""), parentDepartmentId: null, headEmployeeId: null, costCenter: "" }))],
    recurringDeductions: [...(rec.recurringDeductions ?? []), ...imports.flatMap((b) => b.recurringDeductions)],
  } as B;
}

// ── Reconciliation ──────────────────────────────────────────────────────────

export const RECON_FIELDS = [
  { key: "gross", label: "Gross pay" },
  { key: "paye", label: "PAYE" },
  { key: "pensionEmployee", label: "Employee pension" },
  { key: "nhf", label: "NHF" },
  { key: "net", label: "Net pay" },
] as const;
export type ReconKey = (typeof RECON_FIELDS)[number]["key"];

/** Differences up to this (kobo rounding between systems) count as a match. */
export const RECON_TOLERANCE = 1;

export interface ReconRow {
  employeeId: string;
  employeeNumber: string;
  name: string;
  department: string;
  status: "match" | "variance" | "no_expected" | "not_in_run";
  /** A variance fully accounted for by a payroll rule (pro-rating, cumulative PAYE) — not an error. */
  explained?: boolean;
  figures: Record<ReconKey, { expected?: number; actual: number; diff?: number }>;
  explanations: string[];
}

export function reconcileBatch(batch: StarterImportBatch, run: PayrollRun | null | undefined, openingYtd: Record<string, YtdTotals>): ReconRow[] {
  return batch.employees.map((e) => {
    const re = run?.employees.find((x) => x.employeeId === e.id && x.included);
    const c = re?.computation;
    const exp = batch.expected[e.id];
    const line = (code: string) => round2((c?.lines ?? []).filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0));
    const actual: Record<ReconKey, number> = {
      gross: c?.gross ?? 0,
      paye: line("PAYE"),
      pensionEmployee: line("PENSION_EE"),
      nhf: line("NHF"),
      net: c?.net ?? 0,
    };
    const figures = Object.fromEntries(
      RECON_FIELDS.map(({ key }) => {
        const expected = exp?.[key];
        return [key, { expected, actual: actual[key], diff: expected === undefined ? undefined : round2(actual[key] - expected) }];
      }),
    ) as ReconRow["figures"];
    const base = { employeeId: e.id, employeeNumber: e.employeeNumber, name: e.fullName, department: e.departmentName, figures };
    if (!c) return { ...base, status: "not_in_run" as const, explanations: [run ? "Not in this run — check the start date and employment type." : "No open pay run to calculate."] };
    if (!exp) return { ...base, status: "no_expected" as const, explanations: [] };
    const off = RECON_FIELDS.filter(({ key }) => figures[key].diff !== undefined && Math.abs(figures[key].diff!) > RECON_TOLERANCE);
    if (!off.length) return { ...base, status: "match" as const, explanations: [] };

    const explanations: string[] = [];
    let explained = false;
    const period = run!.period;
    if (e.startDate > period.start) {
      explanations.push(`Joined ${e.startDate} — ${period.label} is pro-rated; the expected figures look like a full month.`);
      explained = true;
    }
    const lines = c.lines;
    const oneOffs = lines.filter((l) => l.category === "earning" && (l.code === "LEAVE_ALLOW" || l.source !== "auto"));
    if (oneOffs.length && off.some((f) => f.key === "gross"))
      explanations.push(`This month also pays ${oneOffs.map((l) => `${l.name} ${fmtN(l.amount)}`).join(", ")}.`);
    if (off.some((f) => f.key === "paye") && !off.some((f) => f.key === "gross")) {
      const opening = openingYtd[e.id];
      if (!opening && period.month > 1 && e.startDate >= `${period.year}-01-01`) {
        explanations.push(
          `First pay in ${period.year}: cumulative PAYE taxes what is actually earned this year, so the tax-free band covers ${period.month} months and PAYE is lower than a calculation that assumes 12 months' pay. Correct if this is their first job this year — if they were paid by another employer in ${period.year}, enter that pay and tax in the YTD columns.`,
        );
        explained = true;
      }
      else if (opening) explanations.push("PAYE catches up (or refunds) against the PAYE YTD brought forward — check PAYE YTD and Taxable pay YTD.");
      if (c.tax?.exemptReason) explanations.push(c.tax.exemptReason);
    }
    if (!explanations.length) explanations.push(`${off.map((f) => f.label).join(", ")} differ${off.length === 1 ? "s" : ""} — compare the salary lines and statutory settings with the previous payroll.`);
    return { ...base, status: "variance" as const, explained, explanations };
  });
}
