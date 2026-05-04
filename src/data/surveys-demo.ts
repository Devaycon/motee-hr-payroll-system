import type {
	EngagementTrendPoint,
	PulseFrequency,
	Survey,
	SurveyAudience,
	SurveyResponse,
	SurveyStatus,
	SurveyTemplate,
	SurveyType,
} from "@/src/lib/types/surveys";

export const SURVEY_TYPE_CONFIG = {
	engagement: {
		label: "Engagement",
		emoji: "📊",
		color: "text-blue-600 dark:text-blue-400",
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
	},
	pulse: {
		label: "Pulse",
		emoji: "💓",
		color: "text-rose-600 dark:text-rose-400",
		bg: "bg-rose-500/10",
		border: "border-rose-500/20",
	},
	enps: {
		label: "eNPS",
		emoji: "⭐",
		color: "text-amber-600 dark:text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
	},
	onboarding: {
		label: "Onboarding",
		emoji: "🚀",
		color: "text-emerald-600 dark:text-emerald-400",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
	},
} as const satisfies Record<
	SurveyType,
	{ label: string; emoji: string; color: string; bg: string; border: string }
>;

export const SURVEY_STATUS_CONFIG = {
	draft: {
		label: "Draft",
		color: "text-slate-600 dark:text-slate-400",
		bg: "bg-slate-500/10",
		border: "border-slate-500/20",
	},
	scheduled: {
		label: "Scheduled",
		color: "text-amber-600 dark:text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/20",
	},
	active: {
		label: "Active",
		color: "text-emerald-600 dark:text-emerald-400",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
	},
	closed: {
		label: "Closed",
		color: "text-red-600 dark:text-red-400",
		bg: "bg-red-500/10",
		border: "border-red-500/20",
	},
	archived: {
		label: "Archived",
		color: "text-zinc-600 dark:text-zinc-400",
		bg: "bg-zinc-500/10",
		border: "border-zinc-500/20",
	},
} as const satisfies Record<
	SurveyStatus,
	{ label: string; color: string; bg: string; border: string }
>;

export const SURVEY_TYPE_OPTIONS: SurveyType[] = [
	"engagement",
	"pulse",
	"enps",
	"onboarding",
];

export const SURVEY_STATUS_OPTIONS: SurveyStatus[] = [
	"draft",
	"scheduled",
	"active",
	"closed",
	"archived",
];

export const AUDIENCE_OPTIONS: SurveyAudience[] = [
	"all_staff",
	"department",
	"managers",
];

export const AUDIENCE_LABEL: Record<SurveyAudience, string> = {
	all_staff: "All Employees",
	department: "Department",
	managers: "Managers",
};

export const PULSE_FREQUENCY_OPTIONS: PulseFrequency[] = [
	"weekly",
	"bi_weekly",
	"monthly",
	"quarterly",
];

export const PULSE_FREQUENCY_LABEL: Record<PulseFrequency, string> = {
	weekly: "Weekly",
	bi_weekly: "Bi-weekly",
	monthly: "Monthly",
	quarterly: "Quarterly",
};

export const DEPARTMENTS = [
	"Engineering",
	"Finance",
	"HR",
	"Marketing",
	"Operations",
	"Product",
	"Sales",
];

export const SURVEY_TEMPLATES: SurveyTemplate[] = [
	{
		id: "tmpl-engagement",
		name: "Quarterly Engagement Survey",
		description: "Standard quarterly engagement check across teams.",
		type: "engagement",
		questions: [
			{
				text: "How satisfied are you with your overall experience at work?",
				type: "rating",
				required: true,
				scaleMin: 1,
				scaleMax: 5,
			},
			{
				text: "I have the tools I need to do my job effectively.",
				type: "likert",
				required: true,
				options: [
					"Strongly Agree",
					"Agree",
					"Neutral",
					"Disagree",
					"Strongly Disagree",
				],
			},
			{
				text: "What one thing would improve your experience most this quarter?",
				type: "open_text",
				required: false,
			},
		],
	},
	{
		id: "tmpl-enps",
		name: "Employee NPS Survey",
		description: "Measure employee advocacy and sentiment.",
		type: "enps",
		questions: [
			{
				text: "How likely are you to recommend this company as a place to work?",
				type: "nps",
				required: true,
				scaleMin: 0,
				scaleMax: 10,
			},
			{
				text: "What is the primary reason for your score?",
				type: "open_text",
				required: false,
			},
		],
	},
	{
		id: "tmpl-onboarding",
		name: "New Hire Onboarding Survey",
		description: "Capture onboarding quality and early employee sentiment.",
		type: "onboarding",
		questions: [
			{
				text: "My onboarding process prepared me to succeed in my role.",
				type: "likert",
				required: true,
				options: [
					"Strongly Agree",
					"Agree",
					"Neutral",
					"Disagree",
					"Strongly Disagree",
				],
			},
			{
				text: "Did you receive the equipment you needed on time?",
				type: "yes_no",
				required: true,
			},
		],
	},
];

