// Seeds the Core HR data the "Change Request (1)" features read from, in both
// tenant locale fixtures:
//
//   · learning.courses        — issuing body (`provider`), `mandatory`, `validityMonths`,
//                               plus the CRS-101..103 courses certificates already cite
//   · learning.enrollments    — a mandatory-training enrolment for every current employee
//   · learning.certifications — issuing body + category on course certificates, spread
//                               expiries, and professional certifications (PMP, ACCA…)
//   · education, professionalMemberships, employeeLanguages, employeeSkills,
//     careerAspirations, loans — new per-employee collections
//   · employmentTypes[].benefits — what each engagement type is entitled to
//
// Deterministic and idempotent: generated rows carry a `-CHR-` id segment and
// are replaced on every run; existing rows are only patched. Expiry and due
// dates are anchored on the day the script runs, so the compliance cards show
// a realistic spread (some expired, some due in 30/60/90 days).
//
//   node scripts/augment-core-hr-fixtures.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR = join(__dirname, "..", "src", "data", "locale");
const FILES = [
  { file: "nigeria.json", country: "ng" },
  { file: "uk.json", country: "uk" },
];

// ── deterministic RNG (mulberry32), matching the other augment scripts ──────
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
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const iso = (d) => d.toISOString().slice(0, 10);
const TODAY = new Date(`${iso(new Date())}T00:00:00Z`);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const addMonths = (d, n) => {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
};
const pad = (n, w = 4) => String(n).padStart(w, "0");
const isGenerated = (r) => typeof r?.id === "string" && r.id.includes("-CHR-");

// ── courses: issuing bodies, mandatory flags, validity ──────────────────────
const COURSE_META = {
  "CRS-001": { ng: "NFIU / SCUML", uk: "FCA", mandatory: true, validityMonths: 12 },
  "CRS-002": { ng: "NDPC", uk: "ICO", mandatory: false, validityMonths: 24 },
  "CRS-003": { ng: "CIPM", uk: "CMI", mandatory: false, validityMonths: null },
  "CRS-004": { ng: "Toastmasters International", uk: "Toastmasters International", mandatory: false, validityMonths: null },
  "CRS-005": { ng: "Microsoft", uk: "Microsoft", mandatory: false, validityMonths: null },
  "CRS-006": { ng: "Microsoft", uk: "Microsoft", mandatory: false, validityMonths: null },
  "CRS-007": { ng: "CIPM", uk: "CIPD", mandatory: false, validityMonths: null },
  "CRS-008": { ng: "CompTIA", uk: "CompTIA", mandatory: true, validityMonths: 12 },
  "CRS-009": { ng: "PMI", uk: "APM", mandatory: false, validityMonths: 36 },
  "CRS-010": { ng: "ICAN", uk: "ICAEW", mandatory: false, validityMonths: null },
  "CRS-011": { ng: "Internal L&D", uk: "Internal L&D", mandatory: false, validityMonths: null },
  "CRS-012": { ng: "Internal L&D", uk: "Institute of Customer Service", mandatory: false, validityMonths: null },
  "CRS-101": { ng: "IOSH", uk: "IOSH", mandatory: true, validityMonths: 36 },
  "CRS-102": { ng: "NDPC", uk: "ICO", mandatory: true, validityMonths: 12 },
  "CRS-103": { ng: "CIPM", uk: "CMI", mandatory: false, validityMonths: null },
};
const EXTRA_COURSES = [
  { id: "CRS-101", title: "Health & Safety Fundamentals", category: "Compliance", duration: "3h", format: "online" },
  { id: "CRS-102", title: "Data Protection Essentials", category: "Compliance", duration: "1.5h", format: "online" },
  { id: "CRS-103", title: "Leadership Skills", category: "Leadership", duration: "6h", format: "blended" },
];
const MANDATORY = Object.entries(COURSE_META)
  .filter(([, m]) => m.mandatory)
  .map(([id]) => id);

