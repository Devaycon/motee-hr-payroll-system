// Promotes the company's sites to a first-class `branches` collection on the
// tenant locale fixtures (nigeria.json, uk.json) and gives every employee a
// `branchId`. Deterministic and idempotent — re-running rebuilds both. Run:
//   node scripts/seed-branches.mjs
//
// Reconciliation, in order of authority:
//   1. companyProfile.headquarters        -> the "<city> HQ" branch
//   2. companyProfile.branches[]          -> one branch each (snake_case postal_code normalised)
//   3. leftover employee.workLocation set -> "<city> Office", so nobody is left
//      without a branch (the fixtures list six work locations but only two
//      branches, which is the gap this closes).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR = join(__dirname, "..", "src", "data", "locale");
const FILES = ["nigeria.json", "uk.json"];

const pad4 = (n) => String(n).padStart(4, "0");
const norm = (s) => (s ?? "").trim().toLowerCase();
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** "Port Harcourt" -> "PHA", "Lagos" -> "LAG". Deduped by the caller. */
function branchCode(city, taken) {
  const letters = city.replace(/[^A-Za-z]/g, "").toUpperCase();
  const words = city.split(/\s+/).filter(Boolean);
  let base =
    words.length > 1
      ? words.map((w) => w[0]).join("").toUpperCase() +
        (words[words.length - 1][1] ?? "").toUpperCase()
      : letters.slice(0, 3);
  base = base.slice(0, 4) || "BR";
  let code = base;
  let n = 2;
  while (taken.has(code)) code = `${base}${n++}`;
  taken.add(code);
  return code;
}

/**
 * The branch head: the most senior person on site. Level is the honest signal
 * where the fixtures carry one; otherwise whoever has no line manager.
 */
function pickManager(staff) {
  if (staff.length === 0) return null;
  const withLevel = staff.filter((e) => typeof e.level === "number");
  if (withLevel.length) {
    return withLevel.reduce((a, b) => (b.level < a.level ? b : a)).id;
  }
  const rootless = staff.find((e) => !e.managerId);
  return (rootless ?? staff[0]).id;
}

function seed(bundle, file) {
  const prefix = (bundle.employees[0]?.id ?? "XX-EMP-0001").split("-")[0];
  const tenantId = bundle.tenant.id;
  const profile = bundle.companyProfile ?? {};
  const hq = profile.headquarters ?? {};
  const country = hq.country ?? bundle.tenant.country;
  const timezone = bundle.tenant.timezone;
  const emailDomain = (profile.supportEmail ?? "").split("@")[1] ?? null;

  const branches = [];
  const codes = new Set();
  const byCity = new Map();

  const add = (b) => {
    const city = b.city;
    const id = `${prefix}-BR-${pad4(branches.length + 1)}`;
    const code = branchCode(city, codes);
    const branch = {
      id,
      tenantId,
      name: b.name,
      code,
      kind: b.kind,
      status: "active",
      addressLines: b.addressLines ?? [],
      city,
      region: b.region ?? "",
      postalCode: b.postalCode ?? "",
      country,
      timezone,
      phone: b.phone ?? "",
      email: emailDomain ? `${slugify(city)}@${emailDomain}` : "",
      managerEmployeeId: null,
      headcountTarget: 0,
      openedAt: "",
    };
    branches.push(branch);
    byCity.set(norm(city), branch);
    return branch;
  };

  // 1. Head office.
  if (hq.city) {
    add({
      name: `${hq.city} HQ`,
      kind: "headquarters",
      addressLines: hq.addressLines ?? [],
      city: hq.city,
      region: hq.region,
      postalCode: hq.postalCode,
      phone: profile.phone,
    });
  }

  // 2. Named branches already listed on the company profile.
  for (const b of profile.branches ?? []) {
    if (!b?.city || byCity.has(norm(b.city))) continue;
    add({
      name: b.name ?? `${b.city} Office`,
      kind: "branch",
      city: b.city,
      region: b.region,
      // The profile block uses snake_case here and camelCase everywhere else.
      postalCode: b.postalCode ?? b.postal_code,
    });
  }

  // 3. Work locations with nowhere to belong. Without this step every employee
  //    outside a listed branch would vanish the moment a branch is selected.
  for (const emp of bundle.employees) {
    const loc = (emp.workLocation ?? "").trim();
    if (!loc || byCity.has(norm(loc))) continue;
    const remote = /^remote$/i.test(loc);
    add({
      name: remote ? "Remote" : `${loc} Office`,
      kind: remote ? "remote" : "branch",
      city: loc,
    });
  }

  const fallback = branches[0] ?? null;

  // Point every employee at a branch and re-denormalise workLocation to the
  // branch name, so the display-only readers that predate branches agree.
  for (const emp of bundle.employees) {
    const match = byCity.get(norm(emp.workLocation)) ?? fallback;
    if (!match) continue;
    emp.branchId = match.id;
    emp.workLocation = match.name;
  }

  // Derived fields that need the assignment to have happened first.
  for (const branch of branches) {
    const staff = bundle.employees.filter((e) => e.branchId === branch.id);
    branch.managerEmployeeId = pickManager(staff);
    branch.headcountTarget = Math.max(5, Math.ceil(staff.length / 5) * 5);
    const earliest = staff
      .map((e) => e.startDate)
      .filter(Boolean)
      .sort()[0];
    branch.openedAt =
      branch.kind === "headquarters"
        ? (bundle.tenant.createdAt ?? "").slice(0, 10)
        : (earliest ?? (bundle.tenant.createdAt ?? "").slice(0, 10));
  }

  // Rebuild the object so `branches` sits next to companyProfile, matching the
  // key order LocaleBundle declares.
  const out = {};
  for (const [key, value] of Object.entries(bundle)) {
    if (key === "branches") continue;
    out[key] = value;
    if (key === "companyProfile") out.branches = branches;
  }
  if (!out.branches) out.branches = branches;

  const unassigned = bundle.employees.filter((e) => !e.branchId);
  console.log(
    `${file}: ${branches.length} branches — ` +
      branches
        .map((b) => `${b.name} (${b.code}, ${bundle.employees.filter((e) => e.branchId === b.id).length})`)
        .join(", "),
  );
  if (unassigned.length) {
    console.error(
      `  !! ${unassigned.length}/${bundle.employees.length} employees have no branchId: ${unassigned
        .map((e) => e.id)
        .join(", ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`  ok: all ${bundle.employees.length} employees assigned`);
  }

  return out;
}

for (const file of FILES) {
  const path = join(LOCALE_DIR, file);
  const data = JSON.parse(readFileSync(path, "utf8"));
  const next = seed(data, file);
  writeFileSync(path, JSON.stringify(next, null, 2) + "\n", "utf8");
}
