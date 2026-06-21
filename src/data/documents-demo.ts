import type {
	DocumentCategory,
	DocumentFileType,
	DocumentPermission,
	Folder,
	HRDocument,
} from "@/src/lib/types/documents";

export const FILE_TYPE_LABELS: Record<DocumentFileType, string> = {
	pdf: "PDF",
	doc: "DOC",
	docx: "DOCX",
	png: "PNG",
	jpg: "JPG",
	jpeg: "JPEG",
};

export const FILE_TYPE_STYLES: Record<
	DocumentFileType,
	{ bg: string; border: string; text: string }
> = {
	pdf: {
		bg: "bg-red-500/10",
		border: "border-red-500/20",
		text: "text-red-600 dark:text-red-400",
	},
	doc: {
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
		text: "text-blue-600 dark:text-blue-400",
	},
	docx: {
		bg: "bg-blue-500/10",
		border: "border-blue-500/20",
		text: "text-blue-600 dark:text-blue-400",
	},
	png: {
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
		text: "text-emerald-600 dark:text-emerald-400",
	},
	jpg: {
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
		text: "text-emerald-600 dark:text-emerald-400",
	},
	jpeg: {
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/20",
		text: "text-emerald-600 dark:text-emerald-400",
	},
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
	id_card: "ID Card",
	contract: "Contract",
	policy: "Policy",
	certificate: "Certificate",
	report: "Report",
	other: "Other",
};

