"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  AttritionRisk,
  DemographicsItem,
  HeadcountPlan,
  PlanPeriod,
} from "@/src/lib/types/headcount";
import type { LocaleBundle } from "@/src/lib/types/locale";

const PERIODS: PlanPeriod[] = [
  "Q1 2026",
  "Q2 2026",
  "Q3 2026",
  "Q4 2026",
  "FY 2026",
];

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
  };
}

function tenureYears(startDate: string): number {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;
  const today = new Date();
  return (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function buildHeadcount(bundle: LocaleBundle): HeadcountData {
  const plans: HeadcountPlan[] = [];
  PERIODS.forEach((period, periodIdx) => {
    bundle.departments.forEach((dept, deptIdx) => {
      const actual = bundle.employees.filter(
        (e) => e.departmentId === dept.id,
      ).length;
      const target = dept.headcountTarget ?? actual;
      plans.push({
        id: `hc-${dept.id}-${periodIdx}`,
        department: dept.name,
        period,
        target: target + Math.max(0, periodIdx - 1),
        actual,
        gapStatus: deriveGap(target, actual),
      });
    });
  });

  const attritionRisks: AttritionRisk[] = bundle.employees
    .map((emp) => {
      const years = tenureYears(emp.startDate);
      let riskLevel: AttritionRisk["riskLevel"] = "low";
      const factors: string[] = [];
      if (years > 4) {
        riskLevel = "medium";
        factors.push("Long tenure without role change");
      }
      if (emp.status === "on_leave") {
        factors.push("Currently on leave");
      }
      if (years > 6) {
        riskLevel = "high";
      }
      return {
        id: `ar-${emp.id}`,
        employeeName: emp.fullName,
        initials: emp.initials,
        jobTitle: emp.jobTitle,
        department: emp.departmentName,
        tenureYears: Math.round(years * 10) / 10,
        riskLevel,
        riskFactors: factors.length ? factors : ["Standard monitoring"],
      };
    })
    .filter((r) => r.riskLevel !== "low")
    .slice(0, 15);

  const employmentTypeMap = new Map<string, number>();
  const typeNameById = new Map(
    bundle.employmentTypes.map((t) => [t.id, t.name]),
  );
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

  const total = bundle.employees.length || 1;
  const toItems = (m: Map<string, number>): DemographicsItem[] =>
    Array.from(m, ([label, value]) => ({
      label,
      value,
      count: value,
      percentage: Math.round((value / total) * 100),
    }));

  const deptMap = new Map<string, number>();
  for (const e of bundle.employees) {
    deptMap.set(e.departmentName, (deptMap.get(e.departmentName) ?? 0) + 1);
  }

  return {
    plans,
    attritionRisks,
    demographics: {
      employmentType: toItems(employmentTypeMap),
      tenure: toItems(tenureBuckets),
      department: toItems(deptMap),
    },
  };
}

export function useHeadcount() {
  return useLocaleSection<HeadcountData>(buildHeadcount);
}
