import type { LocaleEmployee } from "@/src/lib/types/locale";
import { TITLE_OPTIONS, titlesForGender } from "@/src/lib/constants/titles";
import {
  DEPARTMENTS,
  COUNTRY_NAMES,
  statesForCountry,
} from "@/src/config/system-data";

export type ProfileFieldType =
  | "text"
  | "date"
  | "select"
  | "tel"
  | "email"
  | "number"
  | "textarea"
  | "boolean";
export type ProfileFieldGroup =
  | "personal"
  | "contact"
  | "address"
  | "emergency"
  | "bank"
  | "identity"
  | "work"
  | "employment"
  | "compensation"
  | "offboarding"
  | "access"
  | "preferences";

export interface ProfileField {
  /** Dot-path on the LocaleEmployee (supports array index, e.g. emergencyContacts.0.name). */
  key: string;
  label: string;
  group: ProfileFieldGroup;
  type: ProfileFieldType;
  options?: string[];
  /**
   * Display labels for `options`, where the generic humaniser gets it wrong —
   * e.g. "full_time" is "Full-time", not "Full Time".
   */
  optionLabels?: Record<string, string>;
  /** True for values owned/derived by a system module — editing warns first. */
  system?: boolean;
  /** The system module that owns this value (shown in the warning). */
  source?: string;
}

export const PROFILE_GROUP_LABELS: Record<ProfileFieldGroup, string> = {
  personal: "Personal",
  contact: "Contact",
  address: "Address",
  emergency: "Emergency Contact",
  bank: "Bank Details",
  identity: "Identity Numbers",
  work: "Work Pattern",
  employment: "Employment (System-driven)",
  compensation: "Compensation",
  offboarding: "Offboarding",
  access: "Access",
  preferences: "Preferences",
};

export const PROFILE_GROUP_ORDER: ProfileFieldGroup[] = [
  "personal",
  "contact",
  "address",
  "emergency",
  "bank",
  "identity",
  "work",
  "employment",
  "compensation",
  "offboarding",
  "access",
  "preferences",
];

/** Identity-number key → friendly label (NG + UK). */
export const ID_LABELS: Record<string, string> = {
  nin: "National ID (NIN)",
  bvn: "Bank Verification Number (BVN)",
  tin: "Tax Identification (TIN)",
  pensionId: "Pension ID (PFA)",
  nhfNumber: "National Housing Fund (NHF)",
  passport: "International Passport",
  driversLicense: "Driver's Licence",
  drivingLicense: "Driving Licence",
  drivingLicence: "Driving Licence",
  nationalInsuranceNumber: "National Insurance No.",
  nationalInsurance: "National Insurance No.",
  ni: "National Insurance No.",
  nino: "National Insurance No.",
  utr: "Unique Taxpayer Ref (UTR)",
  taxCode: "Tax Code",
};

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const MARITAL_OPTIONS = ["Divorced", "Married", "Separated", "Single", "Widowed"];
const ETHNICITY_OPTIONS = [
  "Asian / Asian British",
  "Black / African / Caribbean / Black British",
  "Mixed / Multiple ethnic groups",
  "White",
  "Other ethnic group",
  "Prefer not to say",
];
const NATIONALITY_OPTIONS = [
  "Nigerian", "British", "Irish", "American", "Canadian", "Ghanaian", "Kenyan",
  "South African", "Indian", "Pakistani", "Bangladeshi", "Chinese", "Filipino",
  "French", "German", "Italian", "Spanish", "Portuguese", "Polish", "Romanian",
  "Dutch", "Belgian", "Australian", "New Zealander", "Brazilian", "Mexican",
  "Egyptian", "Moroccan", "Ethiopian", "Ugandan", "Tanzanian", "Zimbabwean",
  "Ivorian", "Senegalese", "Cameroonian", "Jamaican", "Other",
];
const ADDRESS_TYPE_OPTIONS = [
  "Home", "Dependant", "Forwarding", "Holiday", "Relations", "Weekday", "Weekend", "Work",
];
const EMPLOYEE_STATUS_OPTIONS = [
  "Active", "Closed", "Deceased-Death in Service", "Future Starter", "Leaver", "Rehire",
  "No Show", "Suspended", "LOA-Long Term Sick", "LOA-Jury Service", "LOA-Maternity",
  "LOA-Paternity", "LOA-Sabbatical", "LOA-Adoption", "Leaver-Dismissed", "Leaver-Redundant",
  "Leaver-Retired",
];
const REASON_FOR_LEAVING_OPTIONS = [
  "Conflict at work", "Made Redundant", "Reason not stated", "Required a change",
  "Summary dismissal", "Death in Service", "Career progression", "Better salary or benefits",
  "Relocation", "Work-life balance", "Further education", "Health reasons", "Retirement",
  "Change in career path", "Dissatisfaction with management", "End of contract/fixed-term",
  "Voluntary redundancy", "Misconduct", "Gross Misconduct", "Attendance issues",
];
const PROBATION_OPTIONS = ["Open", "Closed", "Failed"];
const YES_NO_OPTIONS = ["Yes", "No"];
const LANGUAGE_OPTIONS = [
  "(en-GB) English",
  "(en-US) English",
  "(fr) French",
  "(es) Spanish",
  "(de) German",
  "(pt) Portuguese",
  "(it) Italian",
  "(nl) Dutch",
  "(ru) Russian",
  "(ar) Arabic",
  "(zh-CN) Mandarin",
  "(hi) Hindi",
  "(bn) Bengali",
  "(ja) Japanese",
  "(ko) Korean",
  "(tr) Turkish",
  "(sw) Swahili",
];

