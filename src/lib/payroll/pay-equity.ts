import type { LocaleEmployee } from "@/src/lib/types/locale";
import { round2 } from "./ng/engine";
import { structureOn } from "./run-builder";
import type { PayrollRun, SalaryStructure } from "./types";

/**
 * Pay Equity & Salary Intelligence (client feedback B9, Nov 2026).
 *
 * Compares annual fixed pay (salary structure × 12) by department, grade,
 * gender, job family, length of service, location and salary band, and finds
 * gender gaps (overall and like-for-like within a grade), band breaches,
 * compression, inversion and unexplained spreads.
 *
 * Controls against misleading conclusions:
 * - groups smaller than `minGroup` are never shown or compared (suppressed);
 * - gender is compared like for like — within a grade and job family — as
 *   well as overall, and the overall gap is labelled as unadjusted;
 * - a difference with an approved, documented explanation is shown as
 *   explained, not raised as an alert.
 */

export interface SalaryBand {
  grade: string;
  /** Annual fixed pay. */
  min: number;
  max: number;
}

export interface EquityExplanation {
  id: string;
  employeeId: string;
  /** The finding it explains (e.g. "above_band", "inversion"). */
  kind: FindingKind;
  note: string;
  by: string;
  byId?: string;
  at: string;
  approvedBy?: string;
  approvedById?: string;
  approvedAt?: string;
}

export type Dimension = "department" | "grade" | "gender" | "jobFamily" | "service" | "location" | "band";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  department: "Department",
  grade: "Job grade",
  gender: "Gender",
  jobFamily: "Job family",
  service: "Length of service",
  location: "Location",
  band: "Salary band position",
};

export interface EquityPerson {
  employeeId: string;
  name: string;
  employeeNumber: string;
  gender: string;
  grade: string;
  department: string;
  jobFamily: string;
  jobTitle: string;
  location: string;
  serviceYears: number;
  service: string;
  annual: number;
  band: SalaryBand | null;
  /** annual ÷ band midpoint. */
  compaRatio: number | null;
  bandStatus: "below" | "within" | "above" | "no_band";
  /** Salary structure versions, oldest first. */
  history: { from: string; annual: number; reason?: string; approvedBy?: string }[];
}

export type FindingKind = "below_band" | "above_band" | "compression" | "inversion" | "grade_inversion" | "gender_gap" | "unexplained_spread";

export const FINDING_LABELS: Record<FindingKind, string> = {
  below_band: "Below the approved range",
  above_band: "Above the approved range",
  compression: "Pay compression",
  inversion: "Pay inversion",
  grade_inversion: "Grade inversion",
  gender_gap: "Like-for-like gender gap",
  unexplained_spread: "Unexplained difference",
};

export interface Finding {
  id: string;
  kind: FindingKind;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  employeeIds: string[];
  /** Annual cost to resolve, where there is an obvious remedy (e.g. raise to band minimum). */
  costToFix?: number;
  explained?: EquityExplanation;
}

export interface GroupStat {
  group: string;
  count: number;
  /** Fewer than `minGroup` people: figures withheld. */
  suppressed: boolean;
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  /** Women's median vs men's median within the group, % of men's (null when either side is too small). */
  genderGapPct: number | null;
}

