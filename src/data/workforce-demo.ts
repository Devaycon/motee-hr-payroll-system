import type {
  SkillsGap,
  TurnoverRecord,
  HiringMetric,
  TurnoverPeriod,
  SkillCategory,
  GapSeverity,
} from "@/src/lib/types/workforce";

export const GAP_SEVERITY_LABELS: Record<GapSeverity, string> = {
  critical: "Critical",
  moderate: "Moderate",
  adequate: "Adequate",
};

export const GAP_SEVERITY_STYLES: Record<GapSeverity, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  moderate: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  adequate: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
};

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  technical:     "Technical",
  leadership:    "Leadership",
  communication: "Communication",
  domain:        "Domain",
  tools:         "Tools",
};

export const SKILL_CATEGORY_STYLES: Record<SkillCategory, string> = {
  technical:     "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  leadership:    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  communication: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400",
  domain:        "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  tools:         "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
};

export const TURNOVER_PERIODS: TurnoverPeriod[] = [
  "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026",
];

export const TURNOVER_CHART_CONFIG = {
  voluntary:   { label: "Voluntary",   color: "#ff8b2d" },
  involuntary: { label: "Involuntary", color: "var(--primary)" },
} as const;

export const HIRING_METRICS: HiringMetric[] = [
  { department: "Engineering",    openRequisitions: 4, avgDaysToFill: 34, offersExtended: 6, offersAccepted: 5 },
  { department: "Sales",          openRequisitions: 3, avgDaysToFill: 21, offersExtended: 4, offersAccepted: 3 },
  { department: "Human Resources",openRequisitions: 1, avgDaysToFill: 18, offersExtended: 2, offersAccepted: 2 },
  { department: "Finance",        openRequisitions: 2, avgDaysToFill: 28, offersExtended: 3, offersAccepted: 2 },
  { department: "Marketing",      openRequisitions: 2, avgDaysToFill: 25, offersExtended: 3, offersAccepted: 3 },
  { department: "Operations",     openRequisitions: 1, avgDaysToFill: 22, offersExtended: 2, offersAccepted: 1 },
];

export const SKILLS_GAPS: SkillsGap[] = [
  { id: "sg-001", skill: "Cloud Architecture (AWS/GCP)", category: "technical",     requiredCount: 8, availableCount: 3, gapCount: 5, coveragePct: 38, severity: "critical" },
  { id: "sg-002", skill: "Data Science & ML",            category: "technical",     requiredCount: 6, availableCount: 2, gapCount: 4, coveragePct: 33, severity: "critical" },
  { id: "sg-003", skill: "People Management",            category: "leadership",    requiredCount: 12, availableCount: 7, gapCount: 5, coveragePct: 58, severity: "moderate" },
  { id: "sg-004", skill: "Executive Communication",      category: "communication", requiredCount: 10, availableCount: 6, gapCount: 4, coveragePct: 60, severity: "moderate" },
  { id: "sg-005", skill: "Financial Modelling",          category: "domain",        requiredCount: 5, availableCount: 4, gapCount: 1, coveragePct: 80, severity: "adequate" },
  { id: "sg-006", skill: "Salesforce CRM",               category: "tools",         requiredCount: 8, availableCount: 3, gapCount: 5, coveragePct: 38, severity: "critical" },
  { id: "sg-007", skill: "Agile / Scrum",                category: "technical",     requiredCount: 15, availableCount: 12, gapCount: 3, coveragePct: 80, severity: "adequate" },
  { id: "sg-008", skill: "Change Management",            category: "leadership",    requiredCount: 7, availableCount: 5, gapCount: 2, coveragePct: 71, severity: "moderate" },
];

