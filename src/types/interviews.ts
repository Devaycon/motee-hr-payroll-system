import type { ApiResponse } from "./api";

export interface InterviewDto {
  id: string;
  candidateId: string;
  candidateName: string;
  requisitionId: string;
  requisitionTitle?: string | null;
  round: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: InterviewMode;
  panel: string[];
  panelNames: string[];
  location?: string | null;
  status: InterviewStatus;
  clashes: string[];
}

export type InterviewMode =
  | "onsite"
  | "video"
  | "phone";

export interface InterviewRequest {
  candidateId: string;
  round: string;
  scheduledAt: string;
  durationMinutes?: number;
  mode?: InterviewMode;
  panel?: string[] | null;
  location?: string | null;
}

export type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/interviews
export type GetInterviewsResponse = ApiResponse<InterviewDto[]>;

export interface GetInterviewsParams {
  requisitionId?: string;
}

// POST /api/v1/interviews
export type ScheduleInterviewResponse = ApiResponse<InterviewDto>;

// GET /api/v1/interviews/candidate/{candidateId}
export type GetCandidateInterviewsResponse = ApiResponse<InterviewDto[]>;

// PUT /api/v1/interviews/{id}
export type UpdateInterviewResponse = ApiResponse<InterviewDto>;

// POST /api/v1/interviews/{id}/complete
export type CompleteInterviewResponse = ApiResponse<InterviewDto>;

// POST /api/v1/interviews/{id}/cancel
export type CancelInterviewResponse = ApiResponse<InterviewDto>;