export interface EquityReport {
  asOf: string;
  minGroup: number;
  people: EquityPerson[];
  overall: { count: number; average: number; median: number; p10: number; p90: number };
  /** Unadjusted gender gap: (men's median − women's median) ÷ men's median. */
  genderGap: { medianPct: number | null; meanPct: number | null; women: number; men: number };
  /** Within each grade (like for like). */
  likeForLike: { grade: string; women: number; men: number; gapPct: number | null; suppressed: boolean }[];
  bandCompliance: { below: number; within: number; above: number; noBand: number; pct: number | null };
  findings: Finding[];
  recommendations: string[];
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const yearsBetween = (from: string, to: string) => Math.max(0, (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / (365.25 * 86_400_000));
const serviceBand = (y: number) => (y < 1 ? "Under 1 year" : y < 3 ? "1–3 years" : y < 5 ? "3–5 years" : y < 10 ? "5–10 years" : "10+ years");
const gradeRank = (g: string) => Number(g.replace(/\D/g, "")) || 0;
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const normGender = (g?: string) => (g ? g[0].toUpperCase() + g.slice(1).toLowerCase() : "Not stated");

/** Job family from the title: the profession, not the seniority. */
export function jobFamilyOf(title: string): string {
  const t = title.toLowerCase();
  const rules: [RegExp, string][] = [
    [/engineer|developer|devops|software|data|it |technology|qa/, "Engineering & Technology"],
    [/financ|account|payroll|audit|treasur/, "Finance"],
    [/sales|business development|account manager|growth/, "Sales"],
    [/market|brand|content|communication/, "Marketing"],
    [/hr|people|talent|recruit/, "People & HR"],
    [/product|design|ux/, "Product & Design"],
    [/support|customer|success|service/, "Customer Support"],
    [/operat|logistic|procure|admin|office/, "Operations"],
    [/legal|compliance|risk/, "Legal & Compliance"],
    [/chief|director|head|ceo|cfo|coo|cto/, "Leadership"],
  ];
  return rules.find(([re]) => re.test(t))?.[1] ?? "Other";
}

/** Provisional bands until approved ones exist: each grade's current median ±20%. */
export function defaultBands(people: { grade: string; annual: number }[]): SalaryBand[] {
  const by = new Map<string, number[]>();
  for (const p of people) by.set(p.grade, [...(by.get(p.grade) ?? []), p.annual]);
  return [...by.entries()]
    .sort((a, b) => gradeRank(a[0]) - gradeRank(b[0]))
    .map(([grade, xs]) => {
      const mid = median(xs);
      return { grade, min: Math.round((mid * 0.8) / 50_000) * 50_000, max: Math.round((mid * 1.2) / 50_000) * 50_000 };
    });
}

export interface EquityInput {
  run: PayrollRun | null;
  people: Map<string, LocaleEmployee>;
  structures: SalaryStructure[];
  bands?: SalaryBand[];
  explanations?: EquityExplanation[];
  minGroup?: number;
  branches?: Map<string, string>;
}

export function buildPeople(input: EquityInput): EquityPerson[] {
  const { run, people, structures } = input;
  if (!run) return [];
  const asOf = run.period.end;
  const raw = run.employees
    .filter((e) => e.included && e.computation)
    .map((e) => {
      const p = people.get(e.employeeId);
      const s = structureOn(structures, e.employeeId, asOf);
      const annual = round2((s ? s.lines.reduce((t, l) => t + l.amount, 0) : e.computation!.gross) * 12);
      const years = p?.startDate ? yearsBetween(p.startDate, asOf) : 0;
      const history = structures
        .filter((x) => x.employeeId === e.employeeId && (x.status ?? "approved") === "approved")
        .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
        .map((x) => ({ from: x.effectiveFrom, annual: round2(x.lines.reduce((t, l) => t + l.amount, 0) * 12), reason: x.reason, approvedBy: x.approvedBy }));
      return {
        employeeId: e.employeeId,
        name: p?.fullName ?? e.employeeId,
        employeeNumber: p?.employeeNumber ?? e.employeeId,
        gender: normGender(p?.gender),
        grade: p?.grade || "Ungraded",
        department: p?.departmentName || "Unassigned",
        jobTitle: p?.jobTitle ?? "",
        jobFamily: jobFamilyOf(p?.jobTitle ?? ""),
        location: (p?.branchId ? input.branches?.get(p.branchId) : undefined) ?? p?.workLocation ?? "—",
        serviceYears: round2(years),
        service: serviceBand(years),
        annual,
        history,
      };
    });
  const bands = input.bands?.length ? input.bands : defaultBands(raw);
  return raw.map((r) => {
    const band = bands.find((b) => b.grade === r.grade) ?? null;
    const mid = band ? (band.min + band.max) / 2 : 0;
    return {
      ...r,
      band,
      compaRatio: band && mid ? round2(r.annual / mid) : null,
      bandStatus: !band ? "no_band" : r.annual < band.min ? "below" : r.annual > band.max ? "above" : "within",
    };
  });
}

/** Figures for one dimension; groups under the threshold are withheld. */
export function compareBy(people: EquityPerson[], dim: Dimension, minGroup: number): GroupStat[] {
  const key = (p: EquityPerson) => (dim === "band" ? (p.bandStatus === "no_band" ? "No band" : p.bandStatus === "below" ? "Below range" : p.bandStatus === "above" ? "Above range" : "Within range") : dim === "service" ? p.service : p[dim]);
  const groups = new Map<string, EquityPerson[]>();
  for (const p of people) groups.set(key(p), [...(groups.get(key(p)) ?? []), p]);
  return [...groups.entries()]
    .map(([group, xs]) => {
      const suppressed = xs.length < minGroup;
      const pay = xs.map((x) => x.annual);
      const w = xs.filter((x) => x.gender === "Female").map((x) => x.annual);
      const m = xs.filter((x) => x.gender === "Male").map((x) => x.annual);
      const gap = w.length >= minGroup && m.length >= minGroup && median(m) ? round2(((median(m) - median(w)) / median(m)) * 100) : null;
      return {
        group,
        count: xs.length,
        suppressed,
        average: suppressed ? null : round2(pay.reduce((s, v) => s + v, 0) / pay.length),
        median: suppressed ? null : round2(median(pay)),
        min: suppressed ? null : Math.min(...pay),
        max: suppressed ? null : Math.max(...pay),
        genderGapPct: dim === "gender" ? null : gap,
      };
    })
    .sort((a, b) => (dim === "grade" ? gradeRank(a.group) - gradeRank(b.group) : (b.median ?? -1) - (a.median ?? -1)));
}

export function buildEquityReport(input: EquityInput): EquityReport {
  const minGroup = input.minGroup ?? 3;
  const people = buildPeople(input);
  const pay = people.map((p) => p.annual);
  const sorted = [...pay].sort((a, b) => a - b);
  const pick = (q: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);
  const women = people.filter((p) => p.gender === "Female");
  const men = people.filter((p) => p.gender === "Male");
  const mMed = median(men.map((p) => p.annual));
  const mMean = men.length ? men.reduce((s, p) => s + p.annual, 0) / men.length : 0;
  const enough = women.length >= minGroup && men.length >= minGroup;
  const genderGap = {
    medianPct: enough && mMed ? round2(((mMed - median(women.map((p) => p.annual))) / mMed) * 100) : null,
    meanPct: enough && mMean ? round2(((mMean - women.reduce((s, p) => s + p.annual, 0) / women.length) / mMean) * 100) : null,
    women: women.length,
    men: men.length,
  };
  const grades = [...new Set(people.map((p) => p.grade))].sort((a, b) => gradeRank(a) - gradeRank(b));
  const likeForLike = grades.map((grade) => {
    const w = people.filter((p) => p.grade === grade && p.gender === "Female").map((p) => p.annual);
    const m = people.filter((p) => p.grade === grade && p.gender === "Male").map((p) => p.annual);
    const ok = w.length >= minGroup && m.length >= minGroup;
    return { grade, women: w.length, men: m.length, gapPct: ok && median(m) ? round2(((median(m) - median(w)) / median(m)) * 100) : null, suppressed: !ok };
  });
  const within = people.filter((p) => p.bandStatus === "within").length;
  const banded = people.filter((p) => p.bandStatus !== "no_band").length;
  const bandCompliance = {
    below: people.filter((p) => p.bandStatus === "below").length,
    within,
    above: people.filter((p) => p.bandStatus === "above").length,
    noBand: people.length - banded,
    pct: banded ? round2((within / banded) * 100) : null,
  };

  // ── Findings ──
  const explained = (kind: FindingKind, ids: string[]) =>
    (input.explanations ?? []).find((x) => x.kind === kind && ids.includes(x.employeeId) && !!x.approvedBy);
  const findings: Finding[] = [];
  const add = (f: Omit<Finding, "explained">) => findings.push({ ...f, explained: explained(f.kind, f.employeeIds) });

  for (const p of people) {
    if (p.bandStatus === "below" && p.band) add({ id: `below:${p.employeeId}`, kind: "below_band", severity: "high", title: `${p.name} is paid below the ${p.grade} range`, detail: `${naira(p.annual)} a year against a minimum of ${naira(p.band.min)} (compa-ratio ${p.compaRatio}).`, employeeIds: [p.employeeId], costToFix: round2(p.band.min - p.annual) });
    if (p.bandStatus === "above" && p.band) add({ id: `above:${p.employeeId}`, kind: "above_band", severity: "low", title: `${p.name} is paid above the ${p.grade} range`, detail: `${naira(p.annual)} a year against a maximum of ${naira(p.band.max)}. Red-circle or document the reason.`, employeeIds: [p.employeeId] });
  }

  for (const grade of grades) {
    const inGrade = people.filter((p) => p.grade === grade);
    // Inversion: someone newer paid noticeably more than someone with 2+ more years in the same grade and family.
    for (const a of inGrade)
      for (const b of inGrade) {
        if (a.jobFamily !== b.jobFamily || a.serviceYears - b.serviceYears < 2) continue;
        if (b.annual > a.annual * 1.05) add({ id: `inv:${a.employeeId}:${b.employeeId}`, kind: "inversion", severity: "medium", title: `${b.name} (newer) earns more than ${a.name}`, detail: `Same grade (${grade}) and job family. ${b.name}: ${b.serviceYears.toFixed(1)} yrs, ${naira(b.annual)}; ${a.name}: ${a.serviceYears.toFixed(1)} yrs, ${naira(a.annual)}.`, employeeIds: [a.employeeId, b.employeeId] });
        // Compression: 3+ years more service, within 2% of each other's pay.
        else if (a.serviceYears - b.serviceYears >= 3 && Math.abs(a.annual - b.annual) <= a.annual * 0.02) add({ id: `comp:${a.employeeId}:${b.employeeId}`, kind: "compression", severity: "low", title: `${a.name} and ${b.name} are paid almost the same`, detail: `${(a.serviceYears - b.serviceYears).toFixed(1)} more years' service in ${grade}, but within 2% on pay.`, employeeIds: [a.employeeId, b.employeeId] });
      }
    // Unexplained spread: like-for-like group (grade + family) of at least the threshold, max > 1.3 × min.
    const fams = new Map<string, EquityPerson[]>();
    for (const p of inGrade) fams.set(p.jobFamily, [...(fams.get(p.jobFamily) ?? []), p]);
    for (const [fam, xs] of fams) {
      if (xs.length < minGroup) continue;
      const lo = xs.reduce((a, b) => (b.annual < a.annual ? b : a));
      const hi = xs.reduce((a, b) => (b.annual > a.annual ? b : a));
      if (hi.annual > lo.annual * 1.3) add({ id: `spread:${grade}:${fam}`, kind: "unexplained_spread", severity: "medium", title: `${Math.round((hi.annual / lo.annual - 1) * 100)}% spread in ${grade} ${fam}`, detail: `${hi.name} ${naira(hi.annual)} vs ${lo.name} ${naira(lo.annual)} for the same grade and job family.`, employeeIds: [hi.employeeId, lo.employeeId] });
    }
  }
  // Grade inversion: paid more than the median of the next grade up.
  for (let i = 0; i < grades.length - 1; i++) {
    const nextMed = median(people.filter((p) => p.grade === grades[i + 1]).map((p) => p.annual));
    for (const p of people.filter((x) => x.grade === grades[i] && x.annual > nextMed && nextMed > 0))
      add({ id: `ginv:${p.employeeId}`, kind: "grade_inversion", severity: "medium", title: `${p.name} (${p.grade}) out-earns the ${grades[i + 1]} median`, detail: `${naira(p.annual)} against a ${grades[i + 1]} median of ${naira(nextMed)}.`, employeeIds: [p.employeeId] });
  }
  for (const l of likeForLike) {
    if (l.gapPct !== null && Math.abs(l.gapPct) >= 5) {
      const ids = people.filter((p) => p.grade === l.grade).map((p) => p.employeeId);
      add({ id: `gap:${l.grade}`, kind: "gender_gap", severity: Math.abs(l.gapPct) >= 10 ? "high" : "medium", title: `${Math.abs(l.gapPct)}% gender gap in ${l.grade}`, detail: `${l.gapPct > 0 ? "Women's" : "Men's"} median pay is ${Math.abs(l.gapPct)}% lower within the same grade (${l.women} women, ${l.men} men).`, employeeIds: ids });
    }
  }
  const sev = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => Number(!!a.explained) - Number(!!b.explained) || sev[a.severity] - sev[b.severity]);

  // ── Recommendations for management ──
  const open = findings.filter((f) => !f.explained);
  const recs: string[] = [];
  const below = open.filter((f) => f.kind === "below_band");
  if (below.length) recs.push(`Bring ${below.length} employee${below.length === 1 ? "" : "s"} up to the band minimum: ${naira(below.reduce((s, f) => s + (f.costToFix ?? 0), 0))} a year in fixed pay (plus employer contributions).`);
  for (const f of open.filter((x) => x.kind === "gender_gap")) recs.push(`Review ${f.title.replace(/^\d+% /, "")}: check each difference against performance, service and role before the next salary review.`);
  if (open.some((f) => f.kind === "inversion" || f.kind === "grade_inversion")) recs.push(`Resolve ${open.filter((f) => f.kind === "inversion" || f.kind === "grade_inversion").length} pay inversion${open.filter((f) => f.kind === "inversion" || f.kind === "grade_inversion").length === 1 ? "" : "s"} — either adjust pay at the next review or document why the difference is justified.`);
  if (open.some((f) => f.kind === "compression")) recs.push("Address compression: longer-serving staff are paid about the same as newer joiners in the same grade.");
  if (open.some((f) => f.kind === "above_band")) recs.push("Employees above range: red-circle their pay (no increases until the band catches up) or move them to the right grade.");
  if (!input.bands?.length) recs.push("Approve salary bands for every grade — until then MOTEE uses a provisional ±20% range around each grade's median.");
  if (!recs.length) recs.push("No open pay equity issues at this threshold.");

  return {
    asOf: input.run?.period.label ?? "—",
    minGroup,
    people,
    overall: { count: people.length, average: pay.length ? round2(pay.reduce((s, v) => s + v, 0) / pay.length) : 0, median: round2(median(pay)), p10: pick(0.1), p90: pick(0.9) },
    genderGap,
    likeForLike,
    bandCompliance,
    findings,
    recommendations: recs,
  };
}
