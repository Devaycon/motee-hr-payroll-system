export type ContractStatus =
	| "draft"
	| "pending_signature"
	| "active"
	| "expiring_soon"
	| "expired"
	| "terminated";

export type ContractType =
	| "employment"
	| "nda"
	| "contractor"
	| "internship"
	| "consultancy"
	| "amendment";

export type SignatureStatus =
	| "unsigned"
	| "employee_signed"
	| "fully_signed";

export interface ContractSignatory {
	name: string;
	initials: string;
	role: string;
	signedAt?: string;
}

export interface ContractNote {
	id: string;
	content: string;
	createdAt: string;
	createdBy: string;
}

export interface Contract {
	id: string;
	title: string;
	description?: string;
	contractType: ContractType;
	status: ContractStatus;
	employeeName: string;
	employeeInitials: string;
	department: string;
	startDate: string;
	endDate?: string;
	autoRenew: boolean;
	noticePeriodDays: number;
	salary?: number;
	contractCurrency: string;
	signatureStatus: SignatureStatus;
	signatories: ContractSignatory[];
	notes: ContractNote[];
	createdAt: string;
	createdBy: string;
	lastModifiedAt: string;
	isArchived: boolean;
	hrSignature?: string;
	movedToDocuments?: boolean;
}

export interface NewContract {
	title: string;
	description?: string;
	contractType: ContractType;
	status: ContractStatus;
	employeeName: string;
	employeeInitials: string;
	department: string;
	startDate: string;
	endDate?: string;
	autoRenew: boolean;
	noticePeriodDays: number;
	salary?: number;
	contractCurrency: string;
}

