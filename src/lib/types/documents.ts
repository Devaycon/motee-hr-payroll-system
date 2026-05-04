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
}

export interface NewShare {
	employeeName: string;
	employeeInitials: string;
	permission: DocumentPermission;
}

