import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface PickListOptionDto {
  id: string;
  value: string;
  isDefault: boolean;
}

export interface PickListValueRequest {
  value: string;
  isDefault?: boolean;
}

export interface PickListView {
  id: string;
  name: string;
  description: string;
  options: PickListOptionDto[];
  editable: boolean;
  ownedBy?: string | null;
  ownerRoute?: string | null;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/settings/pick-lists
export type GetPickListsResponse = ApiResponse<PickListView[]>;

// GET /api/v1/settings/pick-lists/{key}
export type GetPickListResponse = ApiResponse<PickListView>;

// POST /api/v1/settings/pick-lists/{key}/options
export type AddPickListOptionResponse = ApiResponse<PickListView>;

// PUT /api/v1/settings/pick-lists/{key}/options/{id}
export type UpdatePickListOptionResponse = ApiResponse<PickListView>;

// DELETE /api/v1/settings/pick-lists/{key}/options/{id}
export type DeletePickListOptionResponse = ApiResponse<PickListView>;

// PUT /api/v1/settings/pick-lists/{key}/options/{id}/default
export type SetDefaultPickListOptionResponse = ApiResponse<PickListView>;

