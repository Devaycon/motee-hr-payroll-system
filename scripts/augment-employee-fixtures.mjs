// Augments the tenant locale fixtures (nigeria.json, uk.json) with the
// per-employee collections the Employee Detail page needs. Deterministic and
// idempotent — re-running replaces the generated keys. Run:
//   node scripts/augment-employee-fixtures.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR = join(__dirname, "..", "src", "data", "locale");
const FILES = ["nigeria.json", "uk.json"];

// ── deterministic RNG (mulberry32) ──────────────────────────────────────────
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const pad4 = (n) => String(n).padStart(4, "0");
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Country-aware document / KYC templates. optional → included ~50% of the time.
function docTemplates(isUK) {
  return isUK
    ? [
        { category: "identity", name: "Passport", kyc: true, expires: true, issuer: "HM Passport Office" },
        { category: "right_to_work", name: "Right to Work Share Code", kyc: true, expires: false, issuer: "Home Office" },
        { category: "right_to_work", name: "Biometric Residence Permit", kyc: true, expires: true, issuer: "Home Office", optional: true },
        { category: "identity", name: "Driving Licence", kyc: true, expires: true, issuer: "DVLA" },
        { category: "identity", name: "National Insurance Number Proof", kyc: true, expires: false, issuer: "HMRC" },
        { category: "proof_of_address", name: "Proof of Address — Utility Bill", kyc: true, expires: false },
        { category: "proof_of_address", name: "Proof of Address — Bank Statement", kyc: true, expires: false, optional: true },
        { category: "tax", name: "P45", kyc: false, expires: false, issuer: "HMRC", optional: true },
        { category: "tax", name: "P60", kyc: false, expires: false, issuer: "HMRC" },
        { category: "tax", name: "Starter Checklist (P46)", kyc: false, expires: false, issuer: "HMRC" },
        { category: "banking", name: "Bank Details Confirmation", kyc: false, expires: false },
        { category: "education", name: "Degree Certificate", kyc: false, expires: false },
        { category: "education", name: "Professional Certification", kyc: false, expires: true, optional: true },
        { category: "dbs", name: "DBS Certificate", kyc: false, expires: true, issuer: "DBS" },
        { category: "employment", name: "Signed Employment Contract", kyc: false, expires: false },
        { category: "employment", name: "Offer Letter", kyc: false, expires: false },
        { category: "employment", name: "Non-Disclosure Agreement", kyc: false, expires: false },
        { category: "pension", name: "Pension Auto-Enrolment Form", kyc: false, expires: false, issuer: "NEST" },
        { category: "reference", name: "Reference Letter", kyc: false, expires: false },
        { category: "photo", name: "Passport Photograph", kyc: true, expires: false },
      ]
    : [
        { category: "identity", name: "NIN Slip", kyc: true, expires: false, issuer: "NIMC" },
        { category: "identity", name: "International Passport", kyc: true, expires: true, issuer: "Nigeria Immigration Service" },
        { category: "identity", name: "Driver's Licence", kyc: true, expires: true, issuer: "FRSC" },
        { category: "identity", name: "Voter's Card", kyc: true, expires: false, issuer: "INEC", optional: true },
        { category: "banking", name: "BVN Confirmation", kyc: true, expires: false, issuer: "NIBSS" },
        { category: "proof_of_address", name: "Proof of Address — Utility Bill", kyc: true, expires: false },
        { category: "tax", name: "TIN Certificate", kyc: false, expires: false, issuer: "FIRS" },
        { category: "pension", name: "RSA PIN Statement", kyc: false, expires: false },
        { category: "pension", name: "Pension Enrolment Form", kyc: false, expires: false },
        { category: "pension", name: "NHF Registration", kyc: false, expires: false, optional: true },
        { category: "education", name: "WAEC/NECO Result", kyc: false, expires: false },
        { category: "education", name: "Degree Certificate", kyc: false, expires: false },
        { category: "education", name: "NYSC Discharge Certificate", kyc: false, expires: false },
        { category: "employment", name: "Offer Letter", kyc: false, expires: false },
        { category: "employment", name: "Signed Employment Contract", kyc: false, expires: false },
        { category: "employment", name: "Guarantor Form", kyc: false, expires: false },
        { category: "employment", name: "Employee Handbook Acknowledgement", kyc: false, expires: false, optional: true },
        { category: "medical", name: "Pre-Employment Medical Report", kyc: false, expires: false },
        { category: "reference", name: "Reference Letter", kyc: false, expires: false },
        { category: "identity", name: "Birth Certificate / Declaration of Age", kyc: true, expires: false, issuer: "NPC" },
        { category: "photo", name: "Passport Photograph", kyc: true, expires: false },
      ];
}

