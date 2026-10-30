import type {
  AnnouncementAudience as ApiAudience,
  AnnouncementDto,
  AnnouncementRequest,
} from "@/src/types/announcements";
import type {
  Announcement,
  AnnouncementAudience,
  AnnouncementStatus,
  NewAnnouncement,
} from "@/src/lib/types/announcements";
import { getInitials } from "@/src/lib/types/dashboard";

/**
 * The API spells the audience in camelCase and reports the lifecycle as a
 * free-form status string. Publishing is its own call, so the form's status
 * is not part of the request body.
 */

const STATUSES: AnnouncementStatus[] = [
  "draft",
  "scheduled",
  "published",
  "expired",
  "archived",
];

function toStatus(status: string): AnnouncementStatus {
  const s = status.toLowerCase() as AnnouncementStatus;
  return STATUSES.includes(s) ? s : "published";
}

function toAudience(audience: ApiAudience): AnnouncementAudience {
  return audience === "allStaff" ? "all_staff" : audience;
}

/** The form offers "Role Specific", which the API models as managers. */
function audienceToApi(audience: string): ApiAudience {
  if (audience === "department" || audience === "leadership") return audience;
  if (audience === "managers" || audience === "role_specific") return "managers";
  return "allStaff";
}

export function toAnnouncement(dto: AnnouncementDto): Announcement {
  const status = toStatus(dto.status);
  const createdBy = dto.createdByName || "HR Admin";
  return {
    id: dto.id,
    title: dto.title,
    body: dto.body,
    type: dto.type,
    status,
    priority: dto.priority,
    audience: toAudience(dto.audience),
    targetDepartments: dto.targetDepartments,
    isPinned: dto.isPinned,
    requiresAcknowledgement: dto.requiresAcknowledgement,
    scheduledFor: dto.scheduledFor ?? undefined,
    expiresAt: dto.expiresAt ?? undefined,
    attachmentName: dto.attachmentName ?? undefined,
    createdAt: dto.createdAt,
    createdBy,
    createdByInitials: getInitials(createdBy),
    viewCount: dto.viewCount,
    acknowledgements: dto.acknowledgements.map((a) => ({
      id: a.employeeId,
      employeeName: a.employeeName,
      employeeInitials: getInitials(a.employeeName),
      department: a.department ?? "",
      acknowledgedAt: a.acknowledgedAt,
    })),
    totalTargeted: dto.totalTargeted,
    publishedAt: dto.publishedAt ?? undefined,
    isArchived: status === "archived",
  };
}

/** Department names on the form become ids; unknown names are dropped. */
export function announcementToRequest(
  input: NewAnnouncement,
  departmentIdByName: Map<string, string>,
  /** Kept on edit so a file attached elsewhere is not cleared. */
  attachmentFileId?: string | null,
): AnnouncementRequest {
  const audience = audienceToApi(input.audience);
  return {
    title: input.title.trim(),
    body: input.body.trim(),
    type: input.type,
    priority: input.priority,
    audience,
    targetDepartmentIds:
      audience === "department"
        ? (input.targetDepartments ?? [])
            .map((name) => departmentIdByName.get(name))
            .filter((id): id is string => !!id)
        : null,
    isPinned: input.isPinned,
    requiresAcknowledgement: input.requiresAcknowledgement,
    scheduledFor: input.scheduledFor || null,
    expiresAt: input.expiresAt || null,
    attachmentFileId: attachmentFileId ?? null,
  };
}

/** The stored request for an existing announcement, for one-field updates. */
export function dtoToRequest(dto: AnnouncementDto): AnnouncementRequest {
  return {
    title: dto.title,
    body: dto.body,
    type: dto.type,
    priority: dto.priority,
    audience: dto.audience,
    targetDepartmentIds: dto.targetDepartmentIds,
    isPinned: dto.isPinned,
    requiresAcknowledgement: dto.requiresAcknowledgement,
    scheduledFor: dto.scheduledFor ?? null,
    expiresAt: dto.expiresAt ?? null,
    attachmentFileId: dto.attachmentFileId ?? null,
  };
}
