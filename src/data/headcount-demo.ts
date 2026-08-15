import type {
	AttritionRisk,
	AttritionRiskLevel,
	DemographicsItem,
	GapStatus,
	HeadcountPlan,
	PlanPeriod,
} from "@/src/lib/types/headcount";

export const PLAN_PERIODS: PlanPeriod[] = [
	"Q1 2026",
	"Q2 2026",
	"Q3 2026",
	"Q4 2026",
	"FY 2026",
];

export const DEPARTMENT_OPTIONS = [
	"Engineering",
	"Finance",
	"HR",
	"Marketing",
	"Operations",
	"Product",
	"Sales",
];

export const GAP_STATUS_LABELS: Record<GapStatus, string> = {
	under: "Under",
	on_target: "On Target",
	over: "Over",
};

export const GAP_STATUS_STYLES: Record<GapStatus, string> = {
	under: "bg-red-500/10 text-red-600 border-red-500/20",
	on_target: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
	over: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

/**
 * Presentation-only grading of a headcount gap (client feedback §6.7, §6.33).
 *
 * The client wants four badges where `GapStatus` only stores three states, so
 * severity is derived from the gap magnitude at render time — no stored data
 * or type changes, and "under" keeps splitting into critical vs slight.
 */
export type GapSeverity =
	| "critical"
	| "slightly_under"
	| "on_target"
	| "over_capacity";

export const GAP_SEVERITY_LABELS: Record<GapSeverity, string> = {
	critical: "Critical Gap",
	slightly_under: "Slightly Under",
	on_target: "On Target",
	over_capacity: "Over Capacity",
};

export const GAP_SEVERITY_STYLES: Record<GapSeverity, string> = {
	critical: "bg-red-500/10 text-red-600 border-red-500/20",
	slightly_under: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	on_target: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
	over_capacity: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

/** Grade a plan by how far actual headcount sits from target. */
export function gapSeverity(actual: number, target: number): GapSeverity {
	const gap = actual - target;
	if (gap > 0) return "over_capacity";
	if (gap === 0) return "on_target";
	return gap <= -3 ? "critical" : "slightly_under";
}

export const RISK_LABELS: Record<AttritionRiskLevel, string> = {
	low: "Low",
	medium: "Medium",
	high: "High",
};

export const RISK_STYLES: Record<AttritionRiskLevel, string> = {
	low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
	medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	high: "bg-red-500/10 text-red-600 border-red-500/20",
};

export const HEADCOUNT_PLANS: HeadcountPlan[] = [
	{ id: "hc-001", department: "Engineering", period: "Q1 2026", target: 24, actual: 21, gapStatus: "under" },
	{ id: "hc-002", department: "Finance", period: "Q1 2026", target: 8, actual: 8, gapStatus: "on_target" },
	{ id: "hc-003", department: "HR", period: "Q1 2026", target: 6, actual: 5, gapStatus: "under" },
	{ id: "hc-004", department: "Marketing", period: "Q1 2026", target: 9, actual: 10, gapStatus: "over" },
	{ id: "hc-005", department: "Operations", period: "Q1 2026", target: 12, actual: 11, gapStatus: "under" },
	{ id: "hc-006", department: "Product", period: "Q1 2026", target: 7, actual: 7, gapStatus: "on_target" },
	{ id: "hc-007", department: "Sales", period: "Q1 2026", target: 15, actual: 16, gapStatus: "over" },
	{ id: "hc-008", department: "Engineering", period: "Q2 2026", target: 26, actual: 22, gapStatus: "under" },
	{ id: "hc-009", department: "Finance", period: "Q2 2026", target: 9, actual: 8, gapStatus: "under" },
	{ id: "hc-010", department: "HR", period: "Q2 2026", target: 6, actual: 6, gapStatus: "on_target" },
];

export const ATTRITION_RISKS: AttritionRisk[] = [
	{
		id: "ar-001",
		employeeName: "Chukwuemeka Eze",
		initials: "CE",
		jobTitle: "Backend Engineer",
		department: "Engineering",
		tenureYears: 2,
		riskLevel: "high",
		riskScore: 78,
		factorBreakdown: [
			{ label: "No promotion in 24 months", weight: 35 },
			{ label: "High workload", weight: 25 },
			{ label: "Manager change", weight: 18 },
		],
		riskFactors: ["No promotion in 24 months", "High workload", "Manager change"],
		recommendedAction: "Career development discussion",
	},
	{
		id: "ar-002",
		employeeName: "Aisha Bello",
		initials: "AB",
		jobTitle: "Brand Manager",
		department: "Marketing",
		tenureYears: 3,
		riskLevel: "medium",
		riskScore: 52,
		factorBreakdown: [
			{ label: "Market salary variance", weight: 32 },
			{ label: "Recent absenteeism", weight: 20 },
		],
		riskFactors: ["Market salary variance", "Recent absenteeism"],
		recommendedAction: "Salary benchmarking review",
	},
	{
		id: "ar-003",
		employeeName: "Yusuf Garba",
		initials: "YG",
		jobTitle: "HR Officer",
		department: "HR",
		tenureYears: 1,
		riskLevel: "low",
		riskScore: 18,
		factorBreakdown: [{ label: "New manager transition", weight: 18 }],
		riskFactors: ["New manager transition"],
		recommendedAction: "No action needed",
	},
];

export const DEMOGRAPHICS_EMPLOYMENT_TYPE: DemographicsItem[] = [
	{ label: "Full-time", value: 62 },
	{ label: "Contract", value: 11 },
	{ label: "Intern", value: 4 },
];

export const DEMOGRAPHICS_TENURE: DemographicsItem[] = [
	{ label: "< 1 year", value: 18 },
	{ label: "1-3 years", value: 34 },
	{ label: "3-5 years", value: 17 },
	{ label: "5+ years", value: 8 },
];

export const DEMOGRAPHICS_DEPARTMENT: DemographicsItem[] = [
	{ label: "Engineering", value: 21 },
	{ label: "Sales", value: 16 },
	{ label: "Operations", value: 11 },
	{ label: "Marketing", value: 10 },
	{ label: "Finance", value: 8 },
	{ label: "Product", value: 7 },
	{ label: "HR", value: 5 },
];