// ── professional certification catalogue ────────────────────────────────────
// category: hr | finance | it | health_safety | project_management | compliance
const CERTS = {
  CIPM: { title: "CIPM Professional Member", body: "CIPM (Chartered Institute of Personnel Management)", category: "hr", years: 1 },
  CIPD: { title: "CIPD Level 7 Advanced Diploma", body: "CIPD", category: "hr", years: null },
  SHRM_CP: { title: "SHRM-CP", body: "SHRM", category: "hr", years: 3 },
  SHRM_SCP: { title: "SHRM-SCP", body: "SHRM", category: "hr", years: 3 },
  PHR: { title: "PHR (Professional in Human Resources)", body: "HRCI", category: "hr", years: 3 },
  ACCA: { title: "ACCA Qualification", body: "ACCA", category: "finance", years: 1 },
  ICAN: { title: "ICAN Chartered Accountant", body: "ICAN", category: "finance", years: 1 },
  ICAEW: { title: "ACA Chartered Accountant", body: "ICAEW", category: "finance", years: 1 },
  CPA: { title: "CPA", body: "AICPA", category: "finance", years: 2 },
  CFA: { title: "CFA Charterholder", body: "CFA Institute", category: "finance", years: 1 },
  AWS: { title: "AWS Certified Solutions Architect – Associate", body: "Amazon Web Services", category: "it", years: 3 },
  AZURE: { title: "Microsoft Certified: Azure Administrator Associate", body: "Microsoft", category: "it", years: 1 },
  CCNA: { title: "Cisco CCNA", body: "Cisco", category: "it", years: 3 },
  SECPLUS: { title: "CompTIA Security+", body: "CompTIA", category: "it", years: 3 },
  FIRST_AID: { title: "First Aid at Work", body: "__first_aid__", category: "health_safety", years: 3 },
  NEBOSH: { title: "NEBOSH National General Certificate", body: "NEBOSH", category: "health_safety", years: null },
  IOSH: { title: "IOSH Managing Safely", body: "IOSH", category: "health_safety", years: 3 },
  PMP: { title: "PMP (Project Management Professional)", body: "PMI", category: "project_management", years: 3 },
  PRINCE2: { title: "PRINCE2 Practitioner", body: "PeopleCert / AXELOS", category: "project_management", years: 3 },
  PSM: { title: "Professional Scrum Master I", body: "Scrum.org", category: "project_management", years: null },
  CAMS: { title: "CAMS (Certified Anti-Money Laundering Specialist)", body: "ACAMS", category: "compliance", years: 3 },
  ICA_AML: { title: "ICA International Diploma in AML", body: "ICA (International Compliance Association)", category: "compliance", years: null },
  GOOGLE_ADS: { title: "Google Ads Search Certification", body: "Google", category: "it", years: 1 },
  DRIVER_CPC: { title: "Driver CPC", body: "DVSA", category: "health_safety", years: 5 },
};

/** Which credentials fit a person, by department / title keywords. */
function certPoolFor(emp, country) {
  const d = `${emp.departmentName} ${emp.jobTitle}`.toLowerCase();
  const pools = [];
  if (/people|hr /.test(d) || /\bhr\b/.test(d)) pools.push(country === "ng" ? ["CIPM", "SHRM_CP", "PHR"] : ["CIPD", "SHRM_SCP", "PHR"]);
  if (/financ|account|payroll|treasury|cfo|chief financial/.test(d)) pools.push(country === "ng" ? ["ICAN", "ACCA", "CFA"] : ["ICAEW", "ACCA", "CPA"]);
  if (/engineer|devops|platform/.test(d)) pools.push(["AWS", "AZURE", "SECPLUS", "CCNA"]);
  if (/risk|compliance|aml/.test(d)) pools.push(["CAMS", "ICA_AML", "SECPLUS"]);
  if (/product|design/.test(d)) pools.push(["PSM", "PMP", "PRINCE2"]);
  if (/operations|fleet|logistic|warehouse|driver|route/.test(d)) pools.push(["NEBOSH", "IOSH", "FIRST_AID", ...(/driver/.test(d) ? ["DRIVER_CPC"] : [])]);
  if (/marketing|growth|sales/.test(d)) pools.push(["GOOGLE_ADS", "PSM"]);
  if (/support|customer|cx/.test(d)) pools.push(["FIRST_AID", "PSM"]);
  if (/executive|chief|vp|head/.test(d)) pools.push(["PMP", "PRINCE2"]);
  return [...new Set(pools.flat())];
}

