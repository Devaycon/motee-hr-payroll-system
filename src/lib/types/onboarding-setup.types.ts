export interface CompanyProfile {
  companyName: string;
  industry: string;
  companySize: string;
  country: string;
  companyEmailDomain: string;
  logo?: string;
  companyPolicies?: string;
}

export interface OrganizationConfig {
  managerTitle: string;
  departmentLabel: string;
  structureType: "hierarchical" | "flat";
}

export type AccessControlModel = "RBAC" | "PERMISSION" | "HYBRID";

export interface RoleDefinition {
  id: string;
  name: string;
  originalName: string;
}

export interface AccessControlConfig {
  model: AccessControlModel;
  roles: RoleDefinition[];
  permissions: string[];
}

export interface WorkflowConfig {
  leaveApproval: "manager" | "hr" | "both";
  multiLevelApproval: boolean;
  autoApproval: boolean;
}

export interface UILabels {
  manager: string;
  employeeId: string;
  department: string;
  [key: string]: string;
}

export interface CompanySetup {
  companyProfile: CompanyProfile;
  organizationConfig: OrganizationConfig;
  accessControlConfig: AccessControlConfig;
  enabledModules: string[];
  workflowConfig: WorkflowConfig;
  uiLabels: UILabels;
}

export interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  companySetup: CompanySetup;
  isBulkUploaded: boolean;
  isSubmitting: boolean;
  isComplete: boolean;
}

export const DEFAULT_COMPANY_SETUP: CompanySetup = {
  companyProfile: {
    companyName: "",
    industry: "",
    companySize: "",
    country: "",
    companyEmailDomain: "",
    logo: "",
    companyPolicies: "",
  },
  organizationConfig: {
    managerTitle: "Line Manager",
    departmentLabel: "Department",
    structureType: "hierarchical",
  },
  accessControlConfig: {
    model: "RBAC",
    roles: [
      { id: "admin", name: "Admin", originalName: "Admin" },
      { id: "hr", name: "HR", originalName: "HR" },
      { id: "manager", name: "Manager", originalName: "Manager" },
      { id: "employee", name: "Employee", originalName: "Employee" },
    ],
    permissions: [],
  },
  enabledModules: [],
  workflowConfig: {
    leaveApproval: "manager",
    multiLevelApproval: false,
    autoApproval: false,
  },
  uiLabels: {
    manager: "Manager",
    employeeId: "Employee ID",
    department: "Department",
  },
};

export const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail & E-commerce",
  "Real Estate",
  "Legal Services",
  "Hospitality & Tourism",
  "Media & Entertainment",
  "Logistics & Supply Chain",
  "Energy & Utilities",
  "Government & Public Sector",
  "Non-Profit",
  "Other",
];

export const COMPANY_SIZES = [
  "1–10",
  "10–50",
  "50–200",
  "200–500",
  "500–1000",
  "1000+",
];

export const AVAILABLE_MODULES = [
  { id: "employee-management", label: "Employee Management" },
  { id: "attendance", label: "Attendance" },
  { id: "payroll", label: "Payroll" },
  { id: "leave-management", label: "Leave Management" },
  { id: "recruitment", label: "Recruitment" },
  { id: "performance", label: "Performance" },
];

export const PERMISSION_OPTIONS = [
  "view_employees",
  "edit_employees",
  "approve_leave",
  "manage_payroll",
  "view_reports",
  "manage_recruitment",
  "manage_attendance",
  "manage_performance",
  "manage_documents",
  "manage_settings",
];
