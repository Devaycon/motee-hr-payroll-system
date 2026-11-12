import type { ApiResponse, PagedResult } from "./api";
import type { ApprovalStatus } from "./common";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface ApproveLoanRequest {
  issuedOn?: string | null;
}

export interface Instalment {
  number: number;
  dueOn: string;
  amount: number;
  balanceAfter: number;
  status: InstalmentStatus;
}

export type InstalmentStatus = "paid" | "due" | "overdue" | "upcoming";

export interface LoanBookDto {
  totals: LoanBookTally;
  byType: LoanTypeTally[];
  byDepartment: LoanDepartmentTally[];
  largestBalances: LoanDto[];
}

export interface LoanBookTally {
  activeLoans: number;
  loanValue: number;
  outstanding: number;
  dueThisMonth: number;
  pending: number;
  defaulted: number;
  recoveryRate: number;
}

export interface LoanDepartmentTally {
  departmentId?: string | null;
  departmentName: string;
  outstanding: number;
  loans: number;
}

export interface LoanDetailDto {
  loan: LoanDto;
  schedule: Instalment[];
  repayments: LoanRepaymentDto[];
}

export interface LoanDto {
  id: string;
  reference: string;
  employeeId: string;
  employeeName?: string | null;
  departmentName?: string | null;
  loanType: LoanType;
  amount: number;
  currency: string;
  purpose: string;
  repaymentMonths: number;
  monthlyRepayment: number;
  amountRepaid: number;
  outstanding: number;
  interestRatePercent?: number | null;
  requestedOn: string;
  issuedOn?: string | null;
  defaultedOn?: string | null;
  status: LoanStatus;
  approvalInstanceId?: string | null;
  approvalStatus?: ApprovalStatus | null;
  nextInstalment?: Instalment | null;
  updatedAt: string;
}

export interface LoanRepaymentDto {
  id: string;
  amount: number;
  paidOn: string;
  method: LoanRepaymentMethod;
  reference?: string | null;
  note?: string | null;
  recordedAt: string;
}

export type LoanRepaymentMethod = "payroll" | "cash" | "bankTransfer" | "other";

export interface LoanRepaymentRequest {
  amount: number;
  paidOn?: string | null;
  method?: LoanRepaymentMethod;
  reference?: string | null;
  note?: string | null;
}

export interface LoanRequest {
  employeeId?: string | null;
  loanType: LoanType;
  amount: number;
  repaymentMonths: number;
  purpose: string;
  interestRatePercent?: number | null;
  fileIds?: string[];
}

export type LoanStatus =
  "pending" | "active" | "closed" | "defaulted" | "rejected";

export type LoanType =
  | "staffLoan"
  | "salaryAdvance"
  | "cooperativeLoan"
  | "emergencyLoan"
  | "seasonTicketLoan"
  | "employeeLoan";

export interface LoanTypeTally {
  loanType: LoanType;
  count: number;
  value: number;
  outstanding: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/loans
export type GetLoansResponse = ApiResponse<PagedResult<LoanDto>>;

export interface GetLoansParams {
  Status?: LoanStatus;
  LoanType?: LoanType;
  EmployeeId?: string;
  DepartmentId?: string;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/loans
export type CreateLoanResponse = ApiResponse<LoanDto>;

// GET /api/v1/loans/summary
export type GetLoanBookResponse = ApiResponse<LoanBookDto>;

// GET /api/v1/loans/me
export type GetMyLoansResponse = ApiResponse<LoanDto[]>;

// GET /api/v1/loans/employees/{employeeId}
export type GetEmployeeLoansResponse = ApiResponse<LoanDto[]>;

// GET /api/v1/loans/{id}
export type GetLoanResponse = ApiResponse<LoanDetailDto>;

// POST /api/v1/loans/{id}/approve
export type ApproveLoanResponse = ApiResponse<LoanDto>;

// POST /api/v1/loans/{id}/reject
export type RejectLoanResponse = ApiResponse<LoanDto>;

// POST /api/v1/loans/{id}/repayments
export type RecordLoanRepaymentResponse = ApiResponse<LoanDto>;

// DELETE /api/v1/loans/{id}/repayments/{repaymentId}
export type DeleteLoanRepaymentResponse = ApiResponse<LoanDto>;

// POST /api/v1/loans/{id}/default
export type DefaultLoanResponse = ApiResponse<LoanDto>;

// POST /api/v1/loans/{id}/reinstate
export type ReinstateLoanResponse = ApiResponse<LoanDto>;