// ── education / memberships / languages ────────────────────────────────────
const UNIS = {
  ng: ["University of Lagos", "Obafemi Awolowo University", "University of Nigeria, Nsukka", "Covenant University", "Ahmadu Bello University", "University of Ibadan", "Federal University of Technology, Akure"],
  uk: ["University of Manchester", "University of Leeds", "King's College London", "University of Bristol", "University of Edinburgh", "University of Birmingham", "University of Nottingham"],
};
const POSTGRAD = {
  ng: ["Lagos Business School", "University of Lagos", "University of Ibadan"],
  uk: ["London School of Economics", "Imperial College London", "Warwick Business School"],
};
const GRADES = {
  ng: ["First Class", "Second Class Upper", "Second Class Upper", "Second Class Lower"],
  uk: ["First Class Honours", "2:1", "2:1", "2:2"],
};
function fieldFor(emp) {
  const d = `${emp.departmentName} ${emp.jobTitle}`.toLowerCase();
  if (/engineer|devops|platform/.test(d)) return "Computer Science";
  if (/financ|account|payroll|treasury/.test(d)) return "Accounting";
  if (/people|hr/.test(d)) return "Human Resource Management";
  if (/risk|compliance|aml/.test(d)) return "Economics";
  if (/product|design/.test(d)) return /design/.test(d) ? "Graphic Design" : "Business Administration";
  if (/marketing|growth|sales/.test(d)) return "Marketing";
  if (/operations|fleet|logistic|warehouse|driver|route/.test(d)) return "Logistics & Supply Chain Management";
  if (/support|customer|cx/.test(d)) return "Mass Communication";
  return "Business Administration";
}
const MEMBERSHIP_BODIES = {
  ng: {
    hr: "Chartered Institute of Personnel Management of Nigeria (CIPM)",
    finance: "Institute of Chartered Accountants of Nigeria (ICAN)",
    it: "Nigeria Computer Society (NCS)",
    compliance: "Chartered Institute of Bankers of Nigeria (CIBN)",
    marketing: "Advertising Regulatory Council of Nigeria (ARCON)",
    general: "Nigerian Institute of Management (NIM)",
  },
  uk: {
    hr: "Chartered Institute of Personnel and Development (CIPD)",
    finance: "Institute of Chartered Accountants in England and Wales (ICAEW)",
    it: "BCS, The Chartered Institute for IT",
    compliance: "Institute of Risk Management (IRM)",
    marketing: "Chartered Institute of Marketing (CIM)",
    general: "Chartered Management Institute (CMI)",
    logistics: "Chartered Institute of Logistics and Transport (CILT)",
  },
};
function membershipAreaFor(emp) {
  const d = `${emp.departmentName} ${emp.jobTitle}`.toLowerCase();
  if (/people|hr/.test(d)) return "hr";
  if (/financ|account|payroll|treasury/.test(d)) return "finance";
  if (/engineer|devops|platform|product/.test(d)) return "it";
  if (/risk|compliance|aml/.test(d)) return "compliance";
  if (/marketing|growth|sales/.test(d)) return "marketing";
  if (/operations|fleet|logistic|warehouse|driver|route/.test(d)) return "logistics";
  return "general";
}
const LANGS = {
  ng: { native: ["Yoruba", "Igbo", "Hausa", "Edo", "Efik"], extra: ["French", "Arabic", "German"] },
  uk: { native: [], extra: ["French", "Spanish", "German", "Polish", "Punjabi", "Urdu", "Italian"] },
};

