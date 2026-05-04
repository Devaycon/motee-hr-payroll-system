export type TenantPlan = "starter" | "growth" | "enterprise";

export type TenantStatus = "active" | "suspended" | "trial";

export interface Tenant {
  id: string;
  name: string;
  logo: string | null;
  plan: TenantPlan;
  status: TenantStatus;
  employeeCount: number;
  billingEmail: string;
  createdAt: string;
  mrr: number;
}

export type InvoiceStatus = "paid" | "overdue" | "pending";

export interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate: string;
}

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketStatus = "open" | "in_progress" | "resolved";

export interface SupportTicket {
  id: string;
  tenantName: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
}

export interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  mrr: number;
  arr: number;
  churnRate: number;
  ticketsOpen: number;
}
