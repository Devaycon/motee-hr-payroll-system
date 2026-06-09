import type { OnboardingRecord } from "@/src/lib/types/onboarding";

export const DEPARTMENT_OPTIONS = [
  "all","Engineering","HR","Finance","Marketing","Sales",
  "Operations","Design","Product","Legal","Customer Success",
];

export const STAGE_ORDER = [
  "pre_boarding","day_one","first_week","thirty_day","sixty_day","ninety_day","completed",
] as const;

export const ONBOARDING_STAGE_LABELS: Record<string, string> = {
  pre_boarding: "Pre-Boarding",
  day_one: "Day 1",
  first_week: "First Week",
  thirty_day: "30 Day",
  sixty_day: "60 Day",
  ninety_day: "90 Day",
  completed: "Completed",
};

export const ONBOARDING_STAGE_STYLES: Record<string, string> = {
  pre_boarding: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  day_one: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  first_week: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  thirty_day: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  sixty_day: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  ninety_day: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export const ONBOARDING_STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export const ONBOARDING_STATUS_STYLES: Record<string, string> = {
  not_started: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
};

export const ASSIGNEE_LABELS: Record<string, string> = {
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
  it: "IT",
};

export const ASSIGNEE_STYLES: Record<string, string> = {
  hr: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  manager: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  employee: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  it: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export const TASK_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  overdue: "bg-red-500/10 text-red-600 border-red-500/20",
};

const WF_ID = "ACT-DEFAULT-ONBOARDING";
const WF_NAME = "Standard Onboarding Workflow";

export const ONBOARDING_RECORDS: OnboardingRecord[] = [
  // ── Preboarding (lightweight pre-registration — personal info + assets) ──
  {
    id: "pre-001",
    employeeName: "Daniel Okafor",
    employeeInitials: "DO",
    department: "—",
    jobTitle: "—",
    startDate: "",
    stage: "pre_boarding",
    status: "not_started",
    phase: "preboarding",
    completedTasks: 0,
    totalTasks: 0,
    welcomeEmailSent: false,
    initiatedAt: "2026-06-05",
    mode: "manual",
    email: "daniel.okafor@example.com",
    tasks: [],
    assets: [
      { assetType: "Laptop", serialNumber: "LP-77213", condition: "New", notes: "14-inch model" },
      { assetType: "Mobile Phone", serialNumber: "PH-22941", condition: "Good", notes: "" },
    ],
    preboardingData: {
      firstName: "Daniel", lastName: "Okafor", email: "daniel.okafor@example.com",
      phone: "+234 802 555 1290", dateOfBirth: "1996-04-12", gender: "Male",
      address: "21 Marina Road", country: "Nigeria", state: "Lagos",
      emergencyContactName: "Ada Okafor", emergencyContactPhone: "+234 803 222 7788",
      assetCategory: "Laptop", assetSerialNumber: "LP-77213",
    },
  },
  {
    id: "pre-002",
    employeeName: "Sarah Bello",
    employeeInitials: "SB",
    department: "—",
    jobTitle: "—",
    startDate: "",
    stage: "pre_boarding",
    status: "not_started",
    phase: "preboarding",
    completedTasks: 0,
    totalTasks: 0,
    welcomeEmailSent: false,
    initiatedAt: "2026-06-06",
    mode: "manual",
    email: "sarah.bello@example.com",
    tasks: [],
    assets: [
      { assetType: "Laptop", serialNumber: "LP-90015", condition: "Good", notes: "" },
    ],
    preboardingData: {
      firstName: "Sarah", lastName: "Bello", email: "sarah.bello@example.com",
      phone: "+234 701 884 0021", dateOfBirth: "1994-11-30", gender: "Female",
      address: "8 Wuse II", country: "Nigeria", state: "Abuja (FCT)",
      emergencyContactName: "Musa Bello", emergencyContactPhone: "+234 805 661 2200",
      assetCategory: "Laptop", assetSerialNumber: "LP-90015",
    },
  },

  // ── Pre-onboarding (before start date — offer, docs, equipment) ──
  {
    id: "onb-001",
    employeeName: "Seun Adeyemi",
    employeeInitials: "SA",
    department: "Engineering",
    jobTitle: "Frontend Engineer",
    startDate: "2026-06-22",
    stage: "pre_boarding",
    status: "in_progress",
    phase: "pre_onboarding",
    workflowTemplateId: WF_ID,
    workflowName: WF_NAME,
    completedTasks: 1,
    totalTasks: 3,
    welcomeEmailSent: true,
    initiatedAt: "2026-06-01",
    mode: "invited",
    tasks: [
      { id: "onb-001-t1", taskName: "Confirm offer & documents", assignee: "manager", reviewer: "Line Manager", dueDay: -7, status: "completed", isRequired: true, approvedAt: "2026-06-02" },
      { id: "onb-001-t2", taskName: "Provision equipment & accounts", assignee: "it", reviewer: "IT Admin", dueDay: -3, status: "pending", isRequired: true },
      { id: "onb-001-t3", taskName: "HR compliance sign-off", assignee: "hr", reviewer: "HR Admin", dueDay: -1, status: "pending", isRequired: true },
    ],
    submissions: [
      { id: "sub-001-1", label: "Signed offer letter", kind: "document", value: "offer-letter-seun.pdf", submittedAt: "2026-06-02" },
      { id: "sub-001-2", label: "Right-to-work ID", kind: "document", value: "passport-seun.pdf", submittedAt: "2026-06-02" },
      { id: "sub-001-3", label: "Bank account", kind: "field", value: "GTBank ••• 4821", submittedAt: "2026-06-03" },
    ],
    history: [
      { id: "h-001-1", at: "2026-06-01", actorName: "HR Team", type: "submitted" },
      { id: "h-001-2", at: "2026-06-02", actorName: "Tunde Bakare", type: "approved", taskName: "Confirm offer & documents" },
    ],
  },
  {
    id: "onb-006",
    employeeName: "Amaka Eze",
    employeeInitials: "AE",
    department: "Design",
    jobTitle: "Product Designer",
    startDate: "2026-06-29",
    stage: "pre_boarding",
    status: "not_started",
    phase: "pre_onboarding",
    workflowTemplateId: WF_ID,
    workflowName: WF_NAME,
    completedTasks: 0,
    totalTasks: 3,
    welcomeEmailSent: true,
    initiatedAt: "2026-06-02",
    mode: "invited",
    tasks: [
      { id: "onb-006-t1", taskName: "Confirm offer & documents", assignee: "manager", reviewer: "Line Manager", dueDay: -7, status: "pending", isRequired: true },
      { id: "onb-006-t2", taskName: "Provision equipment & accounts", assignee: "it", reviewer: "IT Admin", dueDay: -3, status: "pending", isRequired: true },
      { id: "onb-006-t3", taskName: "HR compliance sign-off", assignee: "hr", reviewer: "HR Admin", dueDay: -1, status: "pending", isRequired: true },
    ],
    submissions: [
      { id: "sub-006-1", label: "Signed offer letter", kind: "document", value: "offer-letter-amaka.pdf", submittedAt: "2026-06-03" },
    ],
    history: [{ id: "h-006-1", at: "2026-06-02", actorName: "HR Team", type: "submitted" }],
  },
  {
    id: "onb-007",
    employeeName: "Kwame Asante",
    employeeInitials: "KA",
    department: "Sales",
    jobTitle: "Account Executive",
    startDate: "2026-07-06",
    stage: "pre_boarding",
    status: "in_progress",
    phase: "pre_onboarding",
    workflowTemplateId: WF_ID,
    workflowName: WF_NAME,
    completedTasks: 2,
    totalTasks: 3,
    welcomeEmailSent: true,
    initiatedAt: "2026-05-28",
    mode: "manual",
    tasks: [
      { id: "onb-007-t1", taskName: "Confirm offer & documents", assignee: "manager", reviewer: "Line Manager", dueDay: -7, status: "completed", isRequired: true, approvedAt: "2026-05-30" },
      { id: "onb-007-t2", taskName: "Provision equipment & accounts", assignee: "it", reviewer: "IT Admin", dueDay: -3, status: "completed", isRequired: true, approvedAt: "2026-06-01" },
      { id: "onb-007-t3", taskName: "HR compliance sign-off", assignee: "hr", reviewer: "HR Admin", dueDay: -1, status: "pending", isRequired: true },
    ],
    submissions: [
      { id: "sub-007-1", label: "Signed offer letter", kind: "document", value: "offer-letter-kwame.pdf", submittedAt: "2026-05-29" },
      { id: "sub-007-2", label: "Tax ID (TIN)", kind: "field", value: "TIN-2284-9910", submittedAt: "2026-05-30" },
    ],
    history: [
      { id: "h-007-1", at: "2026-05-28", actorName: "HR Team", type: "submitted" },
      { id: "h-007-2", at: "2026-05-30", actorName: "Funke Adebayo", type: "approved", taskName: "Confirm offer & documents" },
      { id: "h-007-3", at: "2026-06-01", actorName: "IT Desk", type: "approved", taskName: "Provision equipment & accounts" },
    ],
  },

  // ── Onboarding (started — working the task chain) ──
  {
    id: "onb-002",
    employeeName: "Ngozi Obasi",
    employeeInitials: "NO",
    department: "Finance",
    jobTitle: "Financial Analyst",
    startDate: "2026-05-12",
    stage: "thirty_day",
    status: "in_progress",
    phase: "onboarding",
    workflowTemplateId: WF_ID,
    workflowName: WF_NAME,
    completedTasks: 1,
    totalTasks: 3,
    welcomeEmailSent: true,
    initiatedAt: "2026-05-01",
    mode: "manual",
    tasks: [
      { id: "onb-002-t1", taskName: "Confirm offer & documents", assignee: "manager", reviewer: "Line Manager", dueDay: 1, status: "completed", isRequired: true, approvedAt: "2026-05-13" },
      { id: "onb-002-t2", taskName: "Provision equipment & accounts", assignee: "it", reviewer: "IT Admin", dueDay: 3, status: "pending", isRequired: true },
      { id: "onb-002-t3", taskName: "HR compliance sign-off", assignee: "hr", reviewer: "HR Admin", dueDay: 7, status: "pending", isRequired: true },
    ],
    submissions: [
      { id: "sub-002-1", label: "Signed contract", kind: "document", value: "contract-ngozi.pdf", submittedAt: "2026-05-10" },
      { id: "sub-002-2", label: "Pension PIN", kind: "field", value: "PEN-100-228-119", submittedAt: "2026-05-12" },
    ],
    history: [
      { id: "h-002-1", at: "2026-05-01", actorName: "HR Team", type: "submitted" },
      { id: "h-002-2", at: "2026-05-13", actorName: "Ada Nwosu", type: "approved", taskName: "Confirm offer & documents" },
    ],
  },
  {
    id: "onb-004",
    employeeName: "Chinyere Obi",
    employeeInitials: "CO",
    department: "HR",
    jobTitle: "HR Generalist",
    startDate: "2026-04-10",
    stage: "sixty_day",
    status: "in_progress",
    phase: "onboarding",
    workflowTemplateId: WF_ID,
    workflowName: WF_NAME,
    completedTasks: 2,
    totalTasks: 3,
    welcomeEmailSent: true,
    initiatedAt: "2026-03-28",
    mode: "manual",
    tasks: [
      { id: "onb-004-t1", taskName: "Confirm offer & documents", assignee: "manager", reviewer: "Line Manager", dueDay: 1, status: "completed", isRequired: true, approvedAt: "2026-04-11" },
      { id: "onb-004-t2", taskName: "Provision equipment & accounts", assignee: "it", reviewer: "IT Admin", dueDay: 3, status: "completed", isRequired: true, approvedAt: "2026-04-12" },
      { id: "onb-004-t3", taskName: "HR compliance sign-off", assignee: "hr", reviewer: "HR Admin", dueDay: 7, status: "pending", isRequired: true },
    ],
    submissions: [
      { id: "sub-004-1", label: "Signed contract", kind: "document", value: "contract-chinyere.pdf", submittedAt: "2026-04-08" },
    ],
    history: [
      { id: "h-004-1", at: "2026-03-28", actorName: "HR Team", type: "submitted" },
      { id: "h-004-2", at: "2026-04-11", actorName: "Bola Ahmed", type: "approved", taskName: "Confirm offer & documents" },
      { id: "h-004-3", at: "2026-04-12", actorName: "IT Desk", type: "approved", taskName: "Provision equipment & accounts" },
    ],
  },
  {
    id: "onb-005",
    employeeName: "Ibrahim Suleiman",
    employeeInitials: "IS",
    department: "Operations",
    jobTitle: "Operations Manager",
    startDate: "2026-04-24",
    stage: "thirty_day",
    status: "overdue",
    phase: "onboarding",
    workflowTemplateId: WF_ID,
    workflowName: WF_NAME,
    completedTasks: 0,
    totalTasks: 3,
    welcomeEmailSent: true,
    initiatedAt: "2026-04-10",
    mode: "invited",
    tasks: [
      { id: "onb-005-t1", taskName: "Confirm offer & documents", assignee: "manager", reviewer: "Line Manager", dueDay: 1, status: "overdue", isRequired: true },
      { id: "onb-005-t2", taskName: "Provision equipment & accounts", assignee: "it", reviewer: "IT Admin", dueDay: 3, status: "pending", isRequired: true },
      { id: "onb-005-t3", taskName: "HR compliance sign-off", assignee: "hr", reviewer: "HR Admin", dueDay: 7, status: "pending", isRequired: true },
    ],
    submissions: [
      { id: "sub-005-1", label: "Signed contract", kind: "document", value: "contract-ibrahim.pdf", submittedAt: "2026-04-20" },
    ],
    history: [{ id: "h-005-1", at: "2026-04-10", actorName: "HR Team", type: "submitted" }],
  },
];
