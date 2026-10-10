import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_VALUES,
} from "@/src/lib/constants/employment-types";
import {
  employeeStatusFromApi,
  employmentTypeFromApi,
} from "@/src/lib/employees/api-mapping";
import type { BranchKind, LocaleBranch } from "@/src/lib/types/branches";
import type {
  LocaleBundle,
  LocaleDepartment,
  LocaleEmployee,
  LocaleTenant,
} from "@/src/lib/types/locale";
import type { AccessLevelDto } from "@/src/types/access-levels";
import type { BranchDto } from "@/src/types/branches";
import type { DepartmentDto } from "@/src/types/departments";
import type { EmployeeDto, EmployeeListItemDto } from "@/src/types/employees";
import type { TenantLocale } from "@/src/types/locale";

/**
 * The screens were built against one in-memory "bundle" of company data. This
 * assembles that same shape from the API, so they read live records without
 * each being rewritten. Sections with no endpoint yet are left empty rather
 * than filled with fixtures.
 */
export interface LiveSources {
  tenant?: TenantLocale | null;
  departments?: DepartmentDto[];
  branches?: BranchDto[];
  employees?: EmployeeListItemDto[];
  accessLevels?: AccessLevelDto[];
}

const today = () => new Date().toISOString().slice(0, 10);

function toTenant(tenant: TenantLocale | null | undefined): LocaleTenant {
  return {
    id: tenant?.id ?? "",
    name: tenant?.name ?? "",
    slug: tenant?.slug ?? "",
    plan: tenant?.plan ?? "",
    status: tenant?.status ?? "",
    industry: tenant?.industry ?? "",
    country: tenant?.country ?? "",
    countryCode: tenant?.countryCode ?? "",
    timezone: tenant?.timezone ?? "",
    currency: tenant?.currency ?? "",
    currencySymbol: tenant?.currencySymbol ?? "",
    locale: tenant?.locale ?? "en-GB",
    logoUrl: tenant?.logoUrl ?? "",
    primaryColor: tenant?.primaryColor ?? "",
    createdAt: tenant?.createdAt ?? "",
    trialEndsAt: tenant?.trialEndsAt ?? null,
    billingEmail: tenant?.billingEmail ?? "",
  };
}

function toDepartment(dept: DepartmentDto): LocaleDepartment {
  return {
    id: dept.id,
    name: dept.name,
    code: dept.code,
    parentDepartmentId: null,
    headEmployeeId: dept.headEmployeeId ?? null,
    costCenter: "",
    headcountTarget: 0,
  };
}

const BRANCH_KIND: Record<BranchDto["kind"], BranchKind> = {
  headquarters: "headquarters",
  branch: "branch",
  regionalOffice: "regional_office",
  site: "site",
  remote: "remote",
};

export function toLocaleBranch(branch: BranchDto, tenantId = ""): LocaleBranch {
  return {
    id: branch.id,
    tenantId,
    name: branch.name,
    code: branch.code,
    kind: BRANCH_KIND[branch.kind] ?? "branch",
    status: branch.status,
    addressLines: branch.addressLines,
    city: branch.city ?? "",
    region: branch.region ?? undefined,
    postalCode: branch.postalCode ?? undefined,
    country: branch.country ?? "",
    timezone: branch.timeZone ?? undefined,
    phone: branch.phone ?? undefined,
    email: branch.email ?? undefined,
    managerEmployeeId: branch.managerEmployeeId ?? null,
    headcountTarget: branch.headcountTarget ?? undefined,
    openedAt: branch.openedAt ?? undefined,
  };
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
  };
}

export function toLocaleEmployee(
  emp: EmployeeListItemDto,
  tenant: LocaleTenant,
): LocaleEmployee {
  return {
    id: emp.id,
    tenantId: tenant.id,
    employeeNumber: emp.employeeNumber ?? "",
    ...splitName(emp.name),
    fullName: emp.name,
    initials: emp.initials,
    email: emp.email,
    phone: emp.phone ?? "",
    departmentId: emp.departmentId ?? "",
    departmentName: emp.department ?? "",
    jobTitle: emp.jobTitle ?? "",
    // The UI's employment-type value doubles as the type id.
    employmentTypeId: employmentTypeFromApi(emp.employmentType),
    status: employeeStatusFromApi(emp.status),
    startDate: emp.startDate ?? "",
    // Pay is not part of the employee record on the API.
    salary: { amount: 0, currency: tenant.currency, period: "monthly" },
    managerId: emp.managerId ?? null,
    workMode: emp.workMode ?? undefined,
    branchId: emp.branchId ?? undefined,
    workLocation: emp.workLocation ?? emp.branchName ?? undefined,
  };
}

/**
 * The detail page needs far more than the list row carries (date of birth,
 * bank details, identity numbers, emergency contact). Extra keys are read by
 * dot-path, so they sit alongside the typed ones.
 */