function makeResponse(
	id: string,
	respondentName: string,
	respondentInitials: string,
	respondentDept: string,
	submittedAt: string,
	answers: SurveyResponse["answers"],
): SurveyResponse {
	return {
		id,
		respondentName,
		respondentInitials,
		respondentDept,
		submittedAt,
		answers,
	};
}

export const SURVEYS: Survey[] = [
	{
		id: "SRV-001",
		title: "Q1 Employee Engagement Survey",
		description: "Quarterly pulse on morale, workload, and leadership confidence.",
		type: "engagement",
		status: "active",
		audience: "all_staff",
		isAnonymous: true,
		sendReminder: true,
		questions: [
			{
				id: "q1",
				text: "How satisfied are you with your role overall?",
				type: "rating",
				required: true,
				scaleMin: 1,
				scaleMax: 5,
			},
			{
				id: "q2",
				text: "I feel supported by my manager.",
				type: "likert",
				required: true,
				options: [
					"Strongly Agree",
					"Agree",
					"Neutral",
					"Disagree",
					"Strongly Disagree",
				],
			},
			{
				id: "q3",
				text: "What should we improve this quarter?",
				type: "open_text",
				required: false,
			},
		],
		responses: [
			makeResponse("resp-001", "Adaeze Okonkwo", "AO", "Engineering", "2026-03-28", [
				{ questionId: "q1", answers: ["5"] },
				{ questionId: "q2", answers: ["Agree"] },
				{ questionId: "q3", answers: ["More uninterrupted focus time."] },
			]),
			makeResponse("resp-002", "Blessing Okafor", "BO", "Finance", "2026-03-29", [
				{ questionId: "q1", answers: ["4"] },
				{ questionId: "q2", answers: ["Strongly Agree"] },
				{ questionId: "q3", answers: ["Clearer roadmap updates from leadership."] },
			]),
			makeResponse("resp-003", "Ibrahim Suleiman", "IS", "Operations", "2026-03-30", [
				{ questionId: "q1", answers: ["4"] },
				{ questionId: "q2", answers: ["Neutral"] },
				{ questionId: "q3", answers: ["Faster approval turnaround."] },
			]),
		],
		totalTargeted: 120,
		startDate: "2026-03-25",
		endDate: "2026-04-08",
		createdAt: "2026-03-20",
		createdBy: "HR Admin",
		createdByInitials: "HA",
		isArchived: false,
	},
	{
		id: "SRV-002",
		title: "Monthly eNPS Check-in",
		description: "Track employee advocacy with a lightweight recurring survey.",
		type: "pulse",
		status: "active",
		audience: "all_staff",
		isAnonymous: true,
		sendReminder: true,
		questions: [
			{
				id: "q1",
				text: "How likely are you to recommend the company as a place to work?",
				type: "nps",
				required: true,
				scaleMin: 0,
				scaleMax: 10,
			},
			{
				id: "q2",
				text: "What influenced your score the most?",
				type: "open_text",
				required: false,
			},
		],
		responses: [
			makeResponse("resp-004", "Chidinma Okeke", "CO", "HR", "2026-04-01", [
				{ questionId: "q1", answers: ["9"] },
				{ questionId: "q2", answers: ["Great collaboration across teams."] },
			]),
			makeResponse("resp-005", "Aisha Bello", "AB", "Marketing", "2026-04-01", [
				{ questionId: "q1", answers: ["8"] },
				{ questionId: "q2", answers: ["Campaign workload is high but manageable."] },
			]),
			makeResponse("resp-006", "Yusuf Garba", "YG", "HR", "2026-04-02", [
				{ questionId: "q1", answers: ["6"] },
				{ questionId: "q2", answers: ["Need quicker tooling support."] },
			]),
		],
		totalTargeted: 120,
		startDate: "2026-04-01",
		endDate: "2026-04-05",
		pulseFrequency: "monthly",
		createdAt: "2026-03-31",
		createdBy: "HR Admin",
		createdByInitials: "HA",
		isArchived: false,
	},
	{
		id: "SRV-003",
		title: "30-Day Onboarding Feedback",
		description: "Collect feedback from recent hires after their first month.",
		type: "onboarding",
		status: "closed",
		audience: "department",
		targetDepartments: ["Engineering", "Product", "HR"],
		isAnonymous: false,
		sendReminder: false,
		questions: [
			{
				id: "q1",
				text: "My onboarding helped me understand my role.",
				type: "likert",
				required: true,
				options: [
					"Strongly Agree",
					"Agree",
					"Neutral",
					"Disagree",
					"Strongly Disagree",
				],
			},
			{
				id: "q2",
				text: "Did you receive all required tools on time?",
				type: "yes_no",
				required: true,
			},
		],
		responses: [
			makeResponse("resp-007", "Seun Adeyemi", "SA", "Engineering", "2026-03-15", [
				{ questionId: "q1", answers: ["Strongly Agree"] },
				{ questionId: "q2", answers: ["Yes"] },
			]),
			makeResponse("resp-008", "Ngozi Obasi", "NO", "Finance", "2026-03-16", [
				{ questionId: "q1", answers: ["Agree"] },
				{ questionId: "q2", answers: ["Yes"] },
			]),
		],
		totalTargeted: 12,
		startDate: "2026-03-01",
		endDate: "2026-03-20",
		createdAt: "2026-02-28",
		createdBy: "HR Admin",
		createdByInitials: "HA",
		isArchived: false,
	},
	{
		id: "SRV-004",
		title: "Leadership Communication Survey",
		description: "Archived sample survey retained for historical reporting.",
		type: "engagement",
		status: "archived",
		audience: "managers",
		isAnonymous: true,
		sendReminder: false,
		questions: [
			{
				id: "q1",
				text: "Leadership communicates priorities clearly.",
				type: "rating",
				required: true,
				scaleMin: 1,
				scaleMax: 5,
			},
		],
		responses: [],
		totalTargeted: 18,
		createdAt: "2025-12-01",
		createdBy: "People Ops",
		createdByInitials: "PO",
		isArchived: true,
	},
];

