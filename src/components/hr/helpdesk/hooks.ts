"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import {
  isServerId,
  useIsLive,
  useLiveSender,
  usePeopleDirectory,
} from "@/src/lib/live/use-is-live";
import {
  categoryToApi,
  priorityToApi,
  statusToApi,
  ticketFromApi,
} from "@/src/lib/helpdesk/api-mapping";
import { useGetAllHelpdeskTicketsQuery } from "@/src/store/services/collections";
import {
  useAssignHelpdeskTicketMutation,
  useCreateHelpdeskTicketMutation,
  useDeleteHelpdeskTicketMutation,
  useGetMyHelpdeskTicketsQuery,
  useReplyToHelpdeskTicketMutation,
  useSetHelpdeskTicketPriorityMutation,
  useSetHelpdeskTicketStatusMutation,
} from "@/src/store/services/helpdesk";
import type {
  NewTicket,
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

/** Every case: from the API when signed in, the bundle otherwise. */
export function useHelpdeskTickets() {
  const live = useIsLive();
  const demo = useLocaleSection<HelpDeskTicket[]>(buildTickets);
  const q = useGetAllHelpdeskTicketsQuery(undefined, { skip: !live });
  const data = useMemo(() => (q.data ? q.data.map(ticketFromApi) : null), [q.data]);
  if (!live) return demo;
  return { data, loading: q.isLoading, error: null };
}

/** The signed-in employee's own cases (`GET /helpdesk/mine`). */
export function useMyHelpdeskTickets() {
  const live = useIsLive();
  const q = useGetMyHelpdeskTicketsQuery(undefined, { skip: !live });
  const data = useMemo(
    () => (q.data?.data ? q.data.data.map(ticketFromApi) : null),
    [q.data],
  );
  return { live, data, loading: q.isLoading };
}

/**
 * Sends the help desk screens' changes to the API. The screens update their
 * local copy first; a refused call refetches, replacing it with the server's.
 * Every action is a no-op signed out.
 */
export function useHelpdeskActions() {
  const live = useIsLive();
  const send = useLiveSender(["Helpdesk"]);
  const people = usePeopleDirectory();
  const [create] = useCreateHelpdeskTicketMutation();
  const [setStatus] = useSetHelpdeskTicketStatusMutation();
  const [setPriority] = useSetHelpdeskTicketPriorityMutation();
  const [assign] = useAssignHelpdeskTicketMutation();
  const [reply] = useReplyToHelpdeskTicketMutation();
  const [remove] = useDeleteHelpdeskTicketMutation();

  return useMemo(
    () => ({
      live,
      create: (t: NewTicket, onBehalfOf?: string | null) =>
        live
          ? send(
              () =>
                create({
                  subject: t.subject,
                  description: t.description,
                  category: categoryToApi(t.category),
                  priority: priorityToApi(t.priority),
                  // `null` raises it as the signed-in employee; left out, the
                  // submitter picked on the form is looked up by name.
                  submitterEmployeeId:
                    onBehalfOf === undefined
                      ? (people.idOf(t.submitterName) ?? null)
                      : onBehalfOf,
                }).unwrap(),
              "Could not raise the case.",
            )
          : Promise.resolve(true),
      status: (id: string, status: TicketStatus) =>
        live && isServerId(id)
          ? send(
              () => setStatus({ id, body: { status: statusToApi(status) } }).unwrap(),
              "Could not change the case status.",
            )
          : Promise.resolve(true),
      priority: (id: string, priority: TicketPriority) =>
        live && isServerId(id)
          ? send(
              () => setPriority({ id, body: { priority: priorityToApi(priority) } }).unwrap(),
              "Could not change the priority.",
            )
          : Promise.resolve(true),
      assign: (id: string, agentName: string) =>
        live && isServerId(id)
          ? send(
              () =>
                assign({
                  id,
                  body: { assigneeEmployeeId: people.idOf(agentName) ?? null },
                }).unwrap(),
              "Could not assign the case.",
            )
          : Promise.resolve(true),
      reply: (id: string, body: string, isInternalNote: boolean) =>
        live && isServerId(id)
          ? send(
              () => reply({ id, body: { body, isInternalNote } }).unwrap(),
              "Could not send the reply.",
            )
          : Promise.resolve(true),
      remove: (id: string) =>
        live && isServerId(id)
          ? send(() => remove(id).unwrap(), "Could not delete the case.")
          : Promise.resolve(true),
    }),
    [live, send, people, create, setStatus, setPriority, assign, reply, remove],
  );
}
