"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  HelpDeskTicket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/src/lib/types/helpdesk";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawTicket {
  id?: string;
  ticketNumber?: string;
  subject?: string;
  title?: string;
  description?: string;
  body?: string;
  category?: string;
  priority?: string;
  status?: string;
  requesterId?: string;
  submitterId?: string;
  assigneeId?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  slaDueAt?: string;
  isOverdue?: boolean;
  messages?: Array<{
    id?: string;
    authorId?: string;
    content?: string;
    body?: string;
    createdAt?: string;
    isInternalNote?: boolean;
  }>;
}

function mapCategory(c?: string): TicketCategory {
  if (
    c === "payroll" ||
    c === "leave" ||
    c === "it_support" ||
    c === "hr_policy" ||
    c === "benefits" ||
    c === "onboarding" ||
    c === "offboarding"
  ) {
    return c;
  }
  if (c === "IT" || c === "it" || c === "Tech") return "it_support";
  if (c === "HR" || c === "hr") return "hr_policy";
  if (c === "Finance") return "payroll";
  if (c === "Facilities") return "other";
  return "other";
}

function mapPriority(p?: string): TicketPriority {
  if (p === "urgent" || p === "high" || p === "medium" || p === "low") return p;
  if (p === "critical") return "urgent";
  if (p === "normal") return "medium";
  return "medium";
}

function mapStatus(s?: string): TicketStatus {
  if (
    s === "open" ||
    s === "in_progress" ||
    s === "pending" ||
    s === "pending_response" ||
    s === "resolved" ||
    s === "closed"
  ) {
    return s;
  }
  return "open";
}

function buildTickets(bundle: LocaleBundle): HelpDeskTicket[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return ((bundle.helpdeskTickets ?? []) as RawTicket[]).map((raw, i) => {
    const id = raw.id ?? `HD-${String(i + 1).padStart(3, "0")}`;
    const submitterId = raw.requesterId ?? raw.submitterId;
    const submitter = submitterId ? employeesById.get(submitterId) : null;
    const assigneeId = raw.assigneeId;
    const assignee = assigneeId ? employeesById.get(assigneeId) : null;
    const createdAt = raw.createdAt ?? bundle.tenant.createdAt.slice(0, 10);
    const messages = (raw.messages ?? []).map((m, j) => {
      const author = m.authorId ? employeesById.get(m.authorId) : null;
      return {
        id: m.id ?? `${id}-m${j + 1}`,
        authorName: author?.fullName ?? "HR",
        authorInitials: author?.initials ?? "HA",
        authorDept: author?.departmentName,
        content: m.content ?? m.body ?? "",
        createdAt: m.createdAt ?? createdAt,
        isHR: !author || author.departmentName?.toLowerCase().includes("people") || false,
        isInternalNote: m.isInternalNote ?? false,
      };
    });
    return {
      id,
      ticketNumber: raw.ticketNumber ?? `TKT-${String(i + 1).padStart(4, "0")}`,
      subject: raw.subject ?? raw.title ?? "Untitled",
      description: raw.description ?? raw.body ?? "",
      category: mapCategory(raw.category),
      priority: mapPriority(raw.priority),
      status: mapStatus(raw.status),
      submitterName: submitter?.fullName ?? submitterId ?? "Unknown",
      submitterInitials: submitter?.initials ?? "??",
      submitterDept: submitter?.departmentName ?? "—",
      assignedTo: assignee?.fullName,
      assignedInitials: assignee?.initials,
      messages: messages.length
        ? messages
        : [
            {
              id: `${id}-m1`,
              authorName: submitter?.fullName ?? "Submitter",
              authorInitials: submitter?.initials ?? "??",
              authorDept: submitter?.departmentName,
              content: raw.description ?? raw.body ?? "",
              createdAt,
              isHR: false,
              isInternalNote: false,
            },
          ],
      createdAt,
      updatedAt: raw.updatedAt ?? createdAt,
      resolvedAt: raw.resolvedAt,
      slaDueAt: raw.slaDueAt,
      isOverdue: raw.isOverdue ?? false,
    };
  });
}

export function useHelpdeskTickets() {
  return useLocaleSection<HelpDeskTicket[]>(buildTickets);
}
