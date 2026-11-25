import type {
  TicketCategory as ApiCategory,
  TicketDto,
  TicketPriority as ApiPriority,
  TicketStatus as ApiStatus,
} from "@/src/types/helpdesk";
import type {
  HelpDeskTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/src/lib/types/helpdesk";

const CATEGORY_FROM_API: Record<ApiCategory, TicketCategory> = {
  payroll: "payroll",
  leave: "leave",
  itSupport: "it_support",
  hrPolicy: "hr_policy",
  benefits: "benefits",
  onboarding: "onboarding",
  offboarding: "offboarding",
  other: "other",
};
const CATEGORY_TO_API = Object.fromEntries(
  Object.entries(CATEGORY_FROM_API).map(([k, v]) => [v, k]),
) as Record<TicketCategory, ApiCategory>;

const STATUS_FROM_API: Record<ApiStatus, TicketStatus> = {
  open: "open",
  inProgress: "in_progress",
  pending: "pending",
  pendingResponse: "pending_response",
  resolved: "resolved",
  closed: "closed",
};
const STATUS_TO_API = Object.fromEntries(
  Object.entries(STATUS_FROM_API).map(([k, v]) => [v, k]),
) as Record<TicketStatus, ApiStatus>;

export const categoryFromApi = (c: ApiCategory): TicketCategory => CATEGORY_FROM_API[c] ?? "other";
export const categoryToApi = (c: TicketCategory): ApiCategory => CATEGORY_TO_API[c] ?? "other";
export const statusFromApi = (s: ApiStatus): TicketStatus => STATUS_FROM_API[s] ?? "open";
export const statusToApi = (s: TicketStatus): ApiStatus => STATUS_TO_API[s] ?? "open";
/** Priorities share their spelling on both sides. */
export const priorityToApi = (p: TicketPriority): ApiPriority => p;

export function initials(name: string | null | undefined): string {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "??";
}

export function ticketFromApi(dto: TicketDto): HelpDeskTicket {
  const submitterName = dto.submitterName ?? "Unknown";
  const messages = dto.messages.map((m) => ({
    id: m.id,
    authorName: m.authorName ?? (m.isFromAgent ? "HR" : submitterName),
    authorInitials: initials(m.authorName ?? (m.isFromAgent ? "HR" : submitterName)),
    authorDept: m.authorDepartmentName ?? undefined,
    content: m.body,
    createdAt: m.createdAt,
    isHR: m.isFromAgent,
    isInternalNote: m.isInternalNote,
  }));
  return {
    id: dto.id,
    ticketNumber: dto.reference,
    subject: dto.subject,
    description: dto.description,
    category: categoryFromApi(dto.category),
    priority: dto.priority,
    status: statusFromApi(dto.status),
    submitterName,
    submitterInitials: initials(submitterName),
    submitterDept: dto.submitterDepartmentName ?? "—",
    assignedTo: dto.assigneeName ?? undefined,
    assignedInitials: dto.assigneeName ? initials(dto.assigneeName) : undefined,
    // The screens open a case on its first message: the description.
    messages: messages.length
      ? messages
      : [
          {
            id: `${dto.id}-m1`,
            authorName: submitterName,
            authorInitials: initials(submitterName),
            authorDept: dto.submitterDepartmentName ?? undefined,
            content: dto.description,
            createdAt: dto.createdAt,
            isHR: false,
            isInternalNote: false,
          },
        ],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    resolvedAt: dto.resolvedAt ?? undefined,
    slaDueAt: dto.slaDueAt,
    firstResponseAt: dto.firstReplyAt ?? undefined,
    isOverdue: dto.isOverdue,
  };
}
