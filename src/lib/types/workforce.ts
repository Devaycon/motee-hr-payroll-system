export type SkillCategory =
  | "technical"
  | "leadership"
  | "communication"
  | "domain"
  | "tools";

export type GapSeverity = "critical" | "moderate" | "adequate";

export type TurnoverPeriod =
  | "Q1 2025"
  | "Q2 2025"
  | "Q3 2025"
  | "Q4 2025"
  | "Q1 2026";

export interface SkillsGap {
  id: string;
  skill: string;
  category: SkillCategory;
  requiredCount: number;
  availableCount: number;
  gapCount: number;
  coveragePct: number;
  severity: GapSeverity;
}

export interface TurnoverRecord {
  id: string;
  period: TurnoverPeriod;
  department: string;
  totalHeadcount: number;
  voluntary: number;
  involuntary: number;
}

export interface HiringMetric {
  id?: string;
  department: string;
  openRequisitions: number;
  avgDaysToFill: number;
  offersExtended: number;
  offersAccepted: number;
  filledThisQuarter?: number;
  costPerHire?: number;
}

export interface DemographicItem {
  label: string;
  value?: number;
  percent?: number;
  count?: number;
  percentage?: number;
}

