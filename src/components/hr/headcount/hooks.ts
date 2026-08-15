"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { STATUS_LABELS } from "@/src/data/employees-demo";
import { employmentTypeFromName } from "@/src/lib/constants/employment-types";
import {
  riskLevelForScore,
  recommendedRetentionAction,
  ALL_PLAN_PERIODS,
  type AttritionRisk,
  type DemographicsItem,
  type HeadcountPlan,
  type PlanPeriod,
  type RiskFactor,
} from "@/src/lib/types/headcount";
import type { LocaleBundle } from "@/src/lib/types/locale";

/**
 * §6.24 — plans are generated for 2025 as well as 2026 so quarter-on-quarter
 * and year-on-year have a baseline. Only 2026 is offered as an editable target
 * (see `PLAN_PERIODS`); 2025 is history.
 */
const PERIODS: PlanPeriod[] = ALL_PLAN_PERIODS;

/**
 * How much smaller a department was in a given period, as a fraction of today.
 * The bundle only carries a current roster, so prior-period actuals are
 * derived: a steady ~2% per quarter of growth working backwards from now.
 * Deterministic, so the trend numbers don't move between renders.
 */
function historicalFactor(period: PlanPeriod): number {
  const index = ALL_PLAN_PERIODS.indexOf(period);
  const current = ALL_PLAN_PERIODS.indexOf("Q1 2026");
  const quartersBack = Math.max(0, current - index);
  return Math.pow(0.98, quartersBack);
}

function deriveGap(target: number, actual: number) {
  if (actual >= target) return actual > target ? "over" : "on_target";
  return "under";
}

interface HeadcountData {
  plans: HeadcountPlan[];
  attritionRisks: AttritionRisk[];
  demographics: {
    employmentType: DemographicsItem[];
    tenure: DemographicsItem[];
    department: DemographicsItem[];
    status: DemographicsItem[];
    // §6.23 — these come straight off the employee record. The old
    // "not yet captured" placeholder was simply out of date.
    age: DemographicsItem[];
    gender: DemographicsItem[];
    grade: DemographicsItem[];
    location: DemographicsItem[];
  };
  /** Headcount the D&I breakdowns are a proportion of. */
  eligibleForDeclaration: number;
  /** employeeId list, so declarations can be tallied without naming anyone. */
  employeeIds: string[];
}

