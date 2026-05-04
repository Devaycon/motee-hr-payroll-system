export type TicketCategory =
  | "payroll"
  | "leave"
  | "it_support"
  | "hr_policy"
  | "benefits"
  | "onboarding"
  | "offboarding"
  | "other";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "pending"
  | "pending_response"
  | "resolved"
  | "closed";

export interface TicketMessage {
  id: string;
  authorName: string;
  authorInitials: string;
  authorDept?: string;
  isHR: boolean;
  isInternalNote?: boolean;
  content: string;
  createdAt: string;
}

export interface HelpDeskTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  submitterName: string;
  submitterInitials: string;
  submitterDept: string;
  assignedTo?: string;
  assignedInitials?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  slaDueAt?: string;
  firstResponseAt?: string;
  isOverdue?: boolean;
}

export interface NewTicket {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  submitterName: string;
  submitterDept: string;
  submitterInitials: string;
}

export interface FAQArticle {
  id: string;
  category: TicketCategory;
  question: string;
  answer: string;
  title?: string;
  content?: string;
  views: number;
  helpful: number;
}

