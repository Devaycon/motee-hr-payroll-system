import { getInitials } from "@/src/lib/types/dashboard";
import type {
  AttritionRisk,
  DemographicsItem,
  GapStatus,
  HeadcountPlan,
  PlanPeriod,
  RecruitmentPipelineStage,
} from "@/src/lib/types/headcount";
import type {
  AttritionRiskDto,
  DemographicItemDto,
  GapStatus as ApiGapStatus,
  HeadcountPlanRowDto,
  RecruitmentPipelineStage as ApiStage,
} from "@/src/types/headcount";

/**
 * The screens label periods "Q1 2026" and "FY 2026". The API takes a plain
 * string whose format the spec does not pin down; it is sent as "2026-Q1"
 * (or "2026" for a full year) and read back in any of the usual spellings.
 * Unverified against the server — adjust here if it expects another form.
 */
export function periodToApi(period: PlanPeriod): string {
  const q = /^Q([1-4]) (\d{4})$/.exec(period);
  if (q) return `${q[2]}-Q${q[1]}`;
  const fy = /^FY (\d{4})$/.exec(period);
  return fy ? fy[1] : period;
}

export function periodFromApi(raw: string): PlanPeriod | null {
  const s = raw.trim().toUpperCase();
  let m = /^(\d{4})[-\s]?Q([1-4])$/.exec(s) ?? null;
  if (m) return `Q${m[2]} ${m[1]}` as PlanPeriod;
  m = /^Q([1-4])[-\s]?(\d{4})$/.exec(s);
  if (m) return `Q${m[1]} ${m[2]}` as PlanPeriod;
  m = /^(?:FY[-\s]?)?(\d{4})(?:[-\s]?FY)?$/.exec(s);
  if (m) return `FY ${m[1]}` as PlanPeriod;
  return null;
}

const GAP_FROM_API: Record<ApiGapStatus, GapStatus> = {
  under: "under",
  onTarget: "on_target",
  over: "over",
};

const STAGE_FROM_API: Record<ApiStage, RecruitmentPipelineStage> = {
  notStarted: "not_started",
  requestRaised: "request_raised",
  requisitionApproved: "requisition_approved",
  vacancyPublished: "vacancy_published",
  interviewing: "interviewing",
  offerMade: "offer_made",
  offerAccepted: "offer_accepted",
};

export function planFromApi(row: HeadcountPlanRowDto, period: PlanPeriod): HeadcountPlan {
  const target = row.target ?? 0;
  return {
    id: row.id ?? `${row.departmentId}:${period}`,
    department: row.departmentName,
    period,
    target,
    actual: row.actual,
    gapStatus: row.gapStatus
      ? GAP_FROM_API[row.gapStatus]
      : row.actual > target
        ? "over"
        : row.actual === target
          ? "on_target"
          : "under",
    openVacancies: row.openVacancies,
    activeRecruitments: row.activeRecruitments,
    budget: row.budget ?? undefined,
    recruitmentStage: STAGE_FROM_API[row.recruitmentStage] ?? "not_started",
    offerAccepted: row.acceptedNotStarted > 0,
    expectedStartDate: row.expectedStartDate ?? undefined,
    previousPeriodGap: row.previousPeriodGap ?? undefined,
  };
}

export function attritionFromApi(dto: AttritionRiskDto): AttritionRisk {
  return {
    id: dto.employeeId,
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
    initials: getInitials(dto.employeeName),
    jobTitle: dto.jobTitle ?? "",
    department: dto.departmentName ?? "—",
    tenureYears: dto.tenureYears,
    riskLevel: dto.level,
    riskFactors: dto.factors.map((f) => f.label),
    riskScore: Math.round(dto.score),
    factorBreakdown: dto.factors,
    recommendedAction: dto.recommendedAction,
    lastPerformanceRating:
      dto.lastPerformanceRating != null ? `${dto.lastPerformanceRating}/5` : undefined,
    manager: dto.managerName ?? undefined,
  };
}

export function demographicsFromApi(
  items: DemographicItemDto[],
  href?: (item: DemographicItemDto) => string | undefined,
): DemographicsItem[] {
  return items.map((i) => ({
    label: i.label,
    value: i.count,
    count: i.count,
    percentage: i.percentage,
    href: href?.(i),
  }));
}