export const DOCUMENT_CATEGORY_STYLES: Record<DocumentCategory, string> = {
	id_card: "bg-violet-500/10 text-violet-600 border-violet-500/20",
	contract: "bg-blue-500/10 text-blue-600 border-blue-500/20",
	policy: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	certificate: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
	report: "bg-sky-500/10 text-sky-600 border-sky-500/20",
	other: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export const DOCUMENT_CATEGORY_OPTIONS: DocumentCategory[] = [
	"id_card",
	"contract",
	"policy",
	"certificate",
	"report",
	"other",
];

export const FOLDERS: Folder[] = [
	{
		id: "sys",
		name: "Company Documents",
		type: "system",
		createdAt: "2025-01-01",
		createdBy: "HR Admin",
	},
	{
		id: "sys-pol",
		name: "Policies",
		type: "system",
		parentId: "sys",
		createdAt: "2025-01-01",
		createdBy: "HR Admin",
	},
	{
		id: "sys-con",
		name: "Contracts",
		type: "system",
		parentId: "sys",
		createdAt: "2025-01-01",
		createdBy: "HR Admin",
	},
	{
		id: "sys-cer",
		name: "Certificates",
		type: "system",
		parentId: "sys",
		createdAt: "2025-01-01",
		createdBy: "HR Admin",
	},
	{
		id: "per",
		name: "Personnel Files",
		type: "personal",
		createdAt: "2025-01-01",
		createdBy: "HR Admin",
	},
	{
		id: "arch",
		name: "Archive",
		type: "archive",
		createdAt: "2025-01-01",
		createdBy: "HR Admin",
	},
	{
		id: "shared",
		name: "Shared",
		type: "shared",
		createdAt: "2025-01-01",
		createdBy: "System",
	},
	{
		id: "trash",
		name: "Trash",
		type: "trash",
		createdAt: "2025-01-01",
		createdBy: "System",
	},
];

function share(
	id: string,
	employeeName: string,
	employeeInitials: string,
	permission: DocumentPermission,
	sharedAt: string,
	sharedBy = "HR Admin",
) {
	return {
		id,
		employeeName,
		employeeInitials,
		permission,
		sharedAt,
		sharedBy,
	};
}

export const DOCUMENTS: HRDocument[] = [
	{
		id: "DOC-001",
		name: "Employee Handbook 2026",
		fileType: "pdf",
		category: "policy",
		folderId: "sys-pol",
		description: "Updated employee handbook covering policies and benefits.",
		fileSize: 3145728,
		uploadedAt: "2026-01-10",
		uploadedBy: "HR Admin",
		isArchived: false,
		versions: [
			{
				id: "V-DOC-001-2",
				version: 2,
				uploadedAt: "2026-01-10",
				uploadedBy: "HR Admin",
				fileSize: 3145728,
				notes: "Updated annual leave section.",
			},
			{
				id: "V-DOC-001-1",
				version: 1,
				uploadedAt: "2025-01-12",
				uploadedBy: "HR Admin",
				fileSize: 2883584,
			},
		],
		shares: [share("SH-001", "Adaeze Okonkwo", "AO", "view_only", "2026-01-12")],
		assignment: { scope: "global" },
		requiresAcknowledgement: true,
		totalAssigned: 183,
		acknowledgements: [],
	},
	{
		id: "DOC-002",
		name: "ISO 27001 Certificate",
		fileType: "pdf",
		category: "certificate",
		folderId: "sys-cer",
		description: "Annual information security certification.",
		fileSize: 1048576,
		expiryDate: "2026-12-31",
		uploadedAt: "2026-01-03",
		uploadedBy: "Compliance Team",
		isArchived: false,
		versions: [
			{
				id: "V-DOC-002-1",
				version: 1,
				uploadedAt: "2026-01-03",
				uploadedBy: "Compliance Team",
				fileSize: 1048576,
			},
		],
		shares: [],
	},
	{
		id: "DOC-003",
		name: "Adaeze Okonkwo ID Card",
		fileType: "png",
		category: "id_card",
		folderId: "per",
		description: "Staff identification card copy.",
		fileSize: 512000,
		expiryDate: "2026-06-30",
		uploadedAt: "2025-06-30",
		uploadedBy: "Security Desk",
		isArchived: false,
		versions: [
			{
				id: "V-DOC-003-1",
				version: 1,
				uploadedAt: "2025-06-30",
				uploadedBy: "Security Desk",
				fileSize: 512000,
			},
		],
		shares: [share("SH-002", "Chidinma Okeke", "CO", "download", "2025-07-01")],
	},
	{
		id: "DOC-004",
		name: "Employment Contract — Ngozi Obasi",
		fileType: "docx",
		category: "contract",
		folderId: "sys-con",
		description: "Signed employment contract for finance analyst role.",
		fileSize: 786432,
		uploadedAt: "2026-03-17",
		uploadedBy: "HR Admin",
		isArchived: false,
		versions: [
			{
				id: "V-DOC-004-1",
				version: 1,
				uploadedAt: "2026-03-17",
				uploadedBy: "HR Admin",
				fileSize: 786432,
			},
		],
		shares: [share("SH-003", "Ngozi Obasi", "NO", "download", "2026-03-17")],
	},
	{
		id: "DOC-005",
		name: "Quarterly Compliance Report",
		fileType: "pdf",
		category: "report",
		folderId: "sys",
		description: "Q1 compliance activities and audit observations.",
		fileSize: 2097152,
		uploadedAt: "2026-04-01",
		uploadedBy: "Compliance Team",
		isArchived: false,
		versions: [
			{
				id: "V-DOC-005-1",
				version: 1,
				uploadedAt: "2026-04-01",
				uploadedBy: "Compliance Team",
				fileSize: 2097152,
			},
		],
		shares: [],
		assignment: { scope: "department", departments: ["Finance"] },
		requiresAcknowledgement: true,
		totalAssigned: 15,
		acknowledgements: [],
	},
	{
		id: "DOC-006",
		name: "Legacy NDA Template",
		fileType: "doc",
		category: "contract",
		folderId: "sys-con",
		description: "Retired NDA template retained for reference.",
		fileSize: 458752,
		uploadedAt: "2024-08-15",
		uploadedBy: "Legal Team",
		isArchived: true,
		versions: [
			{
				id: "V-DOC-006-1",
				version: 1,
				uploadedAt: "2024-08-15",
				uploadedBy: "Legal Team",
				fileSize: 458752,
			},
		],
		shares: [],
	},
];

