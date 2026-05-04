export type GapStatus = "under" | "on_target" | "over";

export type PlanPeriod =
	| "Q1 2026"
	| "Q2 2026"
	| "Q3 2026"
	| "Q4 2026"
	| "FY 2026";

export type AttritionRiskLevel = "low" | "medium" | "high";

export interface HeadcountPlan {
	id: string;
	department: string;
	period: PlanPeriod;
	target: number;
	actual: number;
	gapStatus: GapStatus;
}

export interface NewHeadcountPlan {
	department: string;
	period: PlanPeriod;
	target: number;
}

export interface AttritionRisk {
	id: string;
	employeeName: string;
	initials: string;
	jobTitle: string;
	department: string;
	tenureYears: number;
	riskLevel: AttritionRiskLevel;
	riskFactors: string[];
}

export interface DemographicsItem {
	label: string;
	value: number;
	count?: number;
	percentage?: number;
}
