// Reconciles every employee's title with their gender in the tenant locale
// fixtures. Titles were seeded at random, so male employees carried "Mrs" and
// vice versa. Idempotent — re-running changes nothing once clean.
//
// Honorifics (Dr, Prof, Rev) are earned, not gendered, so they are preserved
// whatever the employee's gender.
//
//   node scripts/fix-employee-titles.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR = join(__dirname, "..", "src", "data", "locale");
const FILES = ["nigeria.json", "uk.json"];

// Mirrors src/lib/constants/titles.ts — kept in sync by the assertion below.
const HONORIFICS = ["Dr", "Prof", "Rev"];
const MALE = ["Mr"];
const FEMALE = ["Ms", "Mrs", "Miss"];
const NEUTRAL = ["Mx"];

// Non-binary is a stated identity (Mx only); "prefer not to say" merely means
// unknown, so the permissive set still applies there.
function normalizeGender(gender) {
  const g = (gender ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!g) return "undisclosed";
  if (g.startsWith("f") || g === "woman") return "female";
  if (g === "non_binary" || g === "nonbinary" || g === "nb" || g === "mx") {
    return "non_binary";
  }
  if (g.startsWith("m")) return "male";
  return "undisclosed";
}

const isHonorific = (title) =>
  HONORIFICS.some((h) => h.toLowerCase() === (title ?? "").replace(/\.$/, "").trim().toLowerCase());

// Female titles encode marital status too: "Miss" is unmarried, "Mrs" married.
// A married Miss is a contradiction, not a preference.
function femaleTitlesFor(maritalStatus) {
  switch ((maritalStatus ?? "").trim().toLowerCase()) {
    case "married":
    case "separated":
    case "widowed":
      return ["Mrs", "Ms"];
    case "single":
      return ["Miss", "Ms"];
    case "divorced":
      return ["Ms", "Mrs", "Miss"];
    default:
      return FEMALE;
  }
}

function titlesForGender(gender, maritalStatus) {
  const g = normalizeGender(gender);
  const gendered =
    g === "male" ? MALE : g === "female" ? femaleTitlesFor(maritalStatus) : NEUTRAL;
  const extra =
    g === "undisclosed" ? [...MALE, ...femaleTitlesFor(maritalStatus)] : [];
  return [...gendered, ...extra, ...HONORIFICS];
}

function defaultTitle(gender, maritalStatus) {
  const g = normalizeGender(gender);
  if (g === "male") return "Mr";
  if (g === "female") {
    const m = (maritalStatus ?? "").trim().toLowerCase();
    if (m === "married" || m === "separated" || m === "widowed") return "Mrs";
    if (m === "single") return "Miss";
    return "Ms";
  }
  return "Mx";
}

function reconcile(title, gender, maritalStatus) {
  if (isHonorific(title)) return title;
  const valid = titlesForGender(gender, maritalStatus).some(
    (o) => o.toLowerCase() === (title ?? "").replace(/\.$/, "").trim().toLowerCase(),
  );
  if (title && valid) return title;
  return defaultTitle(gender, maritalStatus);
}

for (const file of FILES) {
  const path = join(LOCALE_DIR, file);
  const bundle = JSON.parse(readFileSync(path, "utf8"));

  let changed = 0;
  const before = {};
  const after = {};
  for (const emp of bundle.employees) {
    const next = reconcile(emp.title, emp.gender, emp.maritalStatus);
    before[emp.title ?? "(none)"] = (before[emp.title ?? "(none)"] ?? 0) + 1;
    after[next] = (after[next] ?? 0) + 1;
    if (next !== emp.title) {
      console.log(
        `  ${emp.id} ${emp.fullName} (${emp.gender}${
          emp.maritalStatus ? `, ${emp.maritalStatus}` : ""
        }): ${emp.title ?? "(none)"} → ${next}`,
      );
      emp.title = next;
      changed++;
    }
  }

  writeFileSync(path, `${JSON.stringify(bundle, null, 2)}\n`);
  console.log(`${file}: ${changed} of ${bundle.employees.length} titles corrected`);
  console.log(`  now: ${JSON.stringify(after)}\n`);
}
