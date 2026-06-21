export type DocumentFileType =
	| "pdf"
	| "doc"
	| "docx"
	| "png"
	| "jpg"
	| "jpeg";

export type DocumentCategory =
	| "id_card"
	| "contract"
	| "policy"
	| "certificate"
	| "report"
	| "other";

export type DocumentPermission = "view_only" | "download";

export type FolderType = "system" | "personal" | "archive" | "custom" | "shared" | "trash";

export interface DocumentVersion {
	id: string;
	version: number;
	uploadedAt: string;
	uploadedBy: string;
	fileSize: number;
	notes?: string;
}

export interface DocumentShare {
	id: string;
	employeeName: string;
	employeeInitials: string;
	permission: DocumentPermission;
	sharedAt: string;
	sharedBy: string;
}

/** Who a document is assigned to. */
export type DocumentAssignmentScope = "global" | "department" | "specific";

export interface DocumentAssignment {
	scope: DocumentAssignmentScope;
	/** Department names when scope is "department". */
	departments?: string[];
}

/** Record of an employee who has read & acknowledged a document. */
export interface DocumentAcknowledgement {
	id: string;
	employeeName: string;
	employeeInitials: string;
	department: string;
	acknowledgedAt: string;
}

export interface HRDocument {
	id: string;
	name: string;
	fileType: DocumentFileType;
	category: DocumentCategory;
	folderId: string;
	description?: string;
	fileSize: number;
	expiryDate?: string;
	uploadedAt: string;
	uploadedBy: string;
	isArchived: boolean;
	isTrashed?: boolean;
	trashedAt?: string;
	versions: DocumentVersion[];
	shares: DocumentShare[];
	/** Assignment scope — defaults to "specific" (per-employee shares) when omitted. */
	assignment?: DocumentAssignment;
	/** When true, assigned employees must read & acknowledge the document. */
	requiresAcknowledgement?: boolean;
	/** Employees who have acknowledged the document. */
	acknowledgements?: DocumentAcknowledgement[];
	/** Headcount the document is assigned to (for acknowledgement reporting). */
	totalAssigned?: number;
}

export interface Folder {
	id: string;
	name: string;
	type: FolderType;
	parentId?: string;
	createdAt: string;
	createdBy: string;
}

export interface NewDocument {
	name: string;
	fileType: DocumentFileType;
	category: DocumentCategory;
	folderId: string;
	description?: string;
	fileSize: number;
	expiryDate?: string;
	assignment?: DocumentAssignment;
	requiresAcknowledgement?: boolean;
}

export interface NewShare {
	employeeName: string;
	employeeInitials: string;
	permission: DocumentPermission;
}

