import type { ApiResponse } from "./api";
import type { LoginResponseData } from "./auth";
import type {
  BankDetailsRequest,
  EmploymentType,
  IdentityDocumentsRequest,
  MedicalRequest,
} from "./common";

export interface AcceptInviteRequest {
  password: string;
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

export interface AttachJoinerDocumentRequest {
  fileId: string;
}

export interface CountryCode {
  value?: string | null;
}

export interface DeclareJoinerPackRequest {
  signedName: string;
}

export interface DerivedTax {
  taxCode: string;
  basis?: TaxBasis;
  studentLoanDeduction?: boolean;
  studentLoanPlan?: StudentLoanPlan;
  postgraduateLoan?: boolean;
  derivationSource: string;
}

export interface EmployeeStatementAnswers {
  hasAnotherJob?: boolean;
  receivesPension?: boolean;
  recentPaymentsSince6April?: boolean;
}

export interface GuarantorDto {
  id: string;
  position: number;
  name: string;
  relationship: string;
  occupation?: string | null;
  address?: string | null;
  phone?: string | null;
}

export interface GuarantorRequest {
  position: number;
  name: string;
  relationship: string;
  occupation?: string | null;
  address?: string | null;
  phone?: string | null;
}

export type InvitationOutcome =
  | "valid"
  | "expired"
  | "consumed"
  | "revoked";

export interface InvitationPreview {
  outcome: InvitationOutcome;
  purpose?: InvitationPurpose;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  department?: string | null;
  employmentType?: EmploymentType;
  startDate?: string | null;
  companyName?: string | null;
  valid?: boolean;
}

export type InvitationPurpose =
  | "onboarding"
  | "credentials";

export interface JoinerDeclaration {
  signedName: string;
  signedAt: string;
  ipAddress?: string | null;
}

export interface JoinerDocumentDto {
  kind: JoinerDocumentKind;
  fileId: string;
  fileName: string;
  url?: string | null;
  uploadedAt: string;
}

export type JoinerDocumentKind =
  | "passport"
  | "drivingLicence"
  | "rightToWork"
  | "visa"
  | "proofOfAddress"
  | "qualifications"
  | "p45"
  | "guarantor1Id"
  | "guarantor2Id";

export interface JoinerDocumentSpec {
  kind: JoinerDocumentKind;
  label: string;
  hint: string;
  required: boolean;
  country?: CountryCode;
}

export interface JoinerPackDto {
  onboardingRecordId: string;
  privacyConsent?: PrivacyConsent;
  declaration?: JoinerDeclaration;
  documents: JoinerDocumentDto[];
  guarantors: GuarantorDto[];
  starterTax?: StarterTaxDto;
  draftJson?: string | null;
  draftStep?: number | null;
  draftSavedAt?: string | null;
  outstanding: string[];
  isComplete?: boolean;
}

export interface JoinerPackRequirementsDto {
  countryCode: string;
  documents: JoinerDocumentSpec[];
  guarantorsRequired: number;
  collectsStarterTax: boolean;
  privacyNoticeVersion: string;
}

export interface P45Details {
  documentFileId?: string | null;
  payeOfficeNumber?: string | null;
  payeReferenceNumber?: string | null;
  niNumber?: string | null;
  leavingDate: string;
  continueStudentLoan?: boolean;
  taxCodeAtLeaving: string;
  week1Month1?: boolean;
  weekNumber?: number | null;
  monthNumber?: number | null;
  totalPayToDate?: number;
  totalTaxToDate?: number;
  payeReference?: string | null;
}

export interface PrivacyConsent {
  acceptedAt: string;
  noticeVersion: string;
  ipAddress?: string | null;
}

export interface SaveGuarantorsRequest {
  guarantors: GuarantorRequest[];
}

export interface SaveJoinerDraftRequest {
  draftJson: string;
  step?: number | null;
}

export interface StarterChecklistDetails {
  employeeStatement: EmployeeStatementAnswers;
  starterDeclaration: StarterDeclaration;
  studentLoan: StudentLoanDetails;
}

export type StarterDeclaration =
  | "a"
  | "b"
  | "c";

export interface StarterTaxDto {
  source: StarterTaxSource;
  employmentStartDate: string;
  p45?: P45Details;
  starterChecklist?: StarterChecklistDetails;
  derived?: DerivedTax;
  retainUntil: string;
}

export interface StarterTaxRequest {
  source: StarterTaxSource;
  p45?: P45Details;
  employeeStatement?: EmployeeStatementAnswers;
  studentLoan?: StudentLoanDetails;
}

export type StarterTaxSource =
  | "none"
  | "p45"
  | "starterChecklist";

export interface StudentLoanDetails {
  hasPlan?: boolean;
  plan?: StudentLoanPlan;
  postgraduateLoan?: boolean;
}

export type StudentLoanPlan =
  | "plan1"
  | "plan2"
  | "plan4"
  | "plan5";

export type TaxBasis =
  | "cumulative"
  | "week1Month1";

export type GetJoinRequirementsResponse = ApiResponse<JoinerPackRequirementsDto>;

export type GetJoinPackResponse = ApiResponse<JoinerPackDto>;

export type AcceptJoinConsentResponse = ApiResponse<JoinerPackDto>;

export type AttachJoinDocumentResponse = ApiResponse<JoinerPackDto>;

export interface AttachJoinDocumentParams {
  token: string;
  kind: JoinerDocumentKind;
  body: AttachJoinerDocumentRequest;
}

export type RemoveJoinDocumentResponse = ApiResponse<null>;

export interface RemoveJoinDocumentParams {
  token: string;
  kind: JoinerDocumentKind;
}

export type SaveJoinGuarantorsResponse = ApiResponse<JoinerPackDto>;

export interface SaveJoinGuarantorsParams {
  token: string;
  body: SaveGuarantorsRequest;
}

export type SaveJoinStarterTaxResponse = ApiResponse<JoinerPackDto>;

export interface SaveJoinStarterTaxParams {
  token: string;
  body: StarterTaxRequest;
}

export type SaveJoinDraftResponse = ApiResponse<null>;

export interface SaveJoinDraftParams {
  token: string;
  body: SaveJoinerDraftRequest;
}

export type DeclareJoinPackResponse = ApiResponse<JoinerPackDto>;

export interface DeclareJoinPackParams {
  token: string;
  body: DeclareJoinerPackRequest;
}

export type GetInvitationResponse = ApiResponse<InvitationPreview>;

export type AcceptInvitationResponse = ApiResponse<LoginResponseData>;

export interface AcceptInvitationParams {
  token: string;
  body: AcceptInviteRequest;
}

export interface JoinPhotoResponseData {
  fileId?: string | null;
}

export type UploadJoinPhotoResponse = ApiResponse<JoinPhotoResponseData>;

export interface UploadJoinPhotoParams {
  token: string;
  file: File;
}
