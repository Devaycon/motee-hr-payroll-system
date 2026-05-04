export type AnnouncementStatus =
	| "draft"
	| "scheduled"
	| "published"
	| "expired"
	| "archived";

export type AnnouncementType =
	| "general"
	| "policy"
	| "event"
	| "urgent";

export type AnnouncementAudience =
	| "all_staff"
	| "department"
	| "leadership"
	| "managers";

export type AnnouncementPriority = "standard" | "urgent";

export interface AnnouncementAcknowledgement {
	id: string;
	employeeName: string;
	employeeInitials: string;
	department: string;
	acknowledgedAt: string;
}

export interface Announcement {
	id: string;
	title: string;
	body: string;
	type: AnnouncementType;
	status: AnnouncementStatus;
	priority: AnnouncementPriority;
	audience: AnnouncementAudience;
	targetDepartments?: string[];
	isPinned: boolean;
	requiresAcknowledgement: boolean;
	scheduledFor?: string;
	expiresAt?: string;
	attachmentName?: string;
	createdAt: string;
	createdBy: string;
	createdByInitials: string;
	viewCount: number;
	acknowledgements: AnnouncementAcknowledgement[];
	totalTargeted: number;
	publishedAt?: string;
	isArchived: boolean;
}

export interface NewAnnouncement {
	title: string;
	body: string;
	type: AnnouncementType;
	status: AnnouncementStatus;
	priority: AnnouncementPriority;
	audience: AnnouncementAudience;
	targetDepartments?: string[];
	isPinned: boolean;
	requiresAcknowledgement: boolean;
	scheduledFor?: string;
	expiresAt?: string;
	attachmentName?: string;
}

