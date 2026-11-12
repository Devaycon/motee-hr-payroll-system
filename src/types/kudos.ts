import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type CompanyValue =
  "integrity" | "innovation" | "collaboration" | "excellence" | "customerFirst";

export interface KudosCommentDto {
  id: string;
  authorEmployeeId: string;
  authorName?: string | null;
  authorDepartmentName?: string | null;
  message: string;
  canRemove: boolean;
  createdAt: string;
}

export interface KudosCommentRequest {
  message: string;
}

export interface KudosForMeDto {
  received: KudosPostDto[];
  sent: KudosPostDto[];
  receivedCount: number;
  sentCount: number;
  streak: number;
}

export interface KudosPostDto {
  id: string;
  senderEmployeeId: string;
  senderName?: string | null;
  senderDepartmentName?: string | null;
  recipientEmployeeId?: string | null;
  recipientName?: string | null;
  recipientDepartmentId?: string | null;
  recipientDepartmentName?: string | null;
  recipientKind: KudosRecipientKind;
  kudosType: KudosType;
  customTypeName?: string | null;
  companyValue: CompanyValue;
  message: string;
  visibility: KudosVisibility;
  isAnnounced: boolean;
  isPinned: boolean;
  reactions: KudosReactionDto[];
  comments: KudosCommentDto[];
  canRemove: boolean;
  createdAt: string;
}

export interface KudosReactionDto {
  type: ReactionType;
  count: number;
  mine: boolean;
}

export type KudosRecipientKind = "individual" | "department";

export interface KudosRequest {
  recipientEmployeeId?: string | null;
  recipientDepartmentId?: string | null;
  kudosType?: KudosType;
  customTypeName?: string | null;
  companyValue?: CompanyValue;
  message: string;
  visibility?: KudosVisibility;
}

export interface KudosStanding {
  employeeId: string;
  rank: number;
  received: number;
  sent: number;
  streak: number;
}

export interface KudosStandingDto {
  standing: KudosStanding;
  employeeName?: string | null;
  departmentName?: string | null;
}

export interface KudosTally {
  total: number;
  thisMonth: number;
  commonestType?: KudosType | null;
  commonestTypeCount: number;
  commonestValue?: CompanyValue | null;
  commonestValueCount: number;
  givers: number;
  participationPercent: number;
}

export type KudosType =
  | "teamwork"
  | "innovation"
  | "leadership"
  | "customerFocus"
  | "excellence"
  | "growth"
  | "custom";

export type KudosVisibility = "private" | "public" | "broadcast";

export interface ReactionRequest {
  type: ReactionType;
}

export type ReactionType =
  "heart" | "fire" | "clap" | "star" | "rocket" | "celebrate";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/kudos
export type GetKudosResponse = ApiResponse<PagedResult<KudosPostDto>>;

export interface GetKudosParams {
  KudosType?: KudosType;
  CompanyValue?: CompanyValue;
  RecipientEmployeeId?: string;
  SenderEmployeeId?: string;
  Month?: string;
  PinnedOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/kudos
export type CreateKudosResponse = ApiResponse<KudosPostDto>;

// GET /api/v1/kudos/summary
export type GetKudosSummaryResponse = ApiResponse<KudosTally>;

// GET /api/v1/kudos/leaderboard
export type GetKudosLeaderboardResponse = ApiResponse<KudosStandingDto[]>;

export interface GetKudosLeaderboardParams {
  take?: number;
}

// GET /api/v1/kudos/me
export type GetMyKudosResponse = ApiResponse<KudosForMeDto>;

// GET /api/v1/kudos/{id}
export type GetKudosPostResponse = ApiResponse<KudosPostDto>;

// DELETE /api/v1/kudos/{id}
export type DeleteKudosResponse = ApiResponse<null>;

// POST /api/v1/kudos/{id}/pin
export type PinKudosResponse = ApiResponse<KudosPostDto>;

// DELETE /api/v1/kudos/{id}/pin
export type UnpinKudosResponse = ApiResponse<KudosPostDto>;

// POST /api/v1/kudos/{id}/reactions
export type ReactToKudosResponse = ApiResponse<KudosPostDto>;

// POST /api/v1/kudos/{id}/comments
export type CommentOnKudosResponse = ApiResponse<KudosPostDto>;

// DELETE /api/v1/kudos/{id}/comments/{commentId}
export type DeleteKudosCommentResponse = ApiResponse<KudosPostDto>;
