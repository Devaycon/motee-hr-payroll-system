/**
 * Enrich the locale demo data so Reports & Analytics charts look busy and
 * well-distributed. Deterministic (seeded from _meta.seed) and idempotent:
 * thin top-level arrays are REBUILT to fixed sizes and dates are recomputed
 * from index, so re-running yields the same result (never doubles).
 *
 * Touches only top-level report datasets in src/data/locale/{nigeria,uk}.json:
 *   offboarding, grievances, disciplinaries, performance.reviews,
 *   leaveRequests (redistribute), recruitment.candidates (redistribute),
 *   and re-dates ~10 employees' startDate into the last 12 months.
 *
 * Usage: node scripts/enrich-report-data.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILES = ["src/data/locale/nigeria.json", "src/data/locale/uk.json"];

// ── deterministic RNG ───────────────────────────────────────────────────────
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── date helpers ────────────────────────────────────────────────────────────
const pad2 = (n) => String(n).padStart(2, "0");
const pad4 = (n) => String(n).padStart(4, "0");
const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** A date `monthsAgo` months before the reference date, on `day` of month. */
function monthsAgo(ref, months, day) {
  const d = new Date(ref.getFullYear(), ref.getMonth() - months, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

/** Spread index i across the last 12 months (1..12 back), deterministic day. */
function spreadIso(ref, i, rand) {
  const months = (i % 12) + 1; // 1..12 months back → guarantees every bucket
  const day = 1 + Math.floor(rand() * 27);
  return iso(monthsAgo(ref, months, day));
}

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const weighted = (rand, pairs) => {
  // pairs: [value, weight][]
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of pairs) {
    if ((r -= w) <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
};

// ── enrichment ──────────────────────────────────────────────────────────────
function enrich(data) {
  const seed = Number(data?._meta?.seed ?? 42);
  const refDate = new Date(data?._meta?.referenceDate ?? "2025-11-15");
  const rand = mulberry32(seed + 7);

  const employees = Array.isArray(data.employees) ? data.employees : [];
  const empIds = employees.map((e) => e.id);
  const empNames = employees.map((e) => e.fullName).filter(Boolean);
  const tok = (empIds[0] || "NG-EMP-0001").split("-")[0]; // "NG" | "UK"
  const peopleDept = employees.find((e) => e.departmentId === "DEPT-PEOPLE");
  const hrId = peopleDept?.id ?? empIds[empIds.length - 1] ?? null;

  // 1. Offboarding ──────────────────────────────────────────────
  const OFF_REASONS = [
    "resigned",
    "better_opportunity",
    "relocation",
    "redundancy",
    "retired",
    "end_of_contract",
    "career_change",
    "work_life_balance",
    "health",
  ];
  const CLEARANCE_KEYS = ["it", "finance", "manager", "hr"];
  data.offboarding = Array.from({ length: 26 }, (_, i) => {
    const done = 1 + Math.floor(rand() * 4); // 1..4 keys completed
    const clearance = {};
    CLEARANCE_KEYS.forEach((k, idx) => {
      clearance[k] = idx < done ? "completed" : "in_progress";
    });
    const lastDay = spreadIso(refDate, i, rand);
    return {
      id: `${tok}-OFB-${pad4(i + 1)}`,
      employeeName: empNames.length ? pick(rand, empNames) : `Employee ${i + 1}`,
      lastDay,
      reason: OFF_REASONS[i % OFF_REASONS.length],
      clearance,
      exitInterview: {
        completedAt: iso(addDays(new Date(lastDay), 14)),
        wouldRecommend: rand() < 0.65,
        primaryReason: pick(rand, ["Compensation", "Career growth", "Management", "Personal", "Workload"]),
      },
    };
  });

  // 2. Grievances ───────────────────────────────────────────────
  const GRV_CATEGORIES = [
    "Discrimination",
    "Harassment",
    "Workload",
    "Pay & Benefits",
    "Management",
    "Bullying",
    "Working Conditions",
    "Health & Safety",
  ];
  const GRV_SEVERITY = ["low", "medium", "high", "critical"];
  const GRV_STATUS = ["open", "investigating", "resolved", "closed"];
  data.grievances = Array.from({ length: 26 }, (_, i) => {
    const status = GRV_STATUS[i % GRV_STATUS.length];
    return {
      id: `${tok}-GRV-${pad4(i + 1)}`,
      raisedBy: rand() < 0.4 ? "anonymous" : (empIds.length ? pick(rand, empIds) : "anonymous"),
      category: GRV_CATEGORIES[i % GRV_CATEGORIES.length],
      severity: weighted(rand, [["low", 3], ["medium", 4], ["high", 3], ["critical", 1]]),
      status,
      assignedTo: hrId,
      openedAt: spreadIso(refDate, i, rand),
      summary: "Confidential grievance case — details restricted to HR.",
      resolution: status === "resolved" || status === "closed" ? "Resolved after review." : null,
    };
  });

  // 3. Disciplinaries ───────────────────────────────────────────
  const DISC_TYPES = ["verbal_warning", "written_warning", "final_warning", "suspension", "dismissal"];
  const DISC_STATUS = ["active", "expired", "withdrawn", "resolved"];
  const DISC_REASONS = [
    "Unauthorised absence",
    "Late arrival",
    "Policy breach",
    "Misconduct",
    "Performance concern",
    "Insubordination",
    "Safety violation",
    "Inappropriate conduct",
  ];
  const DISC_OUTCOMES = [
    "Improvement plan agreed",
    "Verbal counselling given",
    "Warning recorded",
    "Final written warning issued",
    "Case withdrawn",
    "Suspension served",
  ];
  data.disciplinaries = Array.from({ length: 24 }, (_, i) => {
    const employeeId = empIds.length ? empIds[i % empIds.length] : `${tok}-EMP-0001`;
    return {
      id: `${tok}-DISC-${pad4(i + 1)}`,
      employeeId,
      date: spreadIso(refDate, i, rand),
      type: DISC_TYPES[i % DISC_TYPES.length],
      reason: pick(rand, DISC_REASONS),
      issuedBy: hrId ?? employeeId,
      status: DISC_STATUS[(i + 1) % DISC_STATUS.length],
      outcome: pick(rand, DISC_OUTCOMES),
      documentUrl: `/files/disciplinary/${employeeId}-${pad4(i + 1)}.pdf`,
    };
  });

  // 4. Performance — 3 cycles × employees ───────────────────────
  if (data.performance && typeof data.performance === "object") {
    const CYCLES = [
      { id: "RC-2024-H1", completedAt: iso(monthsAgo(refDate, 18, 28)) },
      { id: "RC-2024-H2", completedAt: iso(monthsAgo(refDate, 12, 28)) },
      { id: "RC-2025-H1", completedAt: iso(monthsAgo(refDate, 5, 28)) },
    ];
    const reviews = [];
    let n = 0;
    for (const cycle of CYCLES) {
      for (const emp of employees) {
        n += 1;
        const calibrated = weighted(rand, [[2, 1], [3, 3], [4, 4], [5, 2]]);
        const self = Math.min(5, Math.max(1, calibrated + (rand() < 0.5 ? 1 : 0)));
        const manager = Math.min(5, Math.max(1, calibrated + (rand() < 0.3 ? -1 : 0)));
        reviews.push({
          id: `${tok}-REV-${pad4(n)}`,
          employeeId: emp.id,
          cycleId: cycle.id,
          selfRating: self,
          managerRating: manager,
          calibratedRating: calibrated,
          summary: "Performance review summary for the cycle.",
          completedAt: cycle.completedAt,
        });
      }
    }
    data.performance.reviews = reviews;

    // Spread goal statuses for a fuller "Goal Status" donut, if goals exist.
    if (Array.isArray(data.performance.goals)) {
      const GOAL_STATUS = ["on_track", "at_risk", "completed", "overdue"];
      data.performance.goals = data.performance.goals.map((g, i) => ({
        ...g,
        status: GOAL_STATUS[i % GOAL_STATUS.length],
      }));
    }
  }

  // 5. Leave requests — redistribute type + dates ───────────────
  const policies = Array.isArray(data.leavePolicies) ? data.leavePolicies : [];
  if (Array.isArray(data.leaveRequests) && policies.length) {
    // Weighted round-robin covering every policy, skewed to Annual/Sick.
    const weightFor = (name) =>
      /annual/i.test(name) ? 4 : /sick/i.test(name) ? 4 : /compassion/i.test(name) ? 2 : 1;
    const bag = [];
    policies.forEach((p) => {
      for (let k = 0; k < weightFor(p.name); k += 1) bag.push(p);
    });
    data.leaveRequests = data.leaveRequests.map((l, i) => {
      const policy = bag[i % bag.length];
      const start = new Date(spreadIso(refDate, i, rand));
      const days = Math.max(1, Number(l.days) || 1);
      return {
        ...l,
        leavePolicyId: policy.id,
        leaveType: policy.name,
        startDate: iso(start),
        endDate: iso(addDays(start, days - 1)),
      };
    });
  }

  // 6. Recruitment — spread appliedAt + ratings ─────────────────
  const rec = data.recruitment;
  if (rec && Array.isArray(rec.candidates)) {
    rec.candidates = rec.candidates.map((c, i) => {
      const appliedAt = spreadIso(refDate, i, rand);
      let rating = null;
      if (c.stage && c.stage !== "applied") {
        if (c.stage === "hired") rating = weighted(rand, [[4, 2], [5, 3]]);
        else if (c.stage === "rejected") rating = weighted(rand, [[1, 2], [2, 3], [3, 1]]);
        else rating = weighted(rand, [[2, 1], [3, 3], [4, 3], [5, 1]]);
      }
      return { ...c, appliedAt, rating };
    });
  }

  // 7. Employees — re-date ~10 active employees into the last 12 months ──
  const actives = employees.filter((e) => e.status === "active").slice(0, 10);
  actives.forEach((e, i) => {
    const months = (i % 11) + 1; // 1..11 months ago, distributed
    const start = monthsAgo(refDate, months, 5 + ((i * 7) % 20));
    const startIso = iso(start);
    e.startDate = startIso;
    if ("continuousServiceDate" in e) e.continuousServiceDate = startIso;
    if ("confirmationDate" in e) e.confirmationDate = iso(addDays(start, 75));
  });

  // 8. Employees — seed 8 detailed addresses (Home, Work, …) per employee ──
  const STREETS = [
    "High Street",
    "Church Lane",
    "Victoria Road",
    "Station Road",
    "Park Avenue",
    "Market Street",
    "Kingsway",
    "Queen's Road",
    "Mill Lane",
    "Acacia Avenue",
  ];
  const ADDRESS_TYPES = [
    ["home", "Home"],
    ["dependant", "Dependant"],
    ["forwarding", "Forwarding"],
    ["holiday", "Holiday"],
    ["relations", "Relations"],
    ["weekday", "Weekday"],
    ["weekend", "Weekend"],
    ["work", "Work"],
  ];
  for (const e of employees) {
    const base = e.address ?? {};
    const addresses = {};
    for (const [slug, label] of ADDRESS_TYPES) {
      addresses[slug] = {
        type: label,
        line1:
          slug === "home" && base.line1
            ? base.line1
            : `${1 + Math.floor(rand() * 220)} ${pick(rand, STREETS)}`,
        line2: "",
        city: slug === "work" ? e.workLocation || base.city || "" : base.city || "",
        region: base.region || "",
        postalCode: base.postalCode || `${10000 + Math.floor(rand() * 89999)}`,
        country: base.country || "",
      };
    }
    e.addresses = addresses;
  }

  return data;
}

// ── run ─────────────────────────────────────────────────────────────────────
for (const file of FILES) {
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    console.warn(`  ! skip (not found): ${file}`);
    continue;
  }
  const data = JSON.parse(raw);
  enrich(data);
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(
    `${file}: offboarding=${data.offboarding?.length ?? 0}, grievances=${data.grievances?.length ?? 0}, ` +
      `disciplinaries=${data.disciplinaries?.length ?? 0}, reviews=${data.performance?.reviews?.length ?? 0}`,
  );
}