// ── skills & competencies ───────────────────────────────────────────────────
const SKILL_CATEGORY = {
  Leadership: "Leadership",
  Strategy: "Leadership",
  Fundraising: "Functional",
  Operations: "Functional",
  "Financial Planning": "Functional",
  Compliance: "Functional",
  "Backend Engineering": "Technical",
  "Frontend Engineering": "Technical",
  "Cloud Infrastructure": "Technical",
  "Agile Delivery": "Functional",
  "Data Analysis": "Technical",
  "UX Design": "Technical",
  "Product Strategy": "Functional",
  "Risk Management": "Functional",
  Recruitment: "Functional",
  "Digital Marketing": "Functional",
  "Customer Service": "Functional",
  Logistics: "Functional",
  "Health & Safety": "Functional",
  Sales: "Functional",
};
const EXTRA_SKILLS = ["Excel", "SQL", "Project Management", "Payroll", "Presentation Skills", "Negotiation"];
const COMPETENCIES = ["Communication", "Problem Solving", "Teamwork", "Stakeholder Management", "Leadership"];
/** Role-expected level (1–5) by seniority: exec L1 → 5, junior L6 → 2. */
const expectedFor = (lvl) => (lvl <= 2 ? 5 : lvl === 3 ? 4 : lvl === 4 ? 4 : 3);

const ASPIRATIONS = [
  { aspiration: "Move into people management", target: (e) => `${e.departmentName} Team Lead`, needs: "Leadership training, coaching" },
  { aspiration: "Deepen technical specialism", target: (e) => `Principal ${e.jobTitle.replace(/^(Senior|Junior) /, "")}`, needs: "Advanced certification, stretch projects" },
  { aspiration: "Progress to a senior role in current function", target: (e) => (/^Senior /.test(e.jobTitle) ? e.jobTitle.replace(/^Senior /, "Lead ") : `Senior ${e.jobTitle.replace(/^Junior /, "")}`), needs: "Mentoring, broader project exposure" },
  { aspiration: "Explore a move into another department", target: () => "Product Manager", needs: "Cross-functional secondment" },
  { aspiration: "Prepare for an executive role", target: (e) => (/Head of/.test(e.jobTitle) ? `Director, ${e.departmentName}` : `Head of ${e.departmentName}`), needs: "Executive education, board exposure" },
];

// ── loans ───────────────────────────────────────────────────────────────────
const LOAN_TYPES = {
  ng: [
    { type: "staff_loan", min: 500000, max: 3000000, months: [12, 18, 24], purpose: ["Rent renewal", "Car purchase", "Home renovation", "School fees"] },
    { type: "salary_advance", min: 100000, max: 400000, months: [1, 2, 3], purpose: ["Medical bills", "Family emergency", "School fees"] },
    { type: "cooperative_loan", min: 200000, max: 1500000, months: [6, 12], purpose: ["Business investment", "Rent renewal", "Wedding expenses"] },
    { type: "emergency_loan", min: 150000, max: 500000, months: [3, 6], purpose: ["Hospital bills", "Bereavement", "Urgent home repairs"] },
  ],
  uk: [
    { type: "season_ticket_loan", min: 1200, max: 5200, months: [10, 12], purpose: ["Annual rail season ticket", "Annual travelcard"] },
    { type: "employee_loan", min: 1000, max: 5000, months: [12, 18, 24], purpose: ["Home deposit top-up", "Car repairs", "Debt consolidation"] },
    { type: "salary_advance", min: 300, max: 1500, months: [1, 2, 3], purpose: ["Unexpected bill", "Family emergency", "Boiler repair"] },
  ],
};
const roundTo = (n, step) => Math.round(n / step) * step;

// ── employment-type benefits ────────────────────────────────────────────────
const TYPE_BENEFITS = {
  ng: {
    "ET-FT": ["HMO", "Pension", "Group Life Insurance", "NHF", "Leave Allowance", "13th Month"],
    "ET-PT": ["Pro-rated HMO", "Pension", "Pro-rated Leave Allowance"],
    "ET-CT": [],
    "ET-IN": ["Transport Allowance", "Meal Subsidy"],
    "ET-NYSC": ["Monthly Stipend", "Transport Allowance"],
    "ET-TEMP": [],
    "ET-FL": [],
    "ET-APP": ["Transport Allowance", "Training Sponsorship"],
    "ET-CAS": [],
    "ET-SEA": [],
    "ET-REM": ["HMO", "Pension", "Group Life Insurance", "NHF", "Remote & Data Stipend"],
  },
  uk: {
    "ET-FT": ["Workplace Pension", "Private Medical Insurance", "Life Assurance", "Income Protection", "Cycle to Work"],
    "ET-PT": ["Workplace Pension", "Pro-rated Benefits"],
    "ET-CT": [],
    "ET-IN": ["Travel Allowance"],
    "ET-AP": ["Workplace Pension", "Learning Sponsorship"],
    "ET-TEMP": ["Workplace Pension"],
    "ET-FL": [],
    "ET-CAS": [],
    "ET-SEA": ["Workplace Pension"],
    "ET-REM": ["Workplace Pension", "Private Medical Insurance", "Life Assurance", "Home Office Allowance"],
  },
};

