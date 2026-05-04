import type {
  HelpDeskTicket,
  FAQArticle,
  TicketCategory,
  TicketStatus,
  TicketPriority,
} from "@/src/lib/types/helpdesk";

export const TICKET_CATEGORY_CONFIG: Record<TicketCategory, { label: string; color: string; bg: string; border: string; icon: string }> = {
  payroll:     { label: "Payroll",     icon: "💰", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/60", border: "border-emerald-200 dark:border-emerald-800" },
  leave:       { label: "Leave",       icon: "🌴", color: "text-blue-700 dark:text-blue-400",       bg: "bg-blue-100 dark:bg-blue-950/60",       border: "border-blue-200 dark:border-blue-800" },
  it_support:  { label: "IT Support",  icon: "💻", color: "text-violet-700 dark:text-violet-400",   bg: "bg-violet-100 dark:bg-violet-950/60",   border: "border-violet-200 dark:border-violet-800" },
  hr_policy:   { label: "HR Policy",   icon: "📋", color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-100 dark:bg-amber-950/60",     border: "border-amber-200 dark:border-amber-800" },
  benefits:    { label: "Benefits",    icon: "🏥", color: "text-cyan-700 dark:text-cyan-400",       bg: "bg-cyan-100 dark:bg-cyan-950/60",       border: "border-cyan-200 dark:border-cyan-800" },
  onboarding:  { label: "Onboarding",  icon: "🎯", color: "text-indigo-700 dark:text-indigo-400",   bg: "bg-indigo-100 dark:bg-indigo-950/60",   border: "border-indigo-200 dark:border-indigo-800" },
  offboarding: { label: "Offboarding", icon: "👋", color: "text-rose-700 dark:text-rose-400",       bg: "bg-rose-100 dark:bg-rose-950/60",       border: "border-rose-200 dark:border-rose-800" },
  other:       { label: "Other",       icon: "❓", color: "text-slate-700 dark:text-slate-400",     bg: "bg-slate-100 dark:bg-slate-800",        border: "border-slate-200 dark:border-slate-700" },
};

export const TICKET_CATEGORY_OPTIONS: TicketCategory[] = [
  "payroll", "leave", "it_support", "hr_policy", "benefits", "onboarding", "offboarding", "other",
];

export const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; color: string; bg: string; border: string }> = {
  open:             { label: "Open",             color: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-100 dark:bg-blue-950/60",     border: "border-blue-200 dark:border-blue-800" },
  in_progress:      { label: "In Progress",      color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-950/60",   border: "border-amber-200 dark:border-amber-800" },
  pending:          { label: "Pending",          color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-950/60", border: "border-violet-200 dark:border-violet-800" },
  pending_response: { label: "Pending Response", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950/60", border: "border-orange-200 dark:border-orange-800" },
  resolved:         { label: "Resolved",         color: "text-emerald-700 dark:text-emerald-400",bg: "bg-emerald-100 dark:bg-emerald-950/60",border: "border-emerald-200 dark:border-emerald-800" },
  closed:           { label: "Closed",           color: "text-slate-700 dark:text-slate-400",   bg: "bg-slate-100 dark:bg-slate-800",      border: "border-slate-200 dark:border-slate-700" },
};

export const TICKET_STATUS_OPTIONS: TicketStatus[] = [
  "open", "in_progress", "pending", "pending_response", "resolved", "closed",
];

export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; bg: string; border: string }> = {
  low:    { label: "Low",    color: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-100 dark:bg-slate-800",        border: "border-slate-200 dark:border-slate-700" },
  medium: { label: "Medium", color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-950/60",     border: "border-amber-200 dark:border-amber-800" },
  high:   { label: "High",   color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-950/60",  border: "border-orange-200 dark:border-orange-800" },
  urgent: { label: "Urgent", color: "text-red-700 dark:text-red-400",       bg: "bg-red-100 dark:bg-red-950/60",        border: "border-red-200 dark:border-red-800" },
};

export const TICKET_PRIORITY_OPTIONS: TicketPriority[] = ["low", "medium", "high", "urgent"];

export const HR_AGENTS: { name: string; initials: string }[] = [
  { name: "Adaeze Okonkwo", initials: "AO" },
  { name: "Babatunde Lawal", initials: "BL" },
  { name: "Chiamaka Eze", initials: "CE" },
];

export const TICKETS: HelpDeskTicket[] = [
  {
    id: "t-001", ticketNumber: "TKT-0001", subject: "Salary not credited for January", description: "My January salary has not been credited to my account as of today.", category: "payroll", priority: "urgent", status: "in_progress", submitterName: "Emeka Nwosu", submitterInitials: "EN", submitterDept: "Engineering", assignedTo: "Adaeze Okonkwo", assignedInitials: "AO",
    messages: [
      { id: "m-001", authorName: "Emeka Nwosu", authorInitials: "EN", authorDept: "Engineering", isHR: false, content: "My January salary has not been credited to my account as of today.", createdAt: "2026-01-20T09:00:00Z" },
      { id: "m-002", authorName: "Adaeze Okonkwo", authorInitials: "AO", authorDept: "Human Resources", isHR: true, content: "We are investigating this with the Finance team. You will receive an update within 24 hours.", createdAt: "2026-01-20T10:30:00Z" },
    ],
    createdAt: "2026-01-20T09:00:00Z", updatedAt: "2026-01-20T10:30:00Z", slaDueAt: "2026-01-22T09:00:00Z", firstResponseAt: "2026-01-20T10:30:00Z", isOverdue: false,
  },
  {
    id: "t-002", ticketNumber: "TKT-0002", subject: "Unable to access payslip portal", description: "I cannot log in to the payslip portal. It says my account is locked.", category: "it_support", priority: "high", status: "open", submitterName: "Halima Musa", submitterInitials: "HM", submitterDept: "Human Resources",
    messages: [
      { id: "m-003", authorName: "Halima Musa", authorInitials: "HM", authorDept: "Human Resources", isHR: false, content: "I cannot log in to the payslip portal. It says my account is locked.", createdAt: "2026-01-21T08:00:00Z" },
    ],
    createdAt: "2026-01-21T08:00:00Z", updatedAt: "2026-01-21T08:00:00Z", slaDueAt: "2026-01-23T08:00:00Z", isOverdue: false,
  },
  {
    id: "t-003", ticketNumber: "TKT-0003", subject: "Annual leave balance query", description: "I applied for 5 days leave but only 3 were approved. Can you explain the calculation?", category: "leave", priority: "medium", status: "resolved", submitterName: "Chukwuebuka Obi", submitterInitials: "CO", submitterDept: "Sales", assignedTo: "Babatunde Lawal", assignedInitials: "BL",
    messages: [
      { id: "m-004", authorName: "Chukwuebuka Obi", authorInitials: "CO", authorDept: "Sales", isHR: false, content: "I applied for 5 days leave but only 3 were approved.", createdAt: "2026-01-18T11:00:00Z" },
      { id: "m-005", authorName: "Babatunde Lawal", authorInitials: "BL", authorDept: "Human Resources", isHR: true, content: "Your leave balance was 3 days remaining as of your application date. The approval reflects your available balance.", createdAt: "2026-01-18T14:00:00Z" },
    ],
    createdAt: "2026-01-18T11:00:00Z", updatedAt: "2026-01-18T14:00:00Z", resolvedAt: "2026-01-18T14:00:00Z", firstResponseAt: "2026-01-18T14:00:00Z", isOverdue: false,
  },
  {
    id: "t-004", ticketNumber: "TKT-0004", subject: "Health insurance card not received", description: "I joined three months ago but have not received my health insurance card.", category: "benefits", priority: "medium", status: "pending", submitterName: "Aisha Garba", submitterInitials: "AG", submitterDept: "Legal", assignedTo: "Chiamaka Eze", assignedInitials: "CE",
    messages: [
      { id: "m-006", authorName: "Aisha Garba", authorInitials: "AG", authorDept: "Legal", isHR: false, content: "I joined three months ago but have not received my health insurance card.", createdAt: "2026-01-19T10:00:00Z" },
      { id: "m-007", authorName: "Chiamaka Eze", authorInitials: "CE", authorDept: "Human Resources", isHR: true, content: "We have escalated this to our HMO provider. Pending their response.", createdAt: "2026-01-19T12:00:00Z" },
    ],
    createdAt: "2026-01-19T10:00:00Z", updatedAt: "2026-01-19T12:00:00Z", isOverdue: true, slaDueAt: "2026-01-21T10:00:00Z",
  },
  {
    id: "t-005", ticketNumber: "TKT-0005", subject: "Remote work policy clarification", description: "What is the official policy on remote work for engineering staff?", category: "hr_policy", priority: "low", status: "closed", submitterName: "Tunde Badmus", submitterInitials: "TB", submitterDept: "Engineering", assignedTo: "Adaeze Okonkwo", assignedInitials: "AO",
    messages: [
      { id: "m-008", authorName: "Tunde Badmus", authorInitials: "TB", authorDept: "Engineering", isHR: false, content: "What is the official policy on remote work for engineering staff?", createdAt: "2026-01-10T09:00:00Z" },
      { id: "m-009", authorName: "Adaeze Okonkwo", authorInitials: "AO", authorDept: "Human Resources", isHR: true, content: "Engineering staff may work remotely up to 3 days per week with manager approval. Full policy is in the HR Handbook.", createdAt: "2026-01-10T11:00:00Z" },
    ],
    createdAt: "2026-01-10T09:00:00Z", updatedAt: "2026-01-10T11:00:00Z", resolvedAt: "2026-01-10T11:00:00Z", closedAt: "2026-01-11T09:00:00Z", firstResponseAt: "2026-01-10T11:00:00Z", isOverdue: false,
  },
];

export const FAQ_ARTICLES: FAQArticle[] = [
  { id: "faq-001", category: "payroll", question: "When is payroll processed each month?", answer: "Payroll is processed on the last working day of each month and credited within 2 working days.", title: "Payroll Processing Schedule", content: "Payroll is processed on the last working day of each month and credited within 2 working days. Please ensure your bank details are up to date.", views: 340, helpful: 280 },
  { id: "faq-002", category: "leave", question: "How do I apply for annual leave?", answer: "Log in to the HR portal, navigate to Leave Management, and submit a new leave request. Your manager will receive an automatic notification.", title: "Applying for Annual Leave", content: "To apply for annual leave: Log in to the HR portal, navigate to Leave Management, and submit a new leave request. Your manager will receive an automatic notification.", views: 520, helpful: 460 },
  { id: "faq-003", category: "benefits", question: "Who is eligible for health insurance?", answer: "All full-time permanent employees are eligible from their start date. Part-time and contract staff are eligible after 6 months.", title: "Health Insurance Eligibility", content: "All full-time permanent employees are eligible from their start date. Part-time and contract staff are eligible after 6 months.", views: 210, helpful: 190 },
  { id: "faq-004", category: "onboarding", question: "What documents do I need to submit on my first day?", answer: "You will need to provide a valid ID, proof of address, tax ID, bank account details, and your academic certificates.", title: "First Day Documents", content: "You will need to provide a valid ID, proof of address, tax ID, bank account details, and your academic certificates.", views: 180, helpful: 155 },
  { id: "faq-005", category: "hr_policy", question: "How many sick days am I entitled to per year?", answer: "Full-time employees are entitled to 10 sick days per year. Sick days exceeding this require a medical certificate.", title: "Sick Leave Entitlement", content: "Full-time employees are entitled to 10 sick days per year. Sick days exceeding this require a medical certificate.", views: 295, helpful: 255 },
];

export function getCategoryBreakdown(tickets: HelpDeskTicket[]): Record<TicketCategory, number> {
  const result = {} as Record<TicketCategory, number>;
  for (const c of TICKET_CATEGORY_OPTIONS) result[c] = 0;
  for (const t of tickets) result[t.category] = (result[t.category] ?? 0) + 1;
  return result;
}

export function getStatusBreakdown(tickets: HelpDeskTicket[]): Record<TicketStatus, number> {
  const result = {} as Record<TicketStatus, number>;
  for (const s of TICKET_STATUS_OPTIONS) result[s] = 0;
  for (const t of tickets) result[t.status] = (result[t.status] ?? 0) + 1;
  return result;
}

export function computeHelpdeskStats(tickets: HelpDeskTicket[]): {
  total: number;
  open: number;
  resolved: number;
  overdue: number;
  resolvedToday: number;
} {
  const today = new Date().toISOString().slice(0, 10);
  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
    overdue: tickets.filter((t) => t.isOverdue === true).length,
    resolvedToday: tickets.filter((t) => t.resolvedAt?.startsWith(today)).length,
  };
}
