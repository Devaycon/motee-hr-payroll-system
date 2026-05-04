import type {
	Announcement,
	AnnouncementAudience,
	AnnouncementStatus,
	AnnouncementType,
} from "@/src/lib/types/announcements";

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
	general: "General",
	policy: "Policy",
	event: "Event",
	urgent: "Urgent",
};

export const ANNOUNCEMENT_TYPE_STYLES: Record<AnnouncementType, string> = {
	general: "bg-blue-500/10 text-blue-600 border-blue-500/20",
	policy: "bg-violet-500/10 text-violet-600 border-violet-500/20",
	event: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
	urgent: "bg-red-500/10 text-red-600 border-red-500/20",
};

export const ANNOUNCEMENT_TYPE_BORDER: Record<AnnouncementType, string> = {
	general: "border-l-blue-500",
	policy: "border-l-violet-500",
	event: "border-l-emerald-500",
	urgent: "border-l-red-500",
};

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
	draft: "Draft",
	scheduled: "Scheduled",
	published: "Published",
	expired: "Expired",
	archived: "Archived",
};

export const ANNOUNCEMENT_STATUS_STYLES: Record<AnnouncementStatus, string> = {
	draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
	scheduled: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	published: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
	expired: "bg-orange-500/10 text-orange-600 border-orange-500/20",
	archived: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
};

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
	all_staff: "All Employees",
	department: "Department",
	leadership: "Leadership Team",
	managers: "Managers",
};

export const ANNOUNCEMENT_TYPE_OPTIONS: AnnouncementType[] = [
	"general",
	"policy",
	"event",
	"urgent",
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

export const ANNOUNCEMENTS: Announcement[] = [
	{
		id: "ANN-001",
		title: "Q2 All-Hands Meeting",
		body: "Join the company-wide all-hands on Friday at 10:00 AM in the main townhall space. The leadership team will share roadmap updates and answer live questions.",
		type: "event",
		status: "published",
		priority: "standard",
		audience: "all_staff",
		isPinned: true,
		requiresAcknowledgement: false,
		createdAt: "2026-04-01",
		createdBy: "HR Admin",
		createdByInitials: "HA",
		viewCount: 142,
		acknowledgements: [],
		totalTargeted: 156,
		publishedAt: "2026-04-01",
		isArchived: false,
	},
	{
		id: "ANN-002",
		title: "Updated Remote Work Policy",
		body: "We have updated the remote work policy to clarify eligibility, equipment support, and in-office collaboration expectations. Please review and acknowledge by end of week.",
		type: "policy",
		status: "published",
		priority: "urgent",
		audience: "all_staff",
		isPinned: false,
		requiresAcknowledgement: true,
		createdAt: "2026-03-28",
		createdBy: "Chidinma Okeke",
		createdByInitials: "CO",
		viewCount: 131,
		acknowledgements: [
			{ id: "ACK-001", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering", acknowledgedAt: "2026-03-29" },
			{ id: "ACK-002", employeeName: "Blessing Okafor", employeeInitials: "BO", department: "Finance", acknowledgedAt: "2026-03-29" },
			{ id: "ACK-003", employeeName: "Ibrahim Suleiman", employeeInitials: "IS", department: "Operations", acknowledgedAt: "2026-03-30" },
		],
		totalTargeted: 156,
		publishedAt: "2026-03-28",
		isArchived: false,
	},
	{
		id: "ANN-003",
		title: "Engineering Sprint Demo Schedule",
		body: "Engineering and Product teams should note the revised sprint demo schedule. Demo sessions now begin every second Thursday at 2:00 PM.",
		type: "general",
		status: "published",
		priority: "standard",
		audience: "department",
		targetDepartments: ["Engineering", "Product"],
		isPinned: false,
		requiresAcknowledgement: false,
		createdAt: "2026-03-20",
		createdBy: "Adaeze Okonkwo",
		createdByInitials: "AO",
		viewCount: 64,
		acknowledgements: [],
		totalTargeted: 30,
		publishedAt: "2026-03-20",
		isArchived: false,
	},
	{
		id: "ANN-004",
		title: "Payroll Processing Window",
		body: "Payroll inputs for April close on April 22. Department heads should submit all approved overtime and leave adjustments before close of business.",
		type: "urgent",
		status: "scheduled",
		priority: "urgent",
		audience: "managers",
		isPinned: false,
		requiresAcknowledgement: true,
		scheduledFor: "2026-04-10",
		createdAt: "2026-04-04",
		createdBy: "Finance Team",
		createdByInitials: "FT",
		viewCount: 0,
		acknowledgements: [],
		totalTargeted: 18,
		isArchived: false,
	},
	{
		id: "ANN-005",
		title: "2025 End-of-Year Party Highlights",
		body: "Thanks to everyone who joined the end-of-year celebration. Photos and recap materials remain available for reference.",
		type: "event",
		status: "archived",
		priority: "standard",
		audience: "all_staff",
		isPinned: false,
		requiresAcknowledgement: false,
		createdAt: "2025-12-18",
		createdBy: "People Ops",
		createdByInitials: "PO",
		viewCount: 233,
		acknowledgements: [],
		totalTargeted: 156,
		publishedAt: "2025-12-18",
		isArchived: true,
	},
];