function build(rng) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const chance = (p) => rng() < p;
  const isoDaysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };
  const isoDaysFromNow = (days) => isoDaysAgo(-days);
  const addYears = (iso, yrs) => {
    const d = new Date(iso);
    d.setFullYear(d.getFullYear() + yrs);
    return d.toISOString().slice(0, 10);
  };
  return { pick, int, chance, isoDaysAgo, isoDaysFromNow, addYears };
}

function augment(tenantData) {
  const employees = tenantData.employees;
  const tenant = tenantData.tenant;
  const prefix = employees[0].id.split("-")[0]; // NG | UK
  const currency = tenantData.tenant.currency;
  const isUK = tenantData.tenant.countryCode === "GB";
  const depts = tenantData.departments.map((d) => d.name);
  const policies = tenantData.leavePolicies.map((p) => p.id);
  const hrPool = employees
    .filter(
      (e) =>
        /people|human|executive|hr/i.test(e.departmentName) ||
        (e.roleIds || []).some((r) => /ADMIN|HR/i.test(r)),
    )
    .map((e) => e.id);
  const hrId = () => (hrPool.length ? hrPool[0] : employees[0].id);
  const money = (small, big) => (isUK ? small : big);
  // Anchor "this month" to the bundle's reference date so the dashboard's
  // "Leavers This Month" card is stable regardless of when the demo is run.
  const refMonth = (tenantData._meta?.referenceDate ?? "2025-11-15").slice(0, 7);

  const templates = docTemplates(isUK);

  const out = {
    documents: [],
    leaveAdjustments: [],
    dbsChecks: [],
    disciplinaries: [],
    expenses: [],
    employmentHistory: [],
    locationBookings: [],
    medicalFacts: [],
    employeeNotes: [],
    payHistory: [],
    recurringDeductions: [],
    oneTimePayments: [],
    oneTimeDeductions: [],
  };
  const ctr = {};
  const nextId = (kind) => {
    ctr[kind] = (ctr[kind] || 0) + 1;
    return `${prefix}-${kind}-${pad4(ctr[kind])}`;
  };

  for (let empIndex = 0; empIndex < employees.length; empIndex++) {
    const emp = employees[empIndex];
    const rng = build(makeRng(hashStr(emp.id)));
    const { pick, int, chance, isoDaysAgo, isoDaysFromNow, addYears } = rng;
    const mgr = emp.managerId || hrId();

    // documents — country-aware KYC + employment document set
    const startBase = new Date(emp.startDate);
    const uploadedFor = (offset) => {
      const d = new Date(startBase);
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10) + "T09:00:00Z";
    };
    for (const t of templates) {
      if (t.optional && !chance(0.5)) continue;
      const expiresAt = t.expires ? isoDaysFromNow(pick([-90, 40, 200, 400, 800])) : null;
      const expired = expiresAt != null && new Date(expiresAt) < new Date();
      const status = expired
        ? "expired"
        : chance(0.08)
          ? "rejected"
          : chance(0.18)
            ? "pending"
            : "verified";
      out.documents.push({
        id: nextId("DOC"),
        employeeId: emp.id,
        category: t.category,
        name: `${emp.fullName} — ${t.name}`,
        kyc: !!t.kyc,
        status,
        issuer: t.issuer ?? null,
        fileUrl: `/files/docs/${emp.id}-${slugify(t.name)}.pdf`,
        uploadedAt: uploadedFor(int(0, 90)),
        expiresAt,
        visibility: "hr_and_self",
      });
    }

    // workPattern — weeklyHours/daysPerWeek are DERIVED from the schedule minus
    // the unpaid break so the figures on screen can never contradict each other
    // (client feedback round 2, §A1).
    const partTime = chance(0.12);
    // UK contracts carry an unpaid hour for lunch; the NG 09:00–17:00 day does not.
    const breakMinutes = isUK ? 60 : 0;
    const dayEnd = isUK ? "17:30" : "17:00";
    const schedule = {
      mon: partTime ? { start: "09:00", end: "15:30" } : { start: "09:00", end: dayEnd },
      tue: { start: "09:00", end: dayEnd },
      wed: { start: "09:00", end: dayEnd },
      thu: partTime ? null : { start: "09:00", end: dayEnd },
      fri: partTime ? null : { start: "09:00", end: dayEnd },
      sat: null,
      sun: null,
    };
    const toMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + (m || 0);
    };
    const workedDays = Object.values(schedule).filter(Boolean);
    const weeklyHours =
      Math.round(
        (workedDays.reduce(
          (sum, s) => sum + Math.max(0, toMin(s.end) - toMin(s.start) - breakMinutes),
          0,
        ) /
          60) *
          10,
      ) / 10;
    emp.workPattern = {
      weeklyHours,
      daysPerWeek: workedDays.length,
      schedule,
      breakMinutes,
      holidayEntitlementDays: isUK ? 25 : 20,
      publicHolidayDays: 8,
      publicHolidayTreatment: "in_addition",
      contractType: partTime ? "part_time" : "full_time",
    };

    // emergencyContacts (keep single emergencyContact as primary)
    const primary = emp.emergencyContact || {
      name: "Next of Kin",
      relationship: "family",
      phone: emp.phone,
    };
    emp.emergencyContacts = [{ ...primary, isPrimary: true }];
    if (chance(0.4)) {
      emp.emergencyContacts.push({
        name: pick(["Aisha", "Daniel", "Grace", "Samuel", "Mary", "Tunde"]) + " " + emp.lastName,
        relationship: pick(["spouse", "sibling", "friend", "parent"]),
        phone: emp.phone.replace(/\d{2}$/, String(int(10, 99))),
        isPrimary: false,
      });
    }

    // ── P1 scalar fields (every employee, no blanks) ────────────────────────
    const female = /female|f/i.test(emp.gender || "");
    emp.title = female ? pick(["Mrs", "Ms", "Miss", "Dr"]) : pick(["Mr", "Dr", "Mr", "Mr"]);
    emp.middleName = pick(
      isUK
        ? ["James", "Louise", "Grace", "Edward", "Marie", "John", "Anne", "Paul"]
        : ["Chidi", "Ife", "Ada", "Emeka", "Ngozi", "Tunde", "Bola", "Uche"],
    );
    emp.preferredName = emp.firstName;
    emp.maidenName = pick(
      isUK
        ? ["Hughes", "Clarke", "Bennett", "Hughes", "Wright", "Cooper"]
        : ["Okafor", "Balogun", "Eze", "Adeyemi", "Nwosu", "Bello"],
    );
    emp.ethnicity = isUK
      ? pick([
          "White",
          "White",
          "Asian / Asian British",
          "Black / African / Caribbean / Black British",
          "Mixed / Multiple ethnic groups",
          "Other ethnic group",
        ])
      : "Black / African / Caribbean / Black British";
    emp.personalEmail = `${(emp.firstName || "user").toLowerCase()}.${(emp.lastName || "x").toLowerCase()}@${pick(["gmail.com", "outlook.com", "yahoo.com"])}`;

    // Address backfill
    emp.address = emp.address || {};
    emp.address.type = "Home";
    if (!emp.address.region)
      emp.address.region = isUK
        ? pick(["Greater London", "West Midlands", "Greater Manchester", "Merseyside", "West Yorkshire"])
        : pick(["Lagos", "Abuja FCT", "Rivers", "Oyo", "Kano", "Enugu"]);
    if (!emp.address.postalCode)
      emp.address.postalCode = isUK
        ? `${pick(["EC1", "SW1", "M1", "B2", "LS1"])} ${int(1, 9)}${pick(["AA", "BD", "JQ", "RR"])}`
        : String(int(100001, 999999));

    // Employment
    const senior = (emp.level ?? 5) <= 3;
    emp.employeeNoticePeriod = senior ? "3 months" : pick(["1 month", "1 month", "2 weeks"]);
    emp.employerNoticePeriod = senior ? "3 months" : "1 month";
    emp.confirmationDate = addYears(emp.startDate, 0).replace(/-\d{2}-/, "-07-");
    emp.continuousServiceDate = emp.startDate;
    emp.contractEndDate = addYears(emp.startDate, int(2, 4));
    emp.probationStatus = pick(["Closed", "Closed", "Closed", "Open", "Failed"]);
    emp.probationEndDate = (() => {
      const d = new Date(emp.startDate);
      d.setMonth(d.getMonth() + int(3, 6));
      return d.toISOString().slice(0, 10);
    })();
    if (emp.dateOfBirth) {
      emp.statePensionDate = addYears(emp.dateOfBirth, 67);
      emp.retirementDate = addYears(emp.dateOfBirth, 65);
    } else {
      emp.statePensionDate = "2050-01-01";
      emp.retirementDate = "2048-01-01";
    }
    emp.reasonForLeaving = pick([
      "Reason not stated", "Career progression", "Better salary or benefits", "Relocation",
      "Work-life balance", "Retirement", "End of contract/fixed-term",
    ]);
    // Seed ~2 employees per tenant as actual leavers within the reference month
    // so the "Leavers This Month" dashboard card is non-zero and truthful.
    if (empIndex < 2) {
      emp.status = pick(["resigned", "terminated"]);
      emp.dateOfLeaving = `${refMonth}-${pad4(int(3, 26)).slice(-2)}`;
    } else {
      emp.dateOfLeaving = isoDaysFromNow(int(120, 700));
    }

    // Compensation
    emp.salaryEffectiveDate = `${new Date().getFullYear()}-01-01`;
    emp.pension = {
      employeeContribution: isUK ? pick([5, 5, 8, 4]) : pick([8, 8, 7.5]),
      employerContribution: isUK ? pick([3, 5, 6]) : pick([10, 10, 8]),
    };

    // Offboarding
    emp.exitInterview = pick(["No", "No", "Yes"]);
    emp.exitInterviewDate = isoDaysAgo(int(30, 400));
    emp.interviewer = employees.find((e) => e.id === hrId())?.fullName || "HR Team";
    emp.exitInterviewNotesUrl = `/files/exit/${emp.id}.pdf`;

    // Access / preferences
    emp.security = { mfa: pick(["Enabled", "Enabled", "Disabled"]) };
    emp.preferences = {
      notifications: pick(["Email + In-app", "Email + In-app", "Email only", "In-app only"]),
      language: tenant.locale || (isUK ? "en-GB" : "en-NG"),
      timezone: tenant.timezone || (isUK ? "Europe/London" : "Africa/Lagos"),
      theme: pick(["System", "System", "Light", "Dark"]),
    };

    // ── Compensation pay items (1–2 each) ───────────────────────────────────
    const payAmt = (small, big) => (isUK ? int(small[0], small[1]) : int(big[0], big[1]));
    {
      const recurring = [
        { label: "Pension AVC", freq: "monthly" },
        { label: "Union dues", freq: "monthly" },
        { label: "Staff loan repayment", freq: "monthly" },
        { label: "Gym membership", freq: "monthly" },
      ];
      for (let i = 0, n = int(1, 2); i < n; i++) {
        const r = recurring[(hashStr(emp.id) + i) % recurring.length];
        out.recurringDeductions.push({
          id: nextId("RDED"),
          employeeId: emp.id,
          label: r.label,
          amount: payAmt([20, 250], [5000, 60000]),
          currency,
          frequency: r.freq,
          startDate: isoDaysAgo(int(60, 600)),
        });
      }
      const payments = ["Performance bonus", "Referral bonus", "Overtime", "Project completion award"];
      for (let i = 0, n = int(1, 2); i < n; i++) {
        out.oneTimePayments.push({
          id: nextId("OTP"),
          employeeId: emp.id,
          label: payments[(hashStr(emp.id) + i) % payments.length],
          amount: payAmt([200, 2500], [50000, 800000]),
          currency,
          date: isoDaysAgo(int(20, 360)),
        });
      }
      const deductions = ["Salary advance recovery", "Equipment cost", "Parking fine", "Overpayment recovery"];
      for (let i = 0, n = int(1, 2); i < n; i++) {
        out.oneTimeDeductions.push({
          id: nextId("OTD"),
          employeeId: emp.id,
          label: deductions[(hashStr(emp.id) + i) % deductions.length],
          amount: payAmt([30, 600], [8000, 150000]),
          currency,
          date: isoDaysAgo(int(20, 360)),
        });
      }
    }

    // leaveAdjustments (0-3)
    const adjReasons = ["Carry-over from previous year", "TOIL credit", "Manual correction", "Long-service bonus days", "Unpaid leave deduction"];
    for (let i = 0, n = int(0, 3); i < n; i++) {
      out.leaveAdjustments.push({
        id: nextId("ADJ"),
        employeeId: emp.id,
        policyId: chance(0.7) ? "LP-01" : pick(policies),
        delta: chance(0.7) ? int(1, 5) : -int(1, 3),
        reason: pick(adjReasons),
        addedBy: hrId(),
        date: isoDaysAgo(int(20, 320)),
      });
    }

    // dbsChecks (1)
    {
      const issued = isoDaysAgo(int(120, 900));
      const expiry = addYears(issued, 3);
      const expired = new Date(expiry) < new Date();
      out.dbsChecks.push({
        id: nextId("DBS"),
        employeeId: emp.id,
        kind: isUK ? "dbs" : "background_check",
        type: isUK ? pick(["Basic", "Standard", "Enhanced"]) : "Police Clearance Certificate",
        certificateNumber: `${isUK ? "DBS" : "PCC"}-${int(100000, 999999)}`,
        issuedDate: issued,
        expiryDate: expiry,
        status: expired ? "expired" : chance(0.1) ? "pending" : "clear",
      });
    }

    // disciplinaries (mostly 0)
    if (chance(0.25)) {
      for (let i = 0, n = int(1, 2); i < n; i++) {
        const type = pick(["verbal_warning", "written_warning", "final_warning"]);
        out.disciplinaries.push({
          id: nextId("DISC"),
          employeeId: emp.id,
          date: isoDaysAgo(int(40, 500)),
          type,
          reason: pick(["Repeated lateness", "Policy breach", "Unauthorised absence", "Conduct during meeting"]),
          issuedBy: mgr,
          status: pick(["active", "expired", "withdrawn"]),
          outcome: pick(["Verbal counselling given", "Improvement plan agreed", "Warning recorded on file"]),
          documentUrl: `/files/disciplinary/${emp.id}-${pad4(i + 1)}.pdf`,
        });
      }
    }

    // expenses (4-8)
    const expCats = ["travel", "meals", "equipment", "other"];
    for (let i = 0, n = int(4, 8); i < n; i++) {
      const cat = pick(expCats);
      const amount =
        cat === "equipment" ? money(int(120, 900), int(45000, 350000)) : money(int(8, 220), int(3000, 90000));
      out.expenses.push({
        id: nextId("EXP"),
        employeeId: emp.id,
        date: isoDaysAgo(int(5, 200)),
        category: cat,
        amount,
        currency,
        description: pick({
          travel: ["Client visit mileage", "Train to HQ", "Airport taxi", "Conference travel"],
          meals: ["Team lunch", "Client dinner", "Working-late meal"],
          equipment: ["Monitor", "Ergonomic chair", "Headset", "Keyboard"],
          other: ["Software subscription", "Stationery", "Course materials"],
        }[cat]),
        status: pick(["submitted", "approved", "approved", "reimbursed", "rejected"]),
        receiptUrl: `/files/expenses/${emp.id}-${pad4(i + 1)}.pdf`,
        approverId: mgr,
      });
    }

    // employmentHistory (3-6) — starts with hire
    out.employmentHistory.push({
      id: nextId("EH"),
      employeeId: emp.id,
      date: emp.startDate,
      type: "hired",
      from: null,
      to: emp.jobTitle,
      reason: "Joined the company",
      actorId: hrId(),
    });
    for (let i = 0, n = int(2, 5); i < n; i++) {
      const type = pick(["role_change", "salary_change", "department_change", "promotion", "probation_passed"]);
      let from = null,
        to = null;
      if (type === "department_change") {
        from = pick(depts);
        to = emp.departmentName;
      } else if (type === "salary_change") {
        from = money("£" + int(28, 55) + "k", "₦" + int(6, 18) + "M");
        to = money("£" + int(56, 90) + "k", "₦" + int(19, 30) + "M");
      } else if (type === "role_change" || type === "promotion") {
        from = pick(["Associate", "Officer", "Analyst", "Specialist"]);
        to = emp.jobTitle;
      }
      out.employmentHistory.push({
        id: nextId("EH"),
        employeeId: emp.id,
        date: isoDaysAgo(int(60, 1400)),
        type,
        from,
        to,
        reason: pick(["Annual review outcome", "Org restructure", "Performance-based", "Probation completed"]),
        actorId: mgr,
      });
    }

    // locationBookings (5-10)
    const locTypes = ["desk", "meeting_room", "parking"];
    for (let i = 0, n = int(5, 10); i < n; i++) {
      const lt = pick(locTypes);
      const sh = int(8, 14);
      out.locationBookings.push({
        id: nextId("LB"),
        employeeId: emp.id,
        locationType: lt,
        locationName:
          lt === "desk" ? `Desk ${int(1, 9)}${pick(["A", "B", "C"])}` : lt === "meeting_room" ? pick(["Boardroom", "Focus Room 1", "Huddle 3"]) : `Bay ${int(1, 40)}`,
        date: isoDaysAgo(int(-10, 20)),
        startTime: `${String(sh).padStart(2, "0")}:00`,
        endTime: `${String(sh + int(1, 4)).padStart(2, "0")}:00`,
        status: chance(0.85) ? "confirmed" : "cancelled",
        notes: chance(0.3) ? "Recurring weekly" : "",
      });
    }

    // medicalFacts (1)
    out.medicalFacts.push({
      employeeId: emp.id,
      allergies: chance(0.4) ? pick([["Penicillin"], ["Peanuts"], ["Pollen", "Dust"]]) : [],
      conditions: chance(0.3) ? pick([["Asthma"], ["Hypertension"], ["Type 2 Diabetes"]]) : [],
      medications: chance(0.25) ? pick([["Salbutamol inhaler"], ["Metformin"]]) : [],
      dietaryRequirements: chance(0.35) ? pick([["Vegetarian"], ["Halal"], ["Gluten-free"]]) : [],
      accessibilityNeeds: chance(0.15) ? pick(["Step-free access", "Screen-reader software", "Adjustable desk"]) : "",
      doctorContact: {
        name: `Dr. ${pick(["Bello", "Okafor", "Smith", "Patel", "Adeyemi"])}`,
        phone: emp.phone.replace(/\d{3}$/, String(int(100, 999))),
        practice: isUK ? pick(["Riverside Surgery", "Oakwood Medical Centre"]) : pick(["Lagoon Hospital", "Reddington Clinic"]),
      },
    });

    // employeeNotes (1-3)
    for (let i = 0, n = int(1, 3); i < n; i++) {
      const isReminder = chance(0.4);
      out.employeeNotes.push({
        id: nextId("NOTE"),
        employeeId: emp.id,
        authorId: hrId(),
        body: isReminder
          ? pick(["Follow up on probation review", "Renew DBS check", "Confirm updated bank details"])
          : pick(["Strong performer this cycle", "Requested flexible hours", "Mentoring two juniors"]),
        createdAt: isoDaysAgo(int(5, 180)) + "T10:00:00Z",
        pinned: chance(0.2),
        type: isReminder ? "reminder" : "note",
        remindAt: isReminder ? rng.isoDaysAgo(-int(3, 45)) : null,
        visibility: chance(0.7) ? "hr_only" : "manager_and_hr",
      });
    }

    // payHistory (2-4) — chronological, ending at current salary
    {
      const current = emp.salary?.amount ?? money(45000, 6000000);
      const n = int(2, 4);
      let amt = current;
      const events = [];
      for (let i = 0; i < n; i++) {
        const prev = Math.round(amt * (0.85 - rng.int(0, 8) / 100));
        events.push({
          id: "",
          employeeId: emp.id,
          effectiveDate: isoDaysAgo(int(60, 1500)),
          previousAmount: prev,
          newAmount: amt,
          currency,
          changeType: i === 0 ? pick(["raise", "promotion"]) : pick(["raise", "adjustment", "bonus", "promotion"]),
          reason: pick(["Annual increment", "Promotion", "Market adjustment", "Performance bonus"]),
          approvedBy: hrId(),
        });
        amt = prev;
      }
      events
        .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
        .forEach((e) => {
          e.id = nextId("PAY");
          out.payHistory.push(e);
        });
    }
  }

  Object.assign(tenantData, out);
  return tenantData;
}

for (const file of FILES) {
  const path = join(LOCALE_DIR, file);
  const data = JSON.parse(readFileSync(path, "utf8"));
  augment(data);
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(
    `${file}: ${data.documents.length} docs, +${data.leaveAdjustments.length} adj, ${data.dbsChecks.length} dbs, ${data.disciplinaries.length} disc, ${data.expenses.length} exp, ${data.employmentHistory.length} hist, ${data.locationBookings.length} bookings, ${data.medicalFacts.length} medical, ${data.employeeNotes.length} notes, ${data.payHistory.length} pay; workPattern on ${data.employees.filter((e) => e.workPattern).length}/${data.employees.length}`,
  );
}
