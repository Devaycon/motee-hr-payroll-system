import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface HireTrackerRowDto {
  id: string;
  workforceRequestId?: string | null;
  requisitionId?: string | null;
  title: string;
  departmentId?: string | null;
  departmentName?: string | null;
  stage: HiringStage;
  step: number;
  detail: string;
  person?: string | null;
  hiringManagerId?: string | null;
  hiringManagerName?: string | null;
  daysSinceMoved: number;
  stalled: boolean;
  applicants: number;
  inSelection: number;
  openings: number;
}

export type HiringStage =
  | "workforcePlanning"
  | "requisition"
  | "attract"
  | "select"
  | "preEmployment"
  | "onboard";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/hire-tracker
export type GetHireTrackerResponse = ApiResponse<HireTrackerRowDto[]>;

export interface GetHireTrackerParams {
  DepartmentId?: string;
  Stage?: HiringStage;
  Stalled?: boolean;
  Search?: string;
}
