import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_VALUES,
  type EmploymentType as UiEmploymentType,
} from "@/src/lib/constants/employment-types";
import {
  employmentTypeToApi,
  workModeToApi,
} from "@/src/lib/employees/api-mapping";
import type {
  BulkOnboardingRow,
  ManualOnboardingData,
  OnboardingRecord,
  OnboardingReviewStatus,
  OnboardingStage,
} from "@/src/lib/types/onboarding";
import type { ApprovalDto, EmploymentType } from "@/src/types/common";
import type {
  EmployeeImportRow,
  EmployeeRequest,
} from "@/src/types/employees";
import type {
  OnboardingDto,
  OnboardingStage as ApiOnboardingStage,
} from "@/src/types/onboarding";

const STAGE_FROM_API: Record<ApiOnboardingStage, OnboardingStage> = {
  preBoarding: "pre_boarding",
  dayOne: "day_one",
  firstWeek: "first_week",
  thirtyDay: "thirty_day",
  sixtyDay: "sixty_day",
  ninetyDay: "ninety_day",
  completed: "completed",
};

export function onboardingStageFromApi(
  stage: ApiOnboardingStage,
): OnboardingStage {
  return STAGE_FROM_API[stage] ?? "pre_boarding";
}

export function onboardingStageToApi(
  stage: OnboardingStage,
): ApiOnboardingStage {
  const match = Object.entries(STAGE_FROM_API).find(([, ui]) => ui === stage);
  return (match?.[0] as ApiOnboardingStage) ?? "preBoarding";
}

