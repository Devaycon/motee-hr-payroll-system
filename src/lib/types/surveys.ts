export type SurveyStatus =
	| "draft"
	| "scheduled"
	| "active"
	| "closed"
	| "archived";

export type SurveyType = "engagement" | "pulse" | "enps" | "onboarding";

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

