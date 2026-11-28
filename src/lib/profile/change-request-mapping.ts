import type { ChangeRequest } from "@/src/lib/types/profile-edits";
import type { ChangeRequestDto } from "@/src/types/change-requests";
import { profilePathForServerKey } from "@/src/lib/employees/profile-field-sync";

/**
 * A server change request as the Profile Change Request Log shows it. The
 * field is mapped back onto the profile's own path so a pending request still
 * badges its field and blocks a second request for it.
 *
 * Withdrawn requests are left out: withdrawing removes the row on screen,
 * exactly as cancelling did before.
 */
export function changeRequestFromApi(dto: ChangeRequestDto): ChangeRequest | null {
  if (dto.status === "withdrawn") return null;
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    field: profilePathForServerKey(dto.field),
    label: dto.label,
    currentValue: dto.currentValue ?? "",
    // A photo request carries the image as a file rather than a value.
    requestedValue: dto.requestedValue ?? dto.fileUrl ?? "",
    reason: dto.reason,
    status: dto.status,
    requestedBy: dto.requestedByName ?? dto.employeeName,
    requestedAt: dto.requestedAt,
    decidedBy: dto.decidedByName ?? undefined,
    decidedAt: dto.decidedAt ?? undefined,
    decisionNote: dto.decisionNote ?? undefined,
  };
}

export function changeRequestsFromApi(dtos: ChangeRequestDto[]): ChangeRequest[] {
  return dtos
    .map(changeRequestFromApi)
    .filter((r): r is ChangeRequest => r !== null)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}
