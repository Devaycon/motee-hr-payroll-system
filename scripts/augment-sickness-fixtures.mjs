// Gives every employee a plausible sickness history in the tenant locale
// fixtures, so the Sickness & Absence module isn't empty (and its stat strip
// isn't all zeros) on most profiles. Deterministic and idempotent — re-running
// replaces only the rows this script generates, keyed by a `-SICK-` id segment.
//
// It also repairs the reasons on pre-existing Sick Leave rows: they carried
// annual-leave text ("Holiday abroad", "Wedding"), which `sicknessReasonCategory`
// can only classify as "Other" — the exact problem §17.8 set out to fix.
//
//   node scripts/augment-sickness-fixtures.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR = join(__dirname, "..", "src", "data", "locale");
const FILES = ["nigeria.json", "uk.json"];

// The module's summary counts the *current* year only, so records have to land
// in it or every profile reads "0 sick days".
const YEAR = new Date().getFullYear();
const SICK_POLICY_ID = "LP-02";

// ── deterministic RNG (mulberry32), matching augment-employee-fixtures ───────
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
const iso = (d) => d.toISOString().slice(0, 10);

/**
 * Free-text reasons that `sicknessReasonCategory` maps onto real clinical
 * groups, banded by absence length so the Reason column reads plausibly: nobody
 * takes nine days off for a dentist visit, or one day for surgery recovery.
 * Between them the bands cover every category, so the column shows a spread
 * rather than a wall of "Other".
 */
const REASONS_BY_LENGTH = {
  // 1–2 days: self-certified, mostly minor or appointment-driven.
  short: [
    "Migraine",
    "Heavy cold",
    "Doctor's appointment",
    "Hospital scan",
    "Dentist appointment",
    "Mental health / wellbeing day",
    "Sprained ankle",
  ],
  // 3–5 days: enough to need a return-to-work conversation.
  medium: [
    "Flu symptoms",
    "Chest infection and cough",
    "Recurring migraines",
    "Lower back pain",
    "Shoulder injury",
    "Stress-related absence",
  ],
  // 6+ days: fit-note territory.
  long: [
    "Chest infection and cough",
    "Post-operative recovery",
    "Surgery recovery",
    "Stress-related absence",
    "Lower back pain",
  ],
};

const reasonPool = (days) =>
  days >= 6
    ? REASONS_BY_LENGTH.long
    : days >= 3
      ? REASONS_BY_LENGTH.medium
      : REASONS_BY_LENGTH.short;

/** Weekday-safe start date inside `YEAR`, before today where possible. */
function startDateFor(rng) {
  // Bias into the first three quarters so the dates read as history.
  const dayOfYear = 10 + Math.floor(rng() * 250);
  const d = new Date(Date.UTC(YEAR, 0, 1));
  d.setUTCDate(d.getUTCDate() + dayOfYear);
  // Nudge weekends onto the following Monday.
  const dow = d.getUTCDay();
  if (dow === 6) d.setUTCDate(d.getUTCDate() + 2);
  if (dow === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function endDateFor(start, days) {
  const d = new Date(start);
  let added = 1;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

/**
 * An absence profile per employee, so the fixtures exercise every branch of the
 * module: self-certified vs fit note (>7 days), return-to-work interviews
 * (5+ days) both pending and completed, and all four Bradford Factor bands.
 *
 * Bradford is episodes² × days, so the band is driven far more by *frequency*
 * than by total days — the last two profiles are short, scattered absences,
 * which is exactly the pattern the score exists to surface.
 */
function episodeLengths(rng) {
  const roll = rng();
  if (roll < 0.3) return [1]; // Low — one short absence
  if (roll < 0.5) return [1, 2]; // Low
  if (roll < 0.68) return [2, 5]; // Low, one return-to-work interview
  if (roll < 0.82) return [1, 3, 6]; // Moderate, needs a fit note
  if (roll < 0.9) return [2, 9]; // Moderate, long-term absence
  if (roll < 0.96) return [1, 1, 2, 3, 5]; // High — frequent short absences
  return [1, 1, 2, 2, 4, 6]; // Very High — the pattern HR chases
}

for (const file of FILES) {
  const path = join(LOCALE_DIR, file);
  const bundle = JSON.parse(readFileSync(path, "utf8"));
  const prefix = bundle.employees[0]?.id.split("-")[0] ?? "XX";

  const isSick = (r) => /sick/i.test(r.leaveType ?? "");

  // Drop anything a previous run generated so this stays idempotent.
  const existing = (bundle.leaveRequests ?? []).filter(
    (r) => !r.id.includes("-SICK-"),
  );

  // Repair the reasons on hand-written sick rows.
  let repaired = 0;
  for (const r of existing) {
    if (!isSick(r)) continue;
    const rng = makeRng(hashStr(`${r.id}:reason`));
    const next = pick(rng, reasonPool(r.days ?? 1));
    if (r.reason !== next) {
      r.reason = next;
      repaired++;
    }
  }

  const generated = [];
  let seq = 1;
  for (const emp of bundle.employees) {
    const rng = makeRng(hashStr(`${emp.id}:sickness:${YEAR}`));
    for (const days of episodeLengths(rng)) {
      const start = startDateFor(rng);
      const end = endDateFor(start, days);
      const submitted = new Date(start);
      submitted.setUTCDate(submitted.getUTCDate() - 1);
      generated.push({
        id: `${prefix}-SICK-${String(seq++).padStart(4, "0")}`,
        employeeId: emp.id,
        leavePolicyId: SICK_POLICY_ID,
        leaveType: "Sick Leave",
        startDate: iso(start),
        endDate: iso(end),
        days,
        reason: pick(rng, reasonPool(days)),
        // Sickness is recorded after the fact, so it is effectively always
        // approved — a "pending" sick day the employee already took is noise.
        status: "approved",
        approverId: emp.managerId ?? null,
        submittedAt: `${iso(submitted)}T08:30:00Z`,
      });
    }
  }

  bundle.leaveRequests = [...existing, ...generated];
  writeFileSync(path, `${JSON.stringify(bundle, null, 2)}\n`);

  const covered = new Set(generated.map((r) => r.employeeId)).size;
  console.log(
    `${file}: ${generated.length} sickness records across ${covered}/${bundle.employees.length} employees` +
      `, ${repaired} existing reasons reclassified`,
  );
}
