import type { ApiResponse, PagedResult } from "./api";
import type {
  AssetRequest,
  BankDetailsRequest,
  EmploymentType,
  ExportJobDto,
  IdentityDocumentsRequest,
  MedicalRequest,
  OnboardingMethod,
} from "./common";

export interface BankDetailsDto {
  bankName?: string | null;
  accountNumber?: string | null;
  sortCode?: string | null;
  accountHolderName?: string | null;
}

export interface ChangeEmployeeStatusRequest {
  status: EmployeeStatus;
}

export interface EmployeeDto {
  id: string;
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  preferredName?: string | null;
  maidenName?: string | null;
  initials?: string | null;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  maritalStatus?: string | null;
  address?: string | null;
  state?: string | null;
  countryOfEmployment?: string | null;
  employeeNumber?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  branchId?: string | null;
  department?: string | null;
  branchName?: string | null;
  employmentType?: EmploymentType;
  managerId?: string | null;
  managerName?: string | null;
  directReportCount: number;
  status: EmployeeStatus;
  startDate?: string | null;
  workLocation?: string | null;
  workMode?: WorkMode;
  grade?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactEmail?: string | null;
  bankDetails?: BankDetailsDto;
  identityDocuments?: IdentityDocumentsDto;
  onboardingMethod: OnboardingMethod;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFilters {
  search?: string | null;
  departmentId?: string | null;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  startedFrom?: string | null;
  startedTo?: string | null;
}

export interface EmployeeImportError {
  row: number;
  email?: string | null;
  message: string;
}

export interface EmployeeImportRequest {
  rows: EmployeeImportRow[];
  sendInvitations?: boolean;
}

export interface EmployeeImportResult {
  imported: number;
  failed: number;
  invited: number;
  errors: EmployeeImportError[];
}

export interface EmployeeImportRow {
  employeeNumber?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  phone?: string | null;
  jobTitle: string;
  department: string;
  manager?: string | null;
  employmentType?: EmploymentType;
  startDate?: string | null;
  status?: EmployeeStatus;
  workLocation?: string | null;
  workMode?: WorkMode;
  grade?: string | null;
  assetTag?: string | null;
  assetName?: string | null;
  assetCategory?: string | null;
  assetSerialNumber?: string | null;
  assetAssignedDate?: string | null;
}

export interface EmployeeInvitedResponse {
  employee?: EmployeeDto;
  expiresAt?: string | null;
  joinToken?: string | null;
}

export interface EmployeeListItemDto {
  id: string;
  name: string;
  initials: string;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  department?: string | null;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  workLocation?: string | null;
  status: EmployeeStatus;
  managerId?: string | null;
  managerName?: string | null;
  directReportCount: number;
  startDate?: string | null;
  employeeNumber?: string | null;
}

export interface EmployeeRequest {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  employeeNumber?: string | null;
  jobTitle: string;
  departmentId: string;
  branchId?: string | null;
  employmentType: EmploymentType;
  managerId?: string | null;
  startDate?: string | null;
  workLocation?: string | null;
  workMode?: WorkMode;
  grade?: string | null;
  assets?: AssetRequest[] | null;
  status?: EmployeeStatus;
  title?: string | null;
  preferredName?: string | null;
  maidenName?: string | null;
  initials?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  maritalStatus?: string | null;
  address?: string | null;
  state?: string | null;
  countryOfEmployment?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelationship?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactEmail?: string | null;
  bankDetails?: BankDetailsRequest;
  identityDocuments?: IdentityDocumentsRequest;
  medical?: MedicalRequest;
}

export interface EmployeeStatsDto {
  headcount: number;
  byStatus: EmployeeStatusCount[];
}

export type EmployeeStatus =
  | "pending"
  | "onboarded"
  | "probation"
  | "active"
  | "onLeave"
  | "offboarding"
  | "inactive"
  | "deleted";

export interface EmployeeStatusCount {
  status: EmployeeStatus;
  count: number;
}

export interface ExportColumnDto {
  key: string;
  label: string;
}

export interface ExportEmployeesRequest {
  filters?: EmployeeFilters;
  columns?: string[] | null;
}

export interface IdentityDocumentsDto {
  nationalIdNumber?: string | null;
  taxIdNumber?: string | null;
  pensionId?: string | null;
  housingFundNumber?: string | null;
  drivingLicenceNumber?: string | null;
  drivingLicenceExpiry?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  passportIssuingCountry?: string | null;
}

export interface ImportColumn {
  key: string;
  required: boolean;
  example: string;
  notes: string;
}

export interface InvitationIssuedResponse {
  expiresAt?: string | null;
  joinToken?: string | null;
}

export interface InviteRequest {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  jobTitle: string;
  departmentId: string;
  employmentType: EmploymentType;
  startDate?: string | null;
  managerId?: string | null;
}

export interface MedicalDto {
  allergies?: string | null;
  conditions?: string | null;
  medications?: string | null;
  dietaryRequirements?: string | null;
  accessibilityNeeds?: string | null;
}

export interface PendingInvitationDto {
  employeeId: string;
  name: string;
  email: string;
  jobTitle?: string | null;
  sentAt: string;
  expiresAt: string;
  expired: boolean;
}

export type WorkMode =
  | "remote"
  | "hybrid"
  | "onsite";

export type GetEmployeesResponse = ApiResponse<PagedResult<EmployeeListItemDto>>;

export interface GetEmployeesParams {
  Search?: string;
  DepartmentId?: string;
  Status?: EmployeeStatus;
  EmploymentType?: EmploymentType;
  WorkMode?: WorkMode;
  StartedFrom?: string;
  StartedTo?: string;
  page?: number;
  pageSize?: number;
}

export type CreateEmployeeResponse = ApiResponse<EmployeeDto>;

export type GetEmployeeStatsResponse = ApiResponse<EmployeeStatsDto>;

export interface GetEmployeeStatsParams {
  Search?: string;
  DepartmentId?: string;
  Status?: EmployeeStatus;
  EmploymentType?: EmploymentType;
  WorkMode?: WorkMode;
  StartedFrom?: string;
  StartedTo?: string;
}

export type ExportEmployeesResponse = ApiResponse<ExportJobDto>;

export type GetEmployeeExportColumnsResponse = ApiResponse<ExportColumnDto[]>;

export type GetEmployeeResponse = ApiResponse<EmployeeDto>;

export type DeleteEmployeeResponse = ApiResponse<null>;

export type UpdateEmployeeResponse = ApiResponse<EmployeeDto>;

export interface UpdateEmployeeParams {
  id: string;
  body: EmployeeRequest;
}

export type GetEmployeeMedicalResponse = ApiResponse<MedicalDto>;

export type ChangeEmployeeStatusResponse = ApiResponse<EmployeeDto>;

export interface ChangeEmployeeStatusParams {
  id: string;
  body: ChangeEmployeeStatusRequest;
}

export type InviteEmployeeResponse = ApiResponse<EmployeeInvitedResponse>;

export type ResendEmployeeInvitationResponse = ApiResponse<InvitationIssuedResponse>;

export type RevokeEmployeeInvitationResponse = ApiResponse<null>;

export type GetEmployeeInvitationsResponse = ApiResponse<PendingInvitationDto[]>;

export type GetEmployeeImportColumnsResponse = ApiResponse<ImportColumn[]>;

export type ImportEmployeesResponse = ApiResponse<EmployeeImportResult>;