/** §6.23 — standard reporting bands rather than raw ages. */
function ageBand(dateOfBirth: string | undefined, now: Date): string | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const age = Math.floor(
    (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
  if (age < 25) return "Under 25";
  if (age < 35) return "25–34";
  if (age < 45) return "35–44";
  if (age < 55) return "45–54";
  if (age < 65) return "55–64";
  return "65+";
}

function tenureYears(startDate: string): number {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;
  const today = new Date();
  return (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function buildHeadcount(bundle: LocaleBundle): HeadcountData {
  // Looked up once rather than per employee.
  const typeNameById = new Map(
    bundle.employmentTypes.map((t) => [t.id, t.name]),
  );
  const managerNameById = new Map(
    bundle.employees.map((e) => [e.id, e.fullName]),
  );

  const plans: HeadcountPlan[] = [];
  PERIODS.forEach((period, periodIdx) => {
    const factor = historicalFactor(period);
    bundle.departments.forEach((dept) => {
      const today = bundle.employees.filter(
        (e) => e.departmentId === dept.id,
      ).length;
      // Past periods are scaled back from today's roster (§6.24); current and
      // future periods use the real count.
      const actual = factor >= 1 ? today : Math.round(today * factor);
      const baseTarget = dept.headcountTarget ?? today;
      const target =
        factor >= 1
          ? baseTarget + Math.max(0, periodIdx - PERIODS.indexOf("Q1 2026") - 1)
          : Math.round(baseTarget * factor);
      plans.push({
        id: `hc-${dept.id}-${periodIdx}`,
        department: dept.name,
        period,
        target,
        actual,
        gapStatus: deriveGap(target, actual),
      });
    });
  });

  const attritionRisks: AttritionRisk[] = bundle.employees
    .map((emp) => {
      const years = tenureYears(emp.startDate);
      /**
       * §6.11 / §6.12 — a weighted score built from named factors. The old
       * rule gave every flagged person the same reason string, so High and
       * Medium looked identical and the list couldn't be acted on.
       *
       * Weights are deliberately conservative and additive; the score is
       * capped at 100 and the band comes from `riskLevelForScore`.
       */
      const factorBreakdown: RiskFactor[] = [];

      if (years > 6) {
        factorBreakdown.push({
          label: "Long tenure without role change",
          weight: 45,
        });
      } else if (years > 4) {
        factorBreakdown.push({
          label: "Long tenure without role change",
          weight: 30,
        });
      } else if (years > 2) {
        factorBreakdown.push({ label: "Approaching typical tenure", weight: 12 });
      }

      if (emp.status === "on_leave") {
        factorBreakdown.push({ label: "Currently on leave", weight: 15 });
      }
      if (emp.status === "probation") {
        factorBreakdown.push({ label: "Still on probation", weight: 20 });
      }

      // Fixed-term and contract staff carry inherent end-date risk.
      const empType = typeNameById.get(emp.employmentTypeId) ?? "";
      if (/contract|temp|fixed/i.test(empType)) {
        factorBreakdown.push({ label: "Fixed-term or contract", weight: 20 });
      }
      // Someone several years in on the same grade is the classic flight risk.
      if (years > 3 && (emp.level ?? 0) <= 1) {
        factorBreakdown.push({ label: "No grade progression", weight: 18 });
      }
      // NOTE: performance rating, engagement score, salary-vs-market and
      // absence are all in the client's §6.11 list but are not on the employee
      // record yet. They plug in here as extra factors once captured; the
      // score and bands need no change when they do.

      const score = Math.min(
        100,
        factorBreakdown.reduce((sum, f) => sum + f.weight, 0),
      );
      const riskLevel = riskLevelForScore(score);

      return {
        id: `ar-${emp.id}`,
        // Carried explicitly so the row can link to the profile (§6.16)
        // without unpicking the "ar-" prefix off the row id.
        employeeId: emp.id,
        employeeName: emp.fullName,
        initials: emp.initials,
        jobTitle: emp.jobTitle,
        department: emp.departmentName,
        manager: managerNameById.get(emp.managerId ?? "") ?? undefined,
        tenureYears: Math.round(years * 10) / 10,
        riskLevel,
        riskScore: score,
        factorBreakdown,
        riskFactors: factorBreakdown.length
          ? factorBreakdown.map((f) => f.label)
          : ["Standard monitoring"],
        recommendedAction: recommendedRetentionAction(
          riskLevel,
          factorBreakdown,
        ),
      } satisfies AttritionRisk;
    })
    // Low-risk employees are kept so the High/Medium/Low summary bands can
    // report real numbers (client feedback §6.17); the KPI card still counts
    // only medium and high as "at risk".
    .slice(0, 40);

  const employmentTypeMap = new Map<string, number>();
  for (const e of bundle.employees) {
    const name =
      typeNameById.get(e.employmentTypeId) ?? e.employmentTypeId ?? "Unknown";
    employmentTypeMap.set(name, (employmentTypeMap.get(name) ?? 0) + 1);
  }

  const tenureBuckets = new Map<string, number>([
    ["<1y", 0],
    ["1-3y", 0],
    ["3-5y", 0],
    ["5+y", 0],
  ]);
  for (const e of bundle.employees) {
    const y = tenureYears(e.startDate);
    if (y < 1) tenureBuckets.set("<1y", tenureBuckets.get("<1y")! + 1);
    else if (y < 3) tenureBuckets.set("1-3y", tenureBuckets.get("1-3y")! + 1);
    else if (y < 5) tenureBuckets.set("3-5y", tenureBuckets.get("3-5y")! + 1);
    else tenureBuckets.set("5+y", tenureBuckets.get("5+y")! + 1);
  }

  // §6.26 Workforce Composition also wants lifecycle status, which is already
  // on the employee record.
  const statusMap = new Map<string, number>();
  for (const e of bundle.employees) {
    const label = STATUS_LABELS[e.status] ?? e.status;
    statusMap.set(label, (statusMap.get(label) ?? 0) + 1);
  }

  const total = bundle.employees.length || 1;
  const toItems = (
    m: Map<string, number>,
    hrefFor?: (label: string) => string | undefined,
  ): DemographicsItem[] =>
    Array.from(m, ([label, value]) => ({
      label,
      value,
      count: value,
      percentage: Math.round((value / total) * 100),
      href: hrefFor?.(label),
    }));

  const deptMap = new Map<string, number>();
  for (const e of bundle.employees) {
    deptMap.set(e.departmentName, (deptMap.get(e.departmentName) ?? 0) + 1);
  }

  const statusByLabel = new Map(
    Object.entries(STATUS_LABELS).map(([k, v]) => [v, k]),
  );

  // §6.23 — age, gender, grade and work location are all already on the
  // employee record; nothing new needs collecting for these four.
  const now = new Date();
  const ageMap = new Map<string, number>();
  const genderMap = new Map<string, number>();
  const gradeMap = new Map<string, number>();
  const locationMap = new Map<string, number>();
  for (const e of bundle.employees) {
    const band = ageBand(e.dateOfBirth, now);
    if (band) ageMap.set(band, (ageMap.get(band) ?? 0) + 1);
    const gender = e.gender?.trim();
    if (gender) genderMap.set(gender, (genderMap.get(gender) ?? 0) + 1);
    const grade = e.grade?.trim();
    if (grade) gradeMap.set(grade, (gradeMap.get(grade) ?? 0) + 1);
    const location = e.workLocation?.trim();
    if (location) locationMap.set(location, (locationMap.get(location) ?? 0) + 1);
  }

  return {
    plans,
    attritionRisks,
    eligibleForDeclaration: bundle.employees.length,
    employeeIds: bundle.employees.map((e) => e.id),
    demographics: {
      age: toItems(ageMap),
      gender: toItems(genderMap),
      grade: toItems(gradeMap),
      location: toItems(locationMap),
      // §6.25 — each segment drills into the matching employee list. The
      // Employees page filters on the canonical slug, not the locale name.
      employmentType: toItems(
        employmentTypeMap,
        (label) =>
          `/organization/employees?employmentType=${employmentTypeFromName(label)}`,
      ),
      // No tenure filter exists on the employee list, so these stay static.
      tenure: toItems(tenureBuckets),
      department: toItems(
        deptMap,
        (label) =>
          `/organization/employees?department=${encodeURIComponent(label)}`,
      ),
      status: toItems(statusMap, (label) => {
        const slug = statusByLabel.get(label);
        return slug ? `/organization/employees?status=${slug}` : undefined;
      }),
    },
  };
}

export function useHeadcount() {
  return useLocaleSection<HeadcountData>(buildHeadcount);
}