// ────────────────────────────────────────────────────────────────────────────
for (const { file, country } of FILES) {
  const path = join(LOCALE_DIR, file);
  const bundle = JSON.parse(readFileSync(path, "utf8"));
  const prefix = country === "ng" ? "NG" : "GB";
  const currency = country === "ng" ? "NGN" : "GBP";
  const rngFor = (key) => makeRng(hashStr(`${country}:${key}`));
  const current = bundle.employees.filter((e) => e.status !== "terminated");

  // ── courses ──
  const learning = bundle.learning;
  for (const extra of EXTRA_COURSES) {
    if (!learning.courses.some((c) => c.id === extra.id)) learning.courses.push({ ...extra });
  }
  for (const c of learning.courses) {
    const meta = COURSE_META[c.id];
    if (!meta) continue;
    c.provider = meta[country];
    c.mandatory = meta.mandatory;
    c.validityMonths = meta.validityMonths;
  }
  const courseById = new Map(learning.courses.map((c) => [c.id, c]));

  // ── mandatory enrolments: every current employee on every mandatory course ──
  learning.enrollments = learning.enrollments.filter((e) => !isGenerated(e));
  let enr = 0;
  for (const emp of current) {
    for (const courseId of MANDATORY) {
      const rng = rngFor(`enr:${emp.id}:${courseId}`);
      const course = courseById.get(courseId);
      const existing = learning.enrollments.find((e) => e.employeeId === emp.id && e.courseId === courseId);
      // ~85% compliant; the rest are either in flight or overdue.
      const roll = rng();
      const completedAt = iso(addDays(TODAY, -int(rng, 20, 300)));
      const dueDate =
        roll < 0.85
          ? iso(addDays(TODAY, int(rng, 30, 200)))
          : roll < 0.93
            ? iso(addDays(TODAY, -int(rng, 5, 60))) // overdue
            : iso(addDays(TODAY, int(rng, 7, 45)));
      const patch =
        roll < 0.85
          ? { status: "completed", progress: 100, completedAt, score: int(rng, 72, 100) }
          : { status: "in_progress", progress: int(rng, 10, 80), completedAt: null };
      if (existing) {
        Object.assign(existing, patch, { dueDate, mandatory: true });
      } else {
        enr += 1;
        learning.enrollments.push({
          id: `${prefix}-CHR-ENR-${pad(enr)}`,
          employeeId: emp.id,
          courseId,
          courseTitle: course?.title ?? courseId,
          enrolledAt: iso(addDays(TODAY, -int(rng, 60, 330))),
          dueDate,
          mandatory: true,
          ...patch,
        });
      }
    }
  }

  // ── certifications ──
  learning.certifications = learning.certifications.filter((c) => !isGenerated(c));
  /** Spread expiries so the compliance cards have something in every band. */
  const expiryFor = (rng, validityYears, issuedAt) => {
    const roll = rng();
    if (roll < 0.1) return iso(addDays(TODAY, -int(rng, 3, 150))); // expired
    if (roll < 0.2) return iso(addDays(TODAY, int(rng, 2, 30))); // ≤30d
    if (roll < 0.3) return iso(addDays(TODAY, int(rng, 31, 60))); // ≤60d
    if (roll < 0.4) return iso(addDays(TODAY, int(rng, 61, 90))); // ≤90d
    const natural = validityYears ? addMonths(new Date(issuedAt), validityYears * 12) : null;
    return natural && natural > addDays(TODAY, 90) ? iso(natural) : iso(addDays(TODAY, int(rng, 120, 900)));
  };
  for (const c of learning.certifications) {
    const rng = rngFor(`cert:${c.id}`);
    const course = courseById.get(c.courseId);
    c.kind = "course";
    c.issuingBody = course?.provider ?? "Internal L&D";
    c.category = course?.mandatory ? "compliance" : "training";
    c.credentialId = `${c.issuingBody.split(/[\s/(]/)[0].toUpperCase()}-${hashStr(c.id) % 900000 + 100000}`;
    const validity = course?.validityMonths ?? null;
    c.expiresAt = validity ? expiryFor(rng, validity / 12, c.issuedAt) : null;
  }
  let certN = 0;
  for (const emp of bundle.employees) {
    const pool = certPoolFor(emp, country);
    if (pool.length === 0) continue;
    const rng = rngFor(`pcert:${emp.id}`);
    const count = rng() < 0.2 ? 0 : rng() < 0.6 ? 1 : 2;
    const chosen = [...pool].sort(() => rng() - 0.5).slice(0, count);
    for (const key of chosen) {
      const def = CERTS[key];
      certN += 1;
      const issuedAt = iso(addDays(TODAY, -int(rng, 120, 1400)));
      const body = def.body === "__first_aid__" ? (country === "ng" ? "Nigerian Red Cross Society" : "St John Ambulance") : def.body;
      learning.certifications.push({
        id: `${prefix}-CHR-CERT-${pad(certN)}`,
        employeeId: emp.id,
        courseId: null,
        kind: "professional",
        title: def.title,
        issuingBody: body,
        category: def.category,
        credentialId: `${key.replace(/_/g, "")}-${hashStr(emp.id + key) % 9000000 + 1000000}`,
        issuedAt,
        expiresAt: def.years ? expiryFor(rng, def.years, issuedAt) : null,
        certificateUrl: `/files/certs/${emp.id}-${key}.pdf`,
      });
    }
  }

  // ── education ──
  const education = [];
  let eduN = 0;
  for (const emp of bundle.employees) {
    const rng = rngFor(`edu:${emp.id}`);
    // A few profiles are left without education history, so the completion
    // score has real gaps to report.
    if (rng() < 0.15) continue;
    const birthYear = Number((emp.dateOfBirth ?? "1990").slice(0, 4));
    const gradYear = Math.max(birthYear + 21, 2000);
    eduN += 1;
    education.push({
      id: `${prefix}-CHR-EDU-${pad(eduN)}`,
      employeeId: emp.id,
      level: "Bachelor's",
      qualification: /Computer|Accounting|Economics|Logistics/.test(fieldFor(emp)) ? "BSc" : "BA",
      fieldOfStudy: fieldFor(emp),
      institution: pick(rng, UNIS[country]),
      grade: pick(rng, GRADES[country]),
      startYear: gradYear - (country === "ng" ? 4 : 3),
      endYear: Math.min(gradYear, TODAY.getUTCFullYear() - 1),
    });
    if (emp.level <= 3 && rng() < 0.6) {
      eduN += 1;
      const mba = rng() < 0.5;
      education.push({
        id: `${prefix}-CHR-EDU-${pad(eduN)}`,
        employeeId: emp.id,
        level: "Master's",
        qualification: mba ? "MBA" : "MSc",
        fieldOfStudy: mba ? "Business Administration" : fieldFor(emp),
        institution: pick(rng, POSTGRAD[country]),
        grade: mba ? "Merit" : "Distinction",
        startYear: Math.min(gradYear + 4, TODAY.getUTCFullYear() - 2),
        endYear: Math.min(gradYear + 5, TODAY.getUTCFullYear() - 1),
      });
    }
  }
  bundle.education = education;

  // ── professional memberships ──
  const memberships = [];
  let memN = 0;
  for (const emp of bundle.employees) {
    const rng = rngFor(`mem:${emp.id}`);
    if (rng() < 0.35) continue;
    const area = membershipAreaFor(emp);
    const body = MEMBERSHIP_BODIES[country][area] ?? MEMBERSHIP_BODIES[country].general;
    memN += 1;
    const renewal = rng() < 0.12 ? addDays(TODAY, -int(rng, 5, 90)) : addDays(TODAY, int(rng, 20, 360));
    memberships.push({
      id: `${prefix}-CHR-MEM-${pad(memN)}`,
      employeeId: emp.id,
      body,
      grade: emp.level <= 2 ? "Fellow" : emp.level <= 4 ? "Member" : "Associate",
      membershipNumber: `${body.match(/\(([^)]+)\)/)?.[1] ?? body.split(/[ ,]/)[0]}-${hashStr(emp.id + body) % 90000 + 10000}`,
      since: iso(addDays(TODAY, -int(rng, 365, 3000))),
      renewalDate: iso(renewal),
      status: renewal < TODAY ? "lapsed" : "active",
    });
  }
  bundle.professionalMemberships = memberships;

  // ── languages ──
  const languages = [];
  let langN = 0;
  for (const emp of bundle.employees) {
    const rng = rngFor(`lang:${emp.id}`);
    const push = (language, proficiency) => {
      langN += 1;
      languages.push({ id: `${prefix}-CHR-LANG-${pad(langN)}`, employeeId: emp.id, language, proficiency });
    };
    if (country === "ng") {
      push("English", "Fluent");
      push(pick(rng, LANGS.ng.native), "Native");
    } else {
      push("English", "Native");
    }
    if (rng() < 0.35) push(pick(rng, LANGS[country].extra), pick(rng, ["Conversational", "Basic", "Professional"]));
  }
  bundle.employeeLanguages = languages;

  // ── skills & competencies ──
  const skills = [];
  let skN = 0;
  for (const emp of bundle.employees) {
    const rng = rngFor(`skill:${emp.id}`);
    // Some profiles have no assessed skills yet — another completion gap.
    if (rng() < 0.1) continue;
    const expected = expectedFor(emp.level ?? 4);
    const own = [...(emp.skills ?? []), ...[...EXTRA_SKILLS].sort(() => rng() - 0.5).slice(0, 2)];
    for (const name of new Set(own)) {
      skN += 1;
      const required = (emp.skills ?? []).includes(name) ? expected : Math.max(2, expected - 2);
      skills.push({
        id: `${prefix}-CHR-SKL-${pad(skN)}`,
        employeeId: emp.id,
        name,
        type: "skill",
        category: SKILL_CATEGORY[name] ?? "Technical",
        level: Math.max(1, Math.min(5, required + int(rng, -2, 1))),
        requiredLevel: required,
        assessedBy: pick(rng, ["Self", "Line manager", "Line manager"]),
        lastAssessedAt: iso(addDays(TODAY, -int(rng, 10, 240))),
      });
    }
    for (const name of COMPETENCIES) {
      if (name === "Leadership" && (emp.level ?? 4) > 3) continue;
      skN += 1;
      const required = name === "Communication" || name === "Teamwork" ? Math.min(4, expected) : expected;
      skills.push({
        id: `${prefix}-CHR-SKL-${pad(skN)}`,
        employeeId: emp.id,
        name,
        type: "competency",
        category: "Behavioural",
        level: Math.max(1, Math.min(5, required + int(rng, -2, 1))),
        requiredLevel: required,
        assessedBy: "Line manager",
        lastAssessedAt: iso(addDays(TODAY, -int(rng, 10, 240))),
      });
    }
  }
  bundle.employeeSkills = skills;

  // ── career aspirations ──
  const aspirations = [];
  let aspN = 0;
  for (const emp of current) {
    const rng = rngFor(`asp:${emp.id}`);
    if (rng() < 0.2) continue;
    const a = pick(rng, (emp.level ?? 4) <= 2 ? [ASPIRATIONS[4], ASPIRATIONS[1]] : ASPIRATIONS.slice(0, 4));
    aspN += 1;
    aspirations.push({
      id: `${prefix}-CHR-ASP-${pad(aspN)}`,
      employeeId: emp.id,
      aspiration: a.aspiration,
      targetRole: a.target(emp),
      timeframe: pick(rng, ["Within 1 year", "1–2 years", "2–3 years", "3–5 years"]),
      mobility: pick(rng, ["Open to relocation", "Current location only", "Remote / hybrid only"]),
      developmentNeeds: a.needs,
      updatedAt: iso(addDays(TODAY, -int(rng, 10, 200))),
    });
  }
  bundle.careerAspirations = aspirations;

  // ── loans ──
  const approvers = bundle.employees.filter((e) => /people|hr/i.test(`${e.departmentName} ${e.jobTitle}`) && e.status !== "terminated");
  const loans = [];
  let loanN = 0;
  for (const emp of current) {
    const rng = rngFor(`loan:${emp.id}`);
    if (rng() < 0.4) continue;
    const def = pick(rng, LOAN_TYPES[country]);
    const step = country === "ng" ? 10000 : 50;
    const amount = roundTo(def.min + rng() * (def.max - def.min), step);
    const months = pick(rng, def.months);
    const monthly = Math.round((amount / months) * 100) / 100;
    const roll = rng();
    // Most are live; a couple each are pending approval, closed and defaulted.
    let status = "active";
    let issuedAt = addMonths(TODAY, -int(rng, 1, Math.max(1, months - 1)));
    if (roll < 0.12) status = "pending";
    else if (roll < 0.27) {
      status = "closed";
      issuedAt = addMonths(TODAY, -(months + int(rng, 1, 8)));
    } else if (roll < 0.35) {
      status = "defaulted";
      issuedAt = addMonths(TODAY, -int(rng, Math.max(2, Math.ceil(months / 2)), months + 2));
    }
    const elapsed = Math.max(0, Math.floor((TODAY - issuedAt) / (30.44 * 86400000)));
    const repaid =
      status === "closed"
        ? amount
        : status === "pending"
          ? 0
          : status === "defaulted"
            ? Math.round(monthly * Math.max(1, Math.floor(elapsed / 2)) * 100) / 100
            : Math.min(amount, Math.round(monthly * elapsed * 100) / 100);
    const approver = approvers.length ? pick(rng, approvers) : null;
    loanN += 1;
    loans.push({
      id: `${prefix}-CHR-LOAN-${pad(loanN)}`,
      employeeId: emp.id,
      loanType: def.type,
      amount,
      currency,
      purpose: pick(rng, def.purpose),
      repaymentMonths: months,
      monthlyRepayment: monthly,
      amountRepaid: Math.min(amount, repaid),
      requestedAt: iso(addDays(status === "pending" ? TODAY : issuedAt, -int(rng, 3, 14))),
      issuedAt: status === "pending" ? null : iso(issuedAt),
      status,
      approverId: status === "pending" ? null : approver?.id ?? null,
      interestRatePct: def.type === "season_ticket_loan" || def.type === "salary_advance" ? 0 : country === "ng" ? 5 : 0,
    });
  }
  // Every register should show each state at least once, so a small tenant
  // never demos with no pending request or no defaulted loan.
  const actives = loans.filter((l) => l.status === "active");
  if (!loans.some((l) => l.status === "pending") && actives.length > 1) {
    Object.assign(actives[actives.length - 1], {
      status: "pending",
      issuedAt: null,
      amountRepaid: 0,
      approverId: null,
      requestedAt: iso(addDays(TODAY, -3)),
    });
  }
  if (!loans.some((l) => l.status === "defaulted") && actives.length > 2) {
    const l = actives[0];
    l.status = "defaulted";
    l.amountRepaid = Math.round(l.monthlyRepayment * 100) / 100;
  }
  bundle.loans = loans;

  // ── employment types ──
  for (const t of bundle.employmentTypes) {
    t.benefits = TYPE_BENEFITS[country][t.id] ?? (t.eligibleForBenefits ? ["Pension"] : []);
  }

  bundle._meta.coreHrAugmentedAt = iso(TODAY);
  writeFileSync(path, JSON.stringify(bundle, null, 2) + "\n");
  console.log(
    `${file}: ${learning.courses.length} courses, ${learning.enrollments.length} enrolments, ${learning.certifications.length} certifications, ` +
      `${education.length} education, ${memberships.length} memberships, ${languages.length} languages, ${skills.length} skills, ` +
      `${aspirations.length} aspirations, ${loans.length} loans`,
  );
}