const SCHEDULE_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const SCHEDULE_FIELDS: ProfileField[] = SCHEDULE_DAYS.flatMap((d) => [
  { key: `workPattern.schedule.${d}.start`, label: `${d.toUpperCase()} start`, group: "work" as const, type: "text" as const },
  { key: `workPattern.schedule.${d}.end`, label: `${d.toUpperCase()} end`, group: "work" as const, type: "text" as const },
]);

const STATIC_FIELDS: ProfileField[] = [
  // Options are narrowed to the employee's gender in getEmployeeProfileFields —
  // this list is the superset, for anything reading fields without a person.
  { key: "title", label: "Title", group: "personal", type: "select", options: [...TITLE_OPTIONS] },
  { key: "firstName", label: "Legal First Name", group: "personal", type: "text" },
  { key: "middleName", label: "Middle Name", group: "personal", type: "text" },
  { key: "lastName", label: "Legal Last Name", group: "personal", type: "text" },
  { key: "preferredName", label: "Preferred Name", group: "personal", type: "text" },
  { key: "maidenName", label: "Maiden Name", group: "personal", type: "text" },
  { key: "initials", label: "Initials", group: "personal", type: "text" },
  { key: "dateOfBirth", label: "Date of birth", group: "personal", type: "date" },
  { key: "gender", label: "Gender", group: "personal", type: "select", options: GENDER_OPTIONS },
  { key: "maritalStatus", label: "Marital status", group: "personal", type: "select", options: MARITAL_OPTIONS },
  { key: "nationality", label: "Nationality", group: "personal", type: "select", options: NATIONALITY_OPTIONS },
  { key: "ethnicity", label: "Ethnicity", group: "personal", type: "select", options: ETHNICITY_OPTIONS },

  { key: "email", label: "Work email", group: "contact", type: "email" },
  { key: "personalEmail", label: "Personal email", group: "contact", type: "email" },
  { key: "phone", label: "Phone", group: "contact", type: "tel" },

  // Addresses are generated per type in getEmployeeProfileFields (8 blocks).

  { key: "bankDetails.bankName", label: "Bank name", group: "bank", type: "text" },
  { key: "bankDetails.accountName", label: "Account name", group: "bank", type: "text" },
  { key: "bankDetails.accountNumber", label: "Account number", group: "bank", type: "text" },
  { key: "bankDetails.sortCode", label: "Sort code", group: "bank", type: "text" },

  { key: "workPattern.weeklyHours", label: "Weekly hours", group: "work", type: "number" },
  { key: "workPattern.daysPerWeek", label: "Working days per week", group: "work", type: "number" },
  { key: "workPattern.breakMinutes", label: "Unpaid break (minutes/day)", group: "work", type: "number" },
  { key: "workPattern.holidayEntitlementDays", label: "Holiday days", group: "work", type: "number" },
  { key: "workPattern.publicHolidayDays", label: "Public holidays", group: "work", type: "number" },
  { key: "workPattern.contractType", label: "Contract type", group: "work", type: "select", options: ["full_time", "part_time", "zero_hours"], optionLabels: { full_time: "Full-time", part_time: "Part-time", zero_hours: "Zero-hours" } },
  ...SCHEDULE_FIELDS,

  // Employment — system-driven (owned by org module) — editing warns first.
  { key: "employeeNumber", label: "Employee ID", group: "employment", type: "text", system: true, source: "Organization" },
  { key: "jobTitle", label: "Job title", group: "employment", type: "text", system: true, source: "Organization" },
  { key: "departmentName", label: "Department", group: "employment", type: "select", options: DEPARTMENTS, system: true, source: "Organization" },
  { key: "grade", label: "Grade", group: "employment", type: "text", system: true, source: "Organization" },
  { key: "level", label: "Level", group: "employment", type: "number", system: true, source: "Organization" },
  { key: "status", label: "Status", group: "employment", type: "select", options: EMPLOYEE_STATUS_OPTIONS, system: true, source: "Organization" },
  { key: "startDate", label: "Start date", group: "employment", type: "date", system: true, source: "Organization" },
  { key: "confirmationDate", label: "Confirmation date", group: "employment", type: "date", system: true, source: "Organization" },
  { key: "continuousServiceDate", label: "Continuous service / transfer date", group: "employment", type: "date", system: true, source: "Organization" },
  { key: "contractEndDate", label: "Contract end date", group: "employment", type: "date", system: true, source: "Organization" },
  { key: "probationStatus", label: "Probation status", group: "employment", type: "select", options: PROBATION_OPTIONS, system: true, source: "Organization" },
  { key: "probationEndDate", label: "Probationary end date", group: "employment", type: "date", system: true, source: "Organization" },
  { key: "workMode", label: "Work mode", group: "employment", type: "text", system: true, source: "Organization" },
  { key: "workLocation", label: "Work location", group: "employment", type: "text", system: true, source: "Organization" },
  { key: "employeeNoticePeriod", label: "Employee notice period", group: "employment", type: "text", system: true, source: "Organization" },
  { key: "employerNoticePeriod", label: "Employer notice period", group: "employment", type: "text", system: true, source: "Organization" },
  { key: "managerId", label: "Line manager (employee id)", group: "employment", type: "text", system: true, source: "Organization" },
  { key: "statePensionDate", label: "State pension date", group: "employment", type: "date", system: true, source: "Organization" },
  { key: "retirementDate", label: "Retirement date", group: "employment", type: "date", system: true, source: "Organization" },
  { key: "dateOfLeaving", label: "Date of leaving", group: "employment", type: "date", system: true, source: "Organization" },
  { key: "reasonForLeaving", label: "Reason for leaving", group: "employment", type: "select", options: REASON_FOR_LEAVING_OPTIONS, system: true, source: "Organization" },

  // Compensation — system-driven (owned by payroll)
  { key: "salary.amount", label: "Actual / Annual salary", group: "compensation", type: "number", system: true, source: "Payroll" },
  { key: "salaryEffectiveDate", label: "Effective date of annual salary", group: "compensation", type: "date", system: true, source: "Payroll" },
  { key: "pension.employeeContribution", label: "Employee pension contribution (%)", group: "compensation", type: "number", system: true, source: "Payroll" },
  { key: "pension.employerContribution", label: "Employer pension contribution (%)", group: "compensation", type: "number", system: true, source: "Payroll" },

  // Offboarding — system-driven (owned by HR)
  { key: "exitInterview", label: "HR exit interview", group: "offboarding", type: "select", options: YES_NO_OPTIONS, system: true, source: "HR" },
  { key: "exitInterviewDate", label: "Exit interview date", group: "offboarding", type: "date", system: true, source: "HR" },
  { key: "interviewer", label: "Interviewer", group: "offboarding", type: "text", system: true, source: "HR" },
  { key: "exitInterviewNotesUrl", label: "Interview notes (upload link)", group: "offboarding", type: "text", system: true, source: "HR" },

  // Access (system access level + security)
  { key: "accessLevelId", label: "Access level", group: "access", type: "text", system: true, source: "Access Control" },
  { key: "security.mfa", label: "Two-factor (MFA)", group: "access", type: "select", options: ["Enabled", "Disabled"] },

  // Preferences (self-service settings)
  { key: "preferences.notifications", label: "Notifications", group: "preferences", type: "select", options: ["Email + In-app", "Email only", "In-app only", "None"] },
  { key: "preferences.language", label: "Language", group: "preferences", type: "select", options: LANGUAGE_OPTIONS },
  { key: "preferences.timezone", label: "Timezone", group: "preferences", type: "text" },
  { key: "preferences.theme", label: "Theme", group: "preferences", type: "select", options: ["System", "Light", "Dark"] },
];