export function getResponseRate(survey: Survey): number {
	if (survey.totalTargeted <= 0) return 0;
	return Math.round((survey.responses.length / survey.totalTargeted) * 100);
}

export function computeNpsBreakdown(survey: Survey) {
	const npsAnswers = survey.responses.flatMap((response) =>
		response.answers
			.filter((answer) =>
				survey.questions.some(
					(question) => question.id === answer.questionId && question.type === "nps",
				),
			)
			.flatMap((answer) => answer.answers)
			.map((answer) => parseInt(answer, 10))
			.filter((answer) => !Number.isNaN(answer)),
	);

	const promoters = npsAnswers.filter((score) => score >= 9).length;
	const passives = npsAnswers.filter((score) => score >= 7 && score <= 8).length;
	const detractors = npsAnswers.filter((score) => score <= 6).length;
	const total = npsAnswers.length;
	const score =
		total === 0
			? 0
			: Math.round(((promoters / total) * 100) - ((detractors / total) * 100));

	return { promoters, passives, detractors, score };
}

export function getEngagementScore(surveys: Survey[]): number {
	const activeOrClosed = surveys.filter((survey) => !survey.isArchived);
	if (activeOrClosed.length === 0) return 0;

	const scores = activeOrClosed.map((survey) => {
		if (survey.questions.some((question) => question.type === "nps")) {
			const nps = computeNpsBreakdown(survey).score;
			return Math.round((nps + 100) / 2);
		}
		return getResponseRate(survey);
	});

	return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export const ENGAGEMENT_TREND_DATA: EngagementTrendPoint[] = [
	{ month: "May", companyWide: 72, engineering: 74, marketing: 69, sales: 68, hr: 76, operations: 71 },
	{ month: "Jun", companyWide: 74, engineering: 76, marketing: 70, sales: 69, hr: 77, operations: 72 },
	{ month: "Jul", companyWide: 73, engineering: 75, marketing: 71, sales: 68, hr: 76, operations: 70 },
	{ month: "Aug", companyWide: 75, engineering: 77, marketing: 72, sales: 70, hr: 78, operations: 73 },
	{ month: "Sep", companyWide: 76, engineering: 79, marketing: 73, sales: 71, hr: 79, operations: 74 },
	{ month: "Oct", companyWide: 78, engineering: 80, marketing: 75, sales: 73, hr: 81, operations: 76 },
	{ month: "Nov", companyWide: 77, engineering: 79, marketing: 74, sales: 72, hr: 80, operations: 75 },
	{ month: "Dec", companyWide: 79, engineering: 82, marketing: 76, sales: 74, hr: 82, operations: 77 },
	{ month: "Jan", companyWide: 80, engineering: 83, marketing: 77, sales: 75, hr: 83, operations: 78 },
	{ month: "Feb", companyWide: 81, engineering: 84, marketing: 78, sales: 76, hr: 84, operations: 79 },
	{ month: "Mar", companyWide: 82, engineering: 85, marketing: 79, sales: 77, hr: 85, operations: 80 },
	{ month: "Apr", companyWide: 84, engineering: 87, marketing: 81, sales: 79, hr: 86, operations: 82 },
];

export const ENGAGEMENT_CHART_CONFIG = {
	companyWide: { label: "Company Wide", color: "hsl(var(--chart-1))" },
	engineering: { label: "Engineering", color: "hsl(var(--chart-2))" },
	marketing: { label: "Marketing", color: "hsl(var(--chart-3))" },
	sales: { label: "Sales", color: "hsl(var(--chart-4))" },
	hr: { label: "HR", color: "hsl(var(--chart-5))" },
	operations: { label: "Operations", color: "hsl(221, 70%, 55%)" },
};

