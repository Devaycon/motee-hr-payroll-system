export type GapStatus = "under" | "on_target" | "over";

/**
 * §6.24 — 2025 exists so year-on-year has something to compare against. Only
 * the 2026 periods are offered as editable targets (see `PLAN_PERIODS`); the
 * prior year is a read-only baseline.
 */
export type PlanPeriod =
	| "Q1 2025"
	| "Q2 2025"
	| "Q3 2025"
	| "Q4 2025"
	| "FY 2025"
	| "Q1 2026"
	| "Q2 2026"
	| "Q3 2026"
	| "Q4 2026"
	| "FY 2026";

/** Every period that carries data, oldest first. */
export const ALL_PLAN_PERIODS: PlanPeriod[] = [
	"Q1 2025",
	"Q2 2025",
	"Q3 2025",
	"Q4 2025",
	"FY 2025",
	"Q1 2026",
	"Q2 2026",
	"Q3 2026",
	"Q4 2026",
	"FY 2026",
];

/** Quarterly periods only, oldest first — the series trends are drawn from. */
export const QUARTERLY_PERIODS: PlanPeriod[] = ALL_PLAN_PERIODS.filter(
	(p) => p.startsWith("Q"),
);

/** Split "Q3 2026" into its parts. Returns null for full-year periods. */
export function parseQuarter(
	period: PlanPeriod,
): { quarter: number; year: number } | null {
	const match = /^Q([1-4]) (\d{4})$/.exec(period);
	if (!match) return null;
	return { quarter: Number(match[1]), year: Number(match[2]) };
}

/** The quarter immediately before `period`, or null if it isn't quarterly. */
export function previousQuarter(period: PlanPeriod): PlanPeriod | null {
	const parsed = parseQuarter(period);
	if (!parsed) return null;
	const { quarter, year } = parsed;
	const prev =
		quarter === 1 ? `Q4 ${year - 1}` : `Q${quarter - 1} ${year}`;
	return (ALL_PLAN_PERIODS as string[]).includes(prev)
		? (prev as PlanPeriod)
		: null;
}

/** The same quarter one year earlier, or null if it isn't held. */
export function sameQuarterLastYear(period: PlanPeriod): PlanPeriod | null {
	const parsed = parseQuarter(period);
	if (!parsed) return null;
	const prior = `Q${parsed.quarter} ${parsed.year - 1}`;
	return (ALL_PLAN_PERIODS as string[]).includes(prior)
		? (prior as PlanPeriod)
		: null;
}

export type AttritionRiskLevel = "low" | "medium" | "high";

export interface HeadcountPlan {
	id: string;
	department: string;
	period: PlanPeriod;
	target: number;
	actual: number;
	gapStatus: GapStatus;
	// §6.6 — recruitment context, so the plan table shows why a gap persists.
	openVacancies?: number;
	approvedWorkforceRequests?: number;
	activeRecruitments?: number;
	// §6.3 / §6.31 — the cost view Finance asked for.
	budget?: number;
	currentCost?: number;
	/** Monthly cost of leaving this department's gap unfilled. */
	estimatedVacancyCost?: number;
	// §6.29 / §6.30 — where recruitment has actually got to.
	recruitmentStage?: RecruitmentPipelineStage;
	offerAccepted?: boolean;
	expectedStartDate?: string;
	/** §6.32 — the same department's gap in the previous period. */
	previousPeriodGap?: number;
}

/** §6.29 / §6.30 — how far along recruitment is for a department's gap. */
export type RecruitmentPipelineStage =
	| "not_started"
	| "request_raised"
	| "requisition_approved"
	| "vacancy_published"
	| "interviewing"
	| "offer_made"
	| "offer_accepted";

export const RECRUITMENT_STAGE_LABELS: Record<
	RecruitmentPipelineStage,
	string
> = {
	not_started: "No Recruitment Started",
	request_raised: "Workforce Request Raised",
	requisition_approved: "Requisition Approved",
	vacancy_published: "Vacancy Published",
	interviewing: "Interview Stage",
	offer_made: "Offer Made",
	offer_accepted: "Offer Accepted",
};

/**
 * §6.28 — what to do about a department's position, so the Gap Report tells
 * the reader what action it wants rather than leaving them to infer it.
 */
export function recommendedGapAction(plan: HeadcountPlan): string {
	const gap = plan.actual - plan.target;
	if (gap > 0) return "Review Organisation Structure";
	if (gap === 0) return "No Action Required";
	if ((plan.activeRecruitments ?? 0) > 0) return "Recruitment in Progress";
	if ((plan.openVacancies ?? 0) > 0) return "Fill Existing Vacancy";
	return "Create Workforce Request";
}

export interface NewHeadcountPlan {
	department: string;
	period: PlanPeriod;
	target: number;
}

/**
 * A single contributing factor behind an attrition score (client feedback
 * §6.11). Every flagged employee previously showed the same generic reason,
 * which explained nothing about why one was High and another Medium.
 */
export interface RiskFactor {
	label: string;
	/** Points this factor contributes to the 0–100 score. */
	weight: number;
}

export interface AttritionRisk {
	id: string;
	/** System employee id, so the row can link to their profile (§6.16). */
	employeeId?: string;
	employeeName: string;
	initials: string;
	jobTitle: string;
	department: string;
	tenureYears: number;
	riskLevel: AttritionRiskLevel;
	riskFactors: string[];
	/** §6.12 — 0–100, so High vs Medium is a number rather than a feeling. */
	riskScore: number;
	/** §6.11 — the weighted factors the score is built from. */
	factorBreakdown: RiskFactor[];
	/** §6.13 — what the manager should actually do about it. */
	recommendedAction: string;
	// §6.15 — the trend fields that give the score context.
	lastPromotionDate?: string;
	lastSalaryReview?: string;
	lastPerformanceRating?: string;
	engagementScore?: number;
	lastLearningActivity?: string;
	manager?: string;
}

/** Score thresholds. Kept here so the table, cards and filters agree. */
export function riskLevelForScore(score: number): AttritionRiskLevel {
	if (score >= 70) return "high";
	if (score >= 40) return "medium";
	return "low";
}

/**
 * §6.13 — the action that matches the dominant risk factor, rather than a
 * generic "monitor" for everyone.
 */
export function recommendedRetentionAction(
	level: AttritionRiskLevel,
	factors: RiskFactor[],
): string {
	if (level === "low") return "No action needed";
	const top = [...factors].sort((a, b) => b.weight - a.weight)[0]?.label ?? "";
	if (/salary|market/i.test(top)) return "Salary benchmarking review";
	if (/promotion|tenure|role change/i.test(top)) {
		return level === "high"
			? "Career development discussion"
			: "Review progression opportunities";
	}
	if (/performance|rating/i.test(top)) return "Performance support plan";
	if (/engagement|survey/i.test(top)) return "1:1 engagement check-in";
	if (/learning|training/i.test(top)) return "Learning & Development plan";
	if (/absence|absenteeism/i.test(top)) return "Wellbeing conversation";
	if (/manager/i.test(top)) return "Manager transition support";
	return level === "high"
		? "Career development discussion"
		: "Review progression opportunities";
}

export interface DemographicsItem {
	label: string;
	value: number;
	count?: number;
	percentage?: number;
	/**
	 * Drill-through target — the filtered employee list behind this segment
	 * (client feedback §6.25). Omitted when no equivalent filter exists.
	 */
	href?: string;
}