function labelFromKey(k: string): string {
  return k
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** UK addresses use "county"; everywhere else keeps "state / region". */
export function regionWordForCountry(country?: string | null): string {
  const c = (country ?? "").trim().toLowerCase();
  return c === "united kingdom" || c === "uk" || c === "gb"
    ? "county"
    : "state / region";
}

/** The full set of employee-provided, editable fields for an employee. */
export function getEmployeeProfileFields(emp: LocaleEmployee): ProfileField[] {
  const idFields: ProfileField[] = Object.keys(emp.identifiers ?? {}).map((k) => ({
    key: `identifiers.${k}`,
    label: ID_LABELS[k] ?? labelFromKey(k),
    group: "identity",
    type: "text",
  }));
  // One editable field-set per existing emergency contact, plus a spare slot to add one.
  const contactCount = (emp.emergencyContacts?.length ?? 0) + 1;
  const emergencyFields: ProfileField[] = [];
  for (let i = 0; i < contactCount; i++) {
    const n = contactCount > 1 ? ` ${i + 1}` : "";
    emergencyFields.push(
      { key: `emergencyContacts.${i}.name`, label: `Contact${n} name`, group: "emergency", type: "text" },
      { key: `emergencyContacts.${i}.relationship`, label: `Contact${n} relationship`, group: "emergency", type: "text" },
      { key: `emergencyContacts.${i}.phone`, label: `Contact${n} phone`, group: "emergency", type: "tel" },
    );
  }
  // Eight detailed address blocks (Home, Dependant, Forwarding, Holiday,
  // Relations, Weekday, Weekend, Work). State/Region is a dropdown that depends
  // on each block's own selected country.
  const addressFields: ProfileField[] = ADDRESS_TYPE_OPTIONS.flatMap((label) => {
    const slug = label.toLowerCase();
    const country = getFieldString(emp, `addresses.${slug}.country`);
    const states = statesForCountry(country);
    return [
      { key: `addresses.${slug}.line1`, label: `${label} address line 1`, group: "address", type: "text" },
      { key: `addresses.${slug}.line2`, label: `${label} address line 2`, group: "address", type: "text" },
      { key: `addresses.${slug}.city`, label: `${label} city`, group: "address", type: "text" },
      {
        key: `addresses.${slug}.region`,
        label: `${label} ${regionWordForCountry(country)}`,
        group: "address",
        type: states.length > 0 ? "select" : "text",
        ...(states.length > 0 ? { options: states } : {}),
      },
      { key: `addresses.${slug}.postalCode`, label: `${label} postal code`, group: "address", type: "text" },
      { key: `addresses.${slug}.country`, label: `${label} country`, group: "address", type: "select", options: COUNTRY_NAMES },
    ];
  });
  // The Title dropdown only offers what this person's gender and marital status
  // allow (plus the honorifics, which anyone can hold) — so "Mr" can't be picked
  // for a woman, nor "Miss" for a married one.
  const fields = STATIC_FIELDS.map((f) =>
    f.key === "title"
      ? { ...f, options: titlesForGender(emp.gender, emp.maritalStatus) }
      : f,
  );

  return [...fields, ...addressFields, ...emergencyFields, ...idFields];
}

/**
 * The field group a stored change-request key belongs to, derived from its dot
 * path. Used to badge tabs with their own pending-change counts without
 * rebuilding the full field list for an employee.
 */
export function profileFieldGroupOf(key: string): ProfileFieldGroup | null {
  if (key === "photoUrl") return null;
  if (key.startsWith("addresses.") || key.startsWith("address.")) return "address";
  if (key.startsWith("emergencyContacts.")) return "emergency";
  if (key.startsWith("identifiers.")) return "identity";
  if (key.startsWith("bankDetails.")) return "bank";
  if (key.startsWith("workPattern.")) return "work";
  return STATIC_FIELDS.find((f) => f.key === key)?.group ?? null;
}

// ── nested get / set by dot path (supports numeric array index) ─────────────
export function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, seg) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[seg];
  }, obj);
}

export function getFieldString(obj: unknown, path: string): string {
  const v = getByPath(obj, path);
  return v == null ? "" : String(v);
}

/** Mutates `obj` setting `path` to `value`, creating objects/arrays as needed. */
export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const segs = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    const nextIsIndex = /^\d+$/.test(segs[i + 1]);
    if (cur[seg] == null || typeof cur[seg] !== "object") {
      cur[seg] = nextIsIndex ? [] : {};
    }
    cur = cur[seg] as Record<string, unknown>;
  }
  cur[segs[segs.length - 1]] = value;
}
