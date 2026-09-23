export type SurveyStatus =
	| "draft"
	| "scheduled"
	| "active"
	| "closed"
	| "archived";

// §6 (Correction 2 feedback) — "Exit" and "Manager & Leadership" added to
// give the employee lifecycle a Join → Experience → Leave arc (onboarding
// already covered "join"; exit was the missing "leave" bookend). No
// separate "Satisfaction" category per §6.3 — the client's own reasoning:
// it would duplicate what Engagement/Pulse/Benefits/Onboarding already
// measure and confuse HR admins choosing between near-identical types.
export type SurveyType =
	| "engagement"
	| "pulse"
	| "enps"
	| "onboarding"
	| "exit"
	| "manager_leadership";

export type QuestionType =
	| "multiple_choice"
	| "rating"
	| "likert"
	| "open_text"
	| "nps"
	| "yes_no";

export type SurveyAudience = "all_staff" | "department" | "managers";

export type PulseFrequency =
	| "weekly"
	| "bi_weekly"
	| "monthly"
	| "quarterly";

export interface SurveyQuestion {
	id: string;
	text: string;
	type: QuestionType;
	required: boolean;
	options?: string[];
	scaleMin?: number;
	scaleMax?: number;
}

export interface QuestionResponse {
	questionId: string;
	answers: string[];
}

export interface SurveyResponse {
	id: string;
	respondentName?: string;
	respondentInitials?: string;
	respondentDept?: string;
	submittedAt: string;
	answers: QuestionResponse[];
}

export interface Survey {
	id: string;
	title: string;
	description: string;
	type: SurveyType;
	status: SurveyStatus;
	audience: SurveyAudience;
	targetDepartments?: string[];
	isAnonymous: boolean;
	sendReminder: boolean;
	questions: SurveyQuestion[];
	responses: SurveyResponse[];
	totalTargeted: number;
	startDate?: string;
	endDate?: string;
	pulseFrequency?: PulseFrequency;
	createdAt: string;
	createdBy: string;
	createdByInitials: string;
	isArchived: boolean;
}

export interface NewSurvey {
	title: string;
	description: string;
	type: SurveyType;
	status: SurveyStatus;
	audience: SurveyAudience;
	targetDepartments?: string[];
	isAnonymous: boolean;
	sendReminder: boolean;
	questions: Omit<SurveyQuestion, "id">[];
	totalTargeted: number;
	startDate?: string;
	endDate?: string;
	pulseFrequency?: PulseFrequency;
}

export interface EngagementTrendPoint {
	month: string;
	companyWide: number;
	engineering: number;
	marketing: number;
	sales: number;
	hr: number;
	operations: number;
}

export interface SurveyTemplate {
	id: string;
	name: string;
	description: string;
	type: SurveyType;
	questions: Omit<SurveyQuestion, "id">[];
}

