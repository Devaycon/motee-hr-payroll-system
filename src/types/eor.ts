import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface ComplianceItemDto {
  key: ComplianceKey;
  label: string;
  state: ComplianceState;
  standing: ComplianceStanding;
  note?: string | null;
  expiresOn?: string | null;
  verifiedOn?: string | null;
  evidenceFileId?: string | null;
  expires: boolean;
  blocksWork: boolean;
  unevidenced: boolean;
}

export type ComplianceKey =
  "contract" | "workPermit" | "taxRegistration" | "statutoryBenefits" | "localId";

export interface ComplianceRequest {
  state: ComplianceState;
  note?: string | null;
  expiresOn?: string | null;
  verifiedOn?: string | null;
  evidenceFileId?: string | null;
}

export interface ComplianceRowDto {
  engagementId: string;
  employeeId: string;
  name: string;
  initials?: string | null;
  countryOfEngagement: string;
  providerName: string;
  stage: EngagementStage;
  items: ComplianceItemDto[];
  blockers: string[];
}

export type ComplianceStanding =
  "pending" | "complete" | "actionRequired" | "notApplicable" | "expired" | "expiringSoon";

export type ComplianceState =
  "pending" | "complete" | "actionRequired" | "notApplicable";

export interface CurrencyTotal {
  currency: string;
  workers: number;
  monthlyCost: number;
}

export interface EndEngagementRequest {
  endDate: string;
  reason?: string | null;
}

export type EngagementStage =
  "onboarding" | "active" | "offboarding" | "ended";

export interface EorEngagementRequest {
  employeeId: string;
  providerId: string;
  countryOfEngagement: string;
  currency: string;
  grossMonthly?: number;
  employerCostMonthly?: number;
  payFrequency?: PayFrequency;
  startDate: string;
  endDate?: string | null;
  usdRate?: number | null;
  rateOn?: string | null;
}

export interface EorInvoiceDto {
  id: string;
  providerId: string;
  providerName: string;
  period: string;
  periodLabel: string;
  reference?: string | null;
  currency: string;
  grossPay: number;
  employerCosts: number;
  managementFee: number;
  total: number;
  standing: InvoiceStanding;
  daysOverdue: number;
  issuedOn: string;
  dueOn: string;
  paidOn?: string | null;
  documentFileId?: string | null;
  billedWorkerCount: number;
  engagedWorkerCount: number;
  headcountMatches?: boolean;
  totalAddsUp: boolean;
  sumOfParts: number;
}

export interface EorInvoiceRequest {
  providerId: string;
  period: string;
  reference?: string | null;
  currency: string;
  billedWorkerCount?: number;
  grossPay?: number;
  employerCosts?: number;
  managementFee?: number;
  total?: number;
  issuedOn: string;
  dueOn: string;
  documentFileId?: string | null;
}

export interface EorProviderDto {
  id: string;
  name: string;
  status: EorProviderStatus;
  countriesCovered: string[];
  managementFeePercent: number;
  partneredOn?: string | null;
  website?: string | null;
  workerCount: number;
}

export interface EorProviderRequest {
  name: string;
  status?: EorProviderStatus;
  countriesCovered?: string[];
  managementFeePercent?: number;
  partneredOn?: string | null;
  website?: string | null;
}

export type EorProviderStatus =
  "active" | "inactive";

export interface EorSummary {
  workers: number;
  providers: number;
  activeProviders: number;
  countries: number;
  byCurrency: CurrencyTotal[];
  monthlyCostUsd: number;
  convertedWorkers: number;
  staleRateWorkers: number;
  workersWithBlockers: number;
  expiringCompliance: number;
  expiredCompliance: number;
  costIsComplete?: boolean;
}

export interface EorWorkerDto {
  id: string;
  employeeId: string;
  name: string;
  initials?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  providerId: string;
  providerName: string;
  countryOfEngagement: string;
  stage: EngagementStage;
  startDate: string;
  endDate?: string | null;
  payFrequency: PayFrequency;
  currency: string;
  grossMonthly: number;
  employerCostMonthly: number;
  managementFee: number;
  totalMonthly: number;
  usdRate?: number | null;
  rateOn?: string | null;
  totalUsd?: number | null;
  rateIsStale: boolean;
  compliance: ComplianceItemDto[];
  blockers: string[];
  fullyCompliant: boolean;
}

export type InvoiceStanding =
  "pending" | "paid" | "overdue";

export type PayFrequency =
  "weekly" | "biWeekly" | "semiMonthly" | "monthly";

export interface SettleInvoiceRequest {
  paidOn?: string | null;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/eor/providers
export type GetEorProvidersResponse = ApiResponse<EorProviderDto[]>;

// POST /api/v1/eor/providers
export type CreateEorProviderResponse = ApiResponse<EorProviderDto>;

// GET /api/v1/eor/providers/{id}
export type GetEorProviderResponse = ApiResponse<EorProviderDto>;

// PUT /api/v1/eor/providers/{id}
export type UpdateEorProviderResponse = ApiResponse<EorProviderDto>;

// DELETE /api/v1/eor/providers/{id}
export type DeleteEorProviderResponse = ApiResponse<EorProviderDto>;

// GET /api/v1/eor/workers
export type GetEorWorkersResponse = ApiResponse<PagedResult<EorWorkerDto>>;
export interface GetEorWorkersParams {
  ProviderId?: string;
  Country?: string;
  Stage?: EngagementStage;
  WithBlockers?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/eor/workers
export type CreateEorWorkerResponse = ApiResponse<EorWorkerDto>;

// GET /api/v1/eor/workers/{id}
export type GetEorWorkerResponse = ApiResponse<EorWorkerDto>;

// PUT /api/v1/eor/workers/{id}
export type UpdateEorWorkerResponse = ApiResponse<EorWorkerDto>;

// DELETE /api/v1/eor/workers/{id}
export type DeleteEorWorkerResponse = ApiResponse<unknown | null>;

// POST /api/v1/eor/workers/{id}/end
export type EndEorWorkerResponse = ApiResponse<EorWorkerDto>;

// GET /api/v1/eor/summary
export type GetEorSummaryResponse = ApiResponse<EorSummary>;

// GET /api/v1/eor/compliance
export type GetEorComplianceResponse = ApiResponse<ComplianceRowDto[]>;

// PUT /api/v1/eor/workers/{id}/compliance/{key}
export type UpdateEorWorkerComplianceResponse = ApiResponse<EorWorkerDto>;

// GET /api/v1/eor/invoices
export type GetEorInvoicesResponse = ApiResponse<EorInvoiceDto[]>;
export interface GetEorInvoicesParams {
  providerId?: string;
}

// POST /api/v1/eor/invoices
export type CreateEorInvoiceResponse = ApiResponse<EorInvoiceDto>;

// PUT /api/v1/eor/invoices/{id}
export type UpdateEorInvoiceResponse = ApiResponse<EorInvoiceDto>;

// DELETE /api/v1/eor/invoices/{id}
export type DeleteEorInvoiceResponse = ApiResponse<unknown | null>;

// POST /api/v1/eor/invoices/{id}/settle
export type SettleEorInvoiceResponse = ApiResponse<EorInvoiceDto>;

