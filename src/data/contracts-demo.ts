import type {
	Contract,
	ContractStatus,
	ContractType,
	SignatureStatus,
} from "@/src/lib/types/contracts";

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
	draft: "Draft",
	pending_signature: "Pending Signature",
	active: "Active",
	expiring_soon: "Expiring Soon",
	expired: "Expired",
	terminated: "Terminated",
};

export const CONTRACT_STATUS_STYLES: Record<ContractStatus, string> = {
	draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
	pending_signature: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
	expiring_soon: "bg-orange-500/10 text-orange-600 border-orange-500/20",
	expired: "bg-red-500/10 text-red-600 border-red-500/20",
	terminated: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
	employment: "Employment",
	nda: "NDA",
	contractor: "Contractor",
	internship: "Internship",
	consultancy: "Consultancy",
	amendment: "Amendment",
};

export const CONTRACT_TYPE_STYLES: Record<ContractType, string> = {
	employment: "bg-blue-500/10 text-blue-600 border-blue-500/20",
	nda: "bg-violet-500/10 text-violet-600 border-violet-500/20",
	contractor: "bg-teal-500/10 text-teal-600 border-teal-500/20",
	internship: "bg-sky-500/10 text-sky-600 border-sky-500/20",
	consultancy: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20",
	amendment: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export const SIGNATURE_STATUS_LABELS: Record<SignatureStatus, string> = {
	unsigned: "Unsigned",
	employee_signed: "Employee Signed",
	fully_signed: "Fully Signed",
};

export const SIGNATURE_STATUS_STYLES: Record<SignatureStatus, string> = {
	unsigned: "bg-slate-500/10 text-slate-600 border-slate-500/20",
	employee_signed: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	fully_signed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export const CONTRACT_TYPE_OPTIONS = [
	{ value: "employment", label: "Employment" },
	{ value: "nda", label: "NDA" },
	{ value: "contractor", label: "Contractor" },
	{ value: "internship", label: "Internship" },
	{ value: "consultancy", label: "Consultancy" },
	{ value: "amendment", label: "Amendment" },
] as const;

export const CONTRACT_STATUS_OPTIONS = [
	{ value: "draft", label: "Draft" },
	{ value: "pending_signature", label: "Pending Signature" },
	{ value: "active", label: "Active" },
	{ value: "expiring_soon", label: "Expiring Soon" },
	{ value: "expired", label: "Expired" },
	{ value: "terminated", label: "Terminated" },
] as const;

export const DEPARTMENT_OPTIONS = [
	"Engineering",
	"Finance",
	"HR",
	"Legal",
	"Marketing",
	"Operations",
	"Product",
];

export const CURRENCY_OPTIONS = [
	{ value: "NGN", label: "NGN (₦)" },
	{ value: "USD", label: "USD ($)" },
	{ value: "GBP", label: "GBP (£)" },
	{ value: "EUR", label: "EUR (€)" },
] as const;

export const CONTRACTS: Contract[] = [
	{
		id: "CON-001",
		title: "Employment Contract — Adaeze Okonkwo",
		contractType: "employment",
		status: "active",
		employeeName: "Adaeze Okonkwo",
		employeeInitials: "AO",
		department: "Engineering",
		startDate: "2025-01-15",
		endDate: "2027-01-14",
		autoRenew: true,
		noticePeriodDays: 30,
		salary: 18500000,
		contractCurrency: "NGN",
		signatureStatus: "fully_signed",
		signatories: [
			{ name: "Adaeze Okonkwo", initials: "AO", role: "Employee", signedAt: "2025-01-10" },
			{ name: "HR Admin", initials: "HA", role: "HR Manager", signedAt: "2025-01-11" },
		],
		notes: [
			{ id: "N-CON-001-1", content: "Contract executed successfully.", createdAt: "2025-01-11", createdBy: "HR Admin" },
		],
		createdAt: "2025-01-08",
		createdBy: "HR Admin",
		lastModifiedAt: "2025-01-11",
		isArchived: false,
	},
	{
		id: "CON-002",
		title: "Non-Disclosure Agreement — Vendor Access",
		contractType: "nda",
		status: "pending_signature",
		employeeName: "Ibrahim Suleiman",
		employeeInitials: "IS",
		department: "Operations",
		startDate: "2026-04-08",
		endDate: "2027-04-08",
		autoRenew: false,
		noticePeriodDays: 14,
		contractCurrency: "NGN",
		signatureStatus: "employee_signed",
		signatories: [
			{ name: "Ibrahim Suleiman", initials: "IS", role: "Employee", signedAt: "2026-04-03" },
			{ name: "HR Admin", initials: "HA", role: "HR Manager" },
		],
		notes: [],
		createdAt: "2026-04-01",
		createdBy: "HR Admin",
		lastModifiedAt: "2026-04-03",
		isArchived: false,
	},
	{
		id: "CON-003",
		title: "Consultancy Agreement — Tax Advisory",
		contractType: "consultancy",
		status: "expiring_soon",
		employeeName: "Blessing Okafor",
		employeeInitials: "BO",
		department: "Finance",
		startDate: "2025-05-01",
		endDate: "2026-05-01",
		autoRenew: false,
		noticePeriodDays: 21,
		salary: 4500,
		contractCurrency: "USD",
		signatureStatus: "fully_signed",
		signatories: [
			{ name: "Blessing Okafor", initials: "BO", role: "Consultant", signedAt: "2025-04-27" },
			{ name: "HR Admin", initials: "HA", role: "HR Manager", signedAt: "2025-04-28" },
		],
		notes: [
			{ id: "N-CON-003-1", content: "Renewal reminder due 30 days before end date.", createdAt: "2026-04-01", createdBy: "HR Admin" },
		],
		createdAt: "2025-04-20",
		createdBy: "HR Admin",
		lastModifiedAt: "2026-04-01",
		isArchived: false,
	},
	{
		id: "CON-004",
		title: "Internship Agreement — Product Design",
		contractType: "internship",
		status: "draft",
		employeeName: "Mariam Yusuf",
		employeeInitials: "MY",
		department: "Product",
		startDate: "2026-05-05",
		endDate: "2026-08-05",
		autoRenew: false,
		noticePeriodDays: 7,
		salary: 250000,
		contractCurrency: "NGN",
		signatureStatus: "unsigned",
		signatories: [
			{ name: "Mariam Yusuf", initials: "MY", role: "Intern" },
			{ name: "HR Admin", initials: "HA", role: "HR Manager" },
		],
		notes: [],
		createdAt: "2026-04-02",
		createdBy: "HR Admin",
		lastModifiedAt: "2026-04-02",
		isArchived: false,
	},
	{
		id: "CON-005",
		title: "Contractor Agreement — Security Audit",
		contractType: "contractor",
		status: "expired",
		employeeName: "Samuel Mensah",
		employeeInitials: "SM",
		department: "Legal",
		startDate: "2024-10-01",
		endDate: "2025-09-30",
		autoRenew: false,
		noticePeriodDays: 14,
		salary: 3200,
		contractCurrency: "USD",
		signatureStatus: "fully_signed",
		signatories: [
			{ name: "Samuel Mensah", initials: "SM", role: "Contractor", signedAt: "2024-09-27" },
			{ name: "HR Admin", initials: "HA", role: "HR Manager", signedAt: "2024-09-28" },
		],
		notes: [
			{ id: "N-CON-005-1", content: "Contract completed and closed out.", createdAt: "2025-09-30", createdBy: "HR Admin" },
		],
		createdAt: "2024-09-20",
		createdBy: "HR Admin",
		lastModifiedAt: "2025-09-30",
		isArchived: false,
	},
	{
		id: "CON-006",
		title: "Promotion Contract — Adaeze Okonkwo",
		contractType: "amendment",
		status: "pending_signature",
		employeeName: "Adaeze Okonkwo",
		employeeInitials: "AO",
		department: "Engineering",
		startDate: "2026-05-01",
		autoRenew: false,
		noticePeriodDays: 30,
		salary: 24000000,
		contractCurrency: "NGN",
		signatureStatus: "unsigned",
		signatories: [
			{ name: "Adaeze Okonkwo", initials: "AO", role: "Employee" },
			{ name: "HR Admin", initials: "HA", role: "HR Manager" },
		],
		notes: [
			{ id: "N-CON-006-1", content: "Promotion to Senior Engineer effective May 2026.", createdAt: "2026-04-28", createdBy: "HR Admin" },
		],
		createdAt: "2026-04-28",
		createdBy: "HR Admin",
		lastModifiedAt: "2026-04-28",
		isArchived: false,
	},
];