export const TURNOVER_RECORDS: TurnoverRecord[] = [
  { id: "tr-001", period: "Q1 2025", department: "Engineering",    totalHeadcount: 42, voluntary: 2, involuntary: 1 },
  { id: "tr-002", period: "Q1 2025", department: "Sales",          totalHeadcount: 28, voluntary: 3, involuntary: 0 },
  { id: "tr-003", period: "Q1 2025", department: "Human Resources",totalHeadcount: 15, voluntary: 1, involuntary: 0 },
  { id: "tr-004", period: "Q2 2025", department: "Engineering",    totalHeadcount: 44, voluntary: 3, involuntary: 1 },
  { id: "tr-005", period: "Q2 2025", department: "Sales",          totalHeadcount: 26, voluntary: 2, involuntary: 1 },
  { id: "tr-006", period: "Q2 2025", department: "Human Resources",totalHeadcount: 14, voluntary: 0, involuntary: 1 },
  { id: "tr-007", period: "Q3 2025", department: "Engineering",    totalHeadcount: 45, voluntary: 1, involuntary: 0 },
  { id: "tr-008", period: "Q3 2025", department: "Sales",          totalHeadcount: 27, voluntary: 2, involuntary: 0 },
  { id: "tr-009", period: "Q3 2025", department: "Human Resources",totalHeadcount: 14, voluntary: 1, involuntary: 0 },
  { id: "tr-010", period: "Q4 2025", department: "Engineering",    totalHeadcount: 46, voluntary: 2, involuntary: 2 },
  { id: "tr-011", period: "Q4 2025", department: "Sales",          totalHeadcount: 28, voluntary: 1, involuntary: 0 },
  { id: "tr-012", period: "Q4 2025", department: "Human Resources",totalHeadcount: 15, voluntary: 0, involuntary: 0 },
  { id: "tr-013", period: "Q1 2026", department: "Engineering",    totalHeadcount: 48, voluntary: 1, involuntary: 0 },
  { id: "tr-014", period: "Q1 2026", department: "Sales",          totalHeadcount: 30, voluntary: 2, involuntary: 1 },
  { id: "tr-015", period: "Q1 2026", department: "Human Resources",totalHeadcount: 16, voluntary: 0, involuntary: 0 },
];

export function buildTurnoverTrends(
  records: TurnoverRecord[],
  period?: TurnoverPeriod
): { period: TurnoverPeriod; voluntary: number; involuntary: number; rate: number }[] {
  const grouped = new Map<TurnoverPeriod, { voluntary: number; involuntary: number; headcount: number }>();
  for (const r of records) {
    if (period && r.period !== period) continue;
    const prev = grouped.get(r.period) ?? { voluntary: 0, involuntary: 0, headcount: 0 };
    grouped.set(r.period, { voluntary: prev.voluntary + r.voluntary, involuntary: prev.involuntary + r.involuntary, headcount: prev.headcount + r.totalHeadcount });
  }
  return TURNOVER_PERIODS.filter((p) => grouped.has(p)).map((p) => {
    const g = grouped.get(p)!;
    return { period: p, voluntary: g.voluntary, involuntary: g.involuntary, rate: g.headcount > 0 ? Math.round(((g.voluntary + g.involuntary) / g.headcount) * 100 * 10) / 10 : 0 };
  });
}

export const WORKFORCE_DEMOGRAPHICS: {
  gender: { label: string; count: number; percentage: number }[];
  ageGroup: { label: string; count: number; percentage: number }[];
  employmentType: { label: string; count: number; percentage: number }[];
  tenure: { label: string; count: number; percentage: number }[];
} = {
  gender: [
    { label: "Male",   count: 108, percentage: 59 },
    { label: "Female", count: 73,  percentage: 40 },
    { label: "Other",  count: 2,   percentage: 1 },
  ],
  ageGroup: [
    { label: "18–25", count: 28,  percentage: 15 },
    { label: "26–35", count: 82,  percentage: 45 },
    { label: "36–45", count: 54,  percentage: 30 },
    { label: "46–55", count: 14,  percentage: 8 },
    { label: "55+",   count: 5,   percentage: 3 },
  ],
  employmentType: [
    { label: "Full-Time", count: 148, percentage: 81 },
    { label: "Part-Time", count: 22,  percentage: 12 },
    { label: "Contract",  count: 13,  percentage: 7 },
  ],
  tenure: [
    { label: "< 1 Year",  count: 32, percentage: 18 },
    { label: "1–2 Years", count: 45, percentage: 25 },
    { label: "3–5 Years", count: 60, percentage: 33 },
    { label: "6–10 Years",count: 35, percentage: 19 },
    { label: "10+ Years", count: 11, percentage: 6 },
  ],
};