export function toDetailedLocaleEmployee(
  emp: EmployeeDto,
  tenant: LocaleTenant,
  base?: LocaleEmployee,
): LocaleEmployee {
  const emergencyContact = emp.emergencyContactName
    ? {
        name: emp.emergencyContactName,
        relationship: emp.emergencyContactRelationship ?? "",
        phone: emp.emergencyContactPhone ?? "",
        isPrimary: true,
      }
    : undefined;

  const detailed = {
    ...base,
    id: emp.id,
    tenantId: tenant.id,
    employeeNumber: emp.employeeNumber ?? "",
    title: emp.title ?? "",
    firstName: emp.firstName,
    middleName: emp.middleName ?? "",
    lastName: emp.lastName,
    preferredName: emp.preferredName ?? "",
    maidenName: emp.maidenName ?? "",
    fullName: emp.fullName,
    initials:
      emp.initials ||
      `${emp.firstName[0] ?? ""}${emp.lastName[0] ?? ""}`.toUpperCase(),
    email: emp.email,
    phone: emp.phone ?? "",
    departmentId: emp.departmentId ?? "",
    departmentName: emp.department ?? "",
    jobTitle: emp.jobTitle ?? "",
    grade: emp.grade ?? undefined,
    employmentTypeId: employmentTypeFromApi(emp.employmentType),
    status: employeeStatusFromApi(emp.status),
    startDate: emp.startDate ?? "",
    salary: base?.salary ?? {
      amount: 0,
      currency: tenant.currency,
      period: "monthly",
    },
    managerId: emp.managerId ?? null,
    dateOfBirth: emp.dateOfBirth ?? undefined,
    gender: emp.gender ?? undefined,
    nationality: emp.nationality ?? undefined,
    ethnicity: emp.ethnicity ?? "",
    maritalStatus: emp.maritalStatus ?? undefined,
    address: {
      line1: emp.address ?? "",
      region: emp.state ?? "",
      country: emp.countryOfEmployment ?? "",
    },
    addresses: {
      home: { line1: emp.address ?? "", region: emp.state ?? "" },
    },
    workMode: emp.workMode ?? undefined,
    branchId: emp.branchId ?? undefined,
    workLocation: emp.workLocation ?? emp.branchName ?? undefined,
    identifiers: {
      nin: emp.identityDocuments?.nationalIdNumber ?? "",
      tin: emp.identityDocuments?.taxIdNumber ?? "",
      pensionId: emp.identityDocuments?.pensionId ?? "",
      nhfNumber: emp.identityDocuments?.housingFundNumber ?? "",
      passport: emp.identityDocuments?.passportNumber ?? "",
      driversLicense: emp.identityDocuments?.drivingLicenceNumber ?? "",
    },
    bankDetails: {
      bankName: emp.bankDetails?.bankName ?? "",
      accountName: emp.bankDetails?.accountHolderName ?? "",
      accountNumber: emp.bankDetails?.accountNumber ?? "",
      sortCode: emp.bankDetails?.sortCode ?? "",
    },
    emergencyContact,
    emergencyContacts: emergencyContact ? [emergencyContact] : [],
    onboardingMethod: emp.onboardingMethod,
    ...(emp.avatarUrl ? { photoUrl: emp.avatarUrl } : {}),
  };
  return detailed;
}

export function buildLiveBundle(sources: LiveSources): LocaleBundle {
  const tenant = toTenant(sources.tenant);
  const employees = (sources.employees ?? []).map((emp) =>
    toLocaleEmployee(emp, tenant),
  );

  return {
    _meta: {
      tenantKey: "live",
      generatedAt: new Date().toISOString(),
      referenceDate: today(),
      historyDays: 0,
      seed: 0,
      employeeCount: employees.length,
    },
    tenant,
    companyProfile: {},
    branches: (sources.branches ?? []).map((b) => toLocaleBranch(b, tenant.id)),
    departments: (sources.departments ?? []).map(toDepartment),
    employmentTypes: EMPLOYMENT_TYPE_VALUES.map((value) => ({
      id: value,
      name: EMPLOYMENT_TYPE_LABELS[value],
      defaultLeaveDays: 0,
      eligibleForBenefits: false,
      probationMonths: 0,
    })),
    roles: [],
    accessLevels: (sources.accessLevels ?? []).map((level) => ({
      id: level.id,
      name: level.name,
      description: level.description ?? "",
    })),
    employees,
    orgStructure: [],
    headcountSnapshots: [],
    workforce: {},
    contracts: [],
    documents: [],
    attendance: [],
    leavePolicies: [],
    leaveBalances: [],
    leaveRequests: [],
    recruitment: {},
    onboarding: {},
    employeeChecklists: [],
    offboarding: [],
    performance: {},
    learning: {},
    assets: [],
    helpdeskTickets: [],
    grievances: [],
    suggestions: [],
    surveys: {},
    announcements: [],
    knowledgeBase: {},
    community: {},
    kudos: [],
    events: [],
    tasks: [],
    payroll: {},
    benefits: [],
    notifications: [],
    chat: {},
    auditTrail: [],
    settings: {},
    platform: {},
  };
}
