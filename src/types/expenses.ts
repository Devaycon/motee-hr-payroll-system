import type { ApiResponse, PagedResult } from "./api";
import type { ApprovalDto } from "./common";

export type ExpenseCategory =
  | "travel"
  | "meals"
  | "accommodation"
  | "equipment"
  | "software"
  | "training"
  | "other";

export interface ExpenseClaimDto {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  reference?: string | null;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  merchant: string;
  incurredOn: string;
  notes?: string | null;
  status: ExpenseStatus;
  returned: boolean;
  returnedReason?: string | null;
  receiptFileIds: string[];
  review?: ApprovalDto;
  submittedAt?: string | null;
  reimbursedAt?: string | null;
  createdAt: string;
}

export interface ExpenseClaimRequest {
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency?: string | null;
  merchant: string;
  incurredOn: string;
  notes?: string | null;
  receiptFileIds?: string[] | null;
}

export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "reimbursed";

export interface ReturnClaimRequest {
  reason: string;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/expenses/claims/mine
export type GetMyExpenseClaimsResponse = ApiResponse<PagedResult<ExpenseClaimDto>>;

export interface GetMyExpenseClaimsParams {
  EmployeeId?: string;
  DepartmentId?: string;
  Status?: ExpenseStatus;
  Category?: ExpenseCategory;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/expenses/claims/mine
export type CreateMyExpenseClaimResponse = ApiResponse<ExpenseClaimDto>;

// PUT /api/v1/expenses/claims/mine/{id}
export type UpdateMyExpenseClaimResponse = ApiResponse<ExpenseClaimDto>;

// DELETE /api/v1/expenses/claims/mine/{id}
export type DeleteMyExpenseClaimResponse = ApiResponse<null>;

// POST /api/v1/expenses/claims/mine/{id}/submit
export type SubmitMyExpenseClaimResponse = ApiResponse<ExpenseClaimDto>;

// POST /api/v1/expenses/claims/mine/{id}/withdraw
export type WithdrawMyExpenseClaimResponse = ApiResponse<ExpenseClaimDto>;

// GET /api/v1/expenses/claims
export type GetExpenseClaimsResponse = ApiResponse<PagedResult<ExpenseClaimDto>>;

export interface GetExpenseClaimsParams {
  EmployeeId?: string;
  DepartmentId?: string;
  Status?: ExpenseStatus;
  Category?: ExpenseCategory;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/expenses/claims/{id}
export type GetExpenseClaimResponse = ApiResponse<ExpenseClaimDto>;

// POST /api/v1/expenses/claims/{id}/return
export type ReturnExpenseClaimResponse = ApiResponse<ExpenseClaimDto>;

// POST /api/v1/expenses/claims/{id}/reimburse
export type ReimburseExpenseClaimResponse = ApiResponse<ExpenseClaimDto>;
