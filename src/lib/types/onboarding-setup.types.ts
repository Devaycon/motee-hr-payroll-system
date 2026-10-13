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
  structureType: "hierarchical" | "flat" | "matrix";
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
  enabledModules: string[];
  uiLabels: UILabels;
}

/** What a bulk upload may fill in — any part of any section. */
export interface CompanySetupPrefill {
  companyProfile?: Partial<CompanyProfile>;
  organizationConfig?: Partial<OrganizationConfig>;
  enabledModules?: string[];
  uiLabels?: Partial<UILabels>;
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
  enabledModules: [],
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

export const MANAGER_TITLES = ["Line Manager", "Team leader", "Reporting Manager", "Supervisor", "Custom"];
export const DEPARTMENT_LABELS = ["Department", "Teams", "Unit", "Division", "Custom"];

export const AVAILABLE_MODULES = [
  {
    id: "employee-management",
    label: "Employee Management",
    description: "Employee records, onboarding, documents and ESS",
  },
  {
    id: "attendance",
    label: "Attendance",
    description: "Time tracking, shifts, GPS attendance and compliance",
  },
  {
    id: "leave-management",
    label: "Leave Management",
    description: "Leave requests, approvals and leave balances",
  },
  {
    id: "recruitment",
    label: "Recruitment",
    description: "Job requisitions, candidates and hiring pipeline",
  },
  {
    id: "performance",
    label: "Performance",
    description: "Goals, appraisals and performance reviews",
  },
  {
    id: "learning",
    label: "Learning",
    description: "Training, certifications and development plans",
  },
  {
    id: "payroll",
    label: "Payroll",
    description: "Salary processing, taxes and payslips",
  },
  {
    id: "benefits",
    label: "Benefits",
    description: "Pension, insurance, allowances and employee wellbeing programmes",
  },
];
