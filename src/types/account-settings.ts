import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface AccountEventDto {
  id: string;
  kind: AccountEventKind;
  event: string;
  ipAddress?: string | null;
  device?: string | null;
  succeeded: boolean;
  at: string;
  location?: string | null;
}

export type AccountEventKind =
  "signIn" | "failedSignIn" | "signOut" | "passwordChanged" | "other";

export type ChannelAvailability =
  "available" | "notWired" | "unavailable";

export interface ChannelRow {
  channel: NotificationChannel;
  availability: ChannelAvailability;
  reason: string;
}

export interface DeviceSessionDto {
  id: string;
  name: string;
  browser: string;
  operatingSystem: string;
  ipAddress?: string | null;
  signedInAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export type DigestFrequency =
  "realtime" | "daily" | "weekly";

export type NotificationChannel =
  "inApp" | "email" | "push";

export interface NotificationGroupChoice {
  id: string;
  email?: boolean;
  inApp?: boolean;
  push?: boolean;
}

export interface NotificationGroupRow {
  id: string;
  label: string;
  email: boolean;
  inApp: boolean;
  push: boolean;
  covers: string[];
}

export interface NotificationPreferenceRequest {
  groups: NotificationGroupChoice[];
  digestFrequency?: DigestFrequency;
  timeZoneId?: string | null;
  language?: string | null;
}

export interface NotificationPreferenceView {
  groups: NotificationGroupRow[];
  digestFrequency: DigestFrequency;
  timeZoneId?: string | null;
  language?: string | null;
  channels: ChannelRow[];
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/settings/me/notifications
export type GetMyNotificationSettingsResponse = ApiResponse<NotificationPreferenceView>;

// PUT /api/v1/settings/me/notifications
export type UpdateMyNotificationSettingsResponse = ApiResponse<NotificationPreferenceView>;

// GET /api/v1/settings/me/sessions
export type GetMySessionsResponse = ApiResponse<DeviceSessionDto[]>;

// DELETE /api/v1/settings/me/sessions/{id}
export type RevokeMySessionResponse = ApiResponse<unknown | null>;

// GET /api/v1/settings/me/activity
export type GetMyAccountActivityResponse = ApiResponse<AccountEventDto[]>;
export interface GetMyAccountActivityParams {
  take?: number;
}