function reviewStatus(review: ApprovalDto | undefined): OnboardingReviewStatus {
  switch (review?.status) {
    case "inProgress":
      return "awaiting_review";
    case "returned":
      return "changes_requested";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "not_submitted";
  }
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function toOnboardingRecord(dto: OnboardingDto): OnboardingRecord {
  const stage = onboardingStageFromApi(dto.stage);
  const completed = Boolean(dto.completedAt) || stage === "completed";
  const lastEvent = dto.review?.history[dto.review.history.length - 1];

  return {
    id: dto.id,
    employeeId: dto.employeeId,
    approvalId: dto.review?.id,
    employeeName: dto.employeeName,
    employeeInitials: initialsOf(dto.employeeName),
    department: dto.departmentName ?? "",
    jobTitle: dto.jobTitle ?? "",
    startDate: dto.startDate ?? "",
    stage,
    status: completed
      ? "completed"
      : dto.isOverdue
        ? "overdue"
        : dto.submission === "notStarted"
          ? "not_started"
          : "in_progress",
    // Task lists belong to the workflow engine, which has no endpoint yet.
    tasks: [],
    completedTasks: 0,
    totalTasks: 0,
    welcomeEmailSent: dto.method === "invite",
    initiatedAt: (dto.submittedAt ?? dto.startDate ?? "").slice(0, 10),
    mode: dto.method === "invite" ? "invited" : dto.method,
    email: dto.email,
    selfOnboardingCompletedAt: dto.submittedAt ?? undefined,
    invitation:
      dto.method === "invite"
        ? {
            status:
              dto.submission === "submitted"
                ? "submitted"
                : dto.submission === "inProgress"
                  ? "in_progress"
                  : "sent",
            submittedAt: dto.submittedAt ?? undefined,
          }
        : undefined,
    review: {
      status: reviewStatus(dto.review),
      reviewedBy: lastEvent?.actorName ?? undefined,
      reviewedAt: dto.review?.decidedAt ?? undefined,
      comment: lastEvent?.note ?? undefined,
    },
  };
}

/** The forms hold a type as its value (`full_time`) or its label ("Full-time"). */
export function employmentTypeFromForm(value: string): EmploymentType {
  const byValue = EMPLOYMENT_TYPE_VALUES.find((v) => v === value);
  const byLabel = EMPLOYMENT_TYPE_VALUES.find(
    (v) => EMPLOYMENT_TYPE_LABELS[v].toLowerCase() === value.toLowerCase(),
  );
  return employmentTypeToApi((byValue ?? byLabel ?? "full_time") as UiEmploymentType);
}

const orNull = (value: string | undefined | null) => value?.trim() || null;

export interface OrgLookup {
  departments: { id: string; name: string }[];
  employees: { id: string; fullName: string }[];
}

/** What the manual onboarding wizard collected, as a new employee record. */
export function manualDataToEmployeeRequest(
  data: ManualOnboardingData,
  org: OrgLookup,
): EmployeeRequest {
  const department = org.departments.find(
    (d) => d.name.toLowerCase() === data.department.trim().toLowerCase(),
  );
  const managerId =
    data.managerId ??
    org.employees.find(
      (e) => e.fullName.toLowerCase() === data.manager.trim().toLowerCase(),
    )?.id;

  return {
    firstName: data.firstName.trim(),
    middleName: orNull(data.middleName),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    employeeNumber: orNull(data.employeeId),
    jobTitle: data.jobTitle.trim(),
    departmentId: department?.id ?? "",
    branchId: orNull(data.branchId),
    employmentType: employmentTypeFromForm(data.employmentType),
    managerId: managerId ?? null,
    startDate: orNull(data.startDate),
    workLocation: orNull(data.workLocation),
    workMode: workModeToApi(data.workMode),
    grade: orNull(data.grade),
    assets: data.assets
      .filter((asset) => asset.tag.trim() && asset.name.trim())
      .map((asset) => ({
        tag: asset.tag.trim(),
        name: asset.name.trim(),
        category: orNull(asset.category),
        serialNumber: orNull(asset.serialNumber),
        assignedDate: orNull(asset.assignedDate),
      })),
    title: orNull(data.title),
    preferredName: orNull(data.preferredName),
    maidenName: orNull(data.maidenName),
    initials: orNull(data.initials),
    phone: orNull(data.phone),
    dateOfBirth: orNull(data.dateOfBirth),
    gender: orNull(data.gender),
    nationality: orNull(data.nationality),
    ethnicity: orNull(data.ethnicity),
    maritalStatus: orNull(data.maritalStatus),
    address: orNull(data.address),
    state: orNull(data.state),
    countryOfEmployment: orNull(data.country),
    emergencyContactName: orNull(data.emergencyContactName),
    emergencyContactRelationship: orNull(data.emergencyContactRelationship),
    emergencyContactPhone: orNull(data.emergencyContactPhone),
    emergencyContactEmail: orNull(data.emergencyContactEmail),
    bankDetails: {
      bankName: orNull(data.bankName),
      accountNumber: orNull(data.bankAccountNumber),
      sortCode: orNull(data.sortCode),
      accountHolderName: orNull(data.bankAccountName),
    },
    identityDocuments: {
      nationalIdNumber: orNull(data.ninNumber) ?? orNull(data.niNumber),
      taxIdNumber: orNull(data.taxId),
      pensionId: orNull(data.pensionId),
      housingFundNumber: orNull(data.nhfNumber),
      drivingLicenceNumber: orNull(data.driverLicenseNumber),
      drivingLicenceExpiry: orNull(data.driverLicenseExpiry),
      passportNumber: orNull(data.passportNumber),
      passportExpiry: orNull(data.passportExpiry),
      passportIssuingCountry: orNull(data.passportCountry),
    },
    medical: {
      allergies: orNull(data.allergies),
      conditions: orNull(data.conditions),
      medications: orNull(data.medications),
      dietaryRequirements: orNull(data.dietaryRequirements),
      accessibilityNeeds: orNull(data.accessibilityNeeds),
    },
  };
}

export function bulkRowToImportRow(row: BulkOnboardingRow): EmployeeImportRow {
  return {
    employeeNumber: orNull(row.employeeId),
    firstName: row.firstName.trim(),
    lastName: row.lastName.trim(),
    email: row.email.trim(),
    jobTitle: row.jobTitle.trim(),
    department: row.department.trim(),
    manager: orNull(row.manager),
    employmentType: employmentTypeFromForm(row.employmentType),
    startDate: orNull(row.startDate),
    assetTag: orNull(row.assetTag),
    assetName: orNull(row.assetName),
    assetCategory: orNull(row.assetCategory),
    assetSerialNumber: orNull(row.assetSerialNumber),
    assetAssignedDate: orNull(row.assetAssignedDate),
  };
}
