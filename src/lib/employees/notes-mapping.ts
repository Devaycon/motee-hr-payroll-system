import type { EmployeeNoteDto } from "@/src/types/employee-notes";
import type { LocaleEmployeeNote } from "@/src/lib/types/locale";

/** An employee note from the API, in the profile's Notes & Reminders shape. */
export function noteFromApi(dto: EmployeeNoteDto): LocaleEmployeeNote {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    authorId: dto.authorName ?? "",
    body: dto.body,
    createdAt: dto.createdAt,
    pinned: dto.pinned,
    type: dto.kind,
    remindAt: dto.remindAt ? dto.remindAt.slice(0, 10) : null,
    visibility: dto.audience === "managerAndHr" ? "manager_and_hr" : "hr_only",
  };
}
