import {
  Building2,
  CreditCard,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldAlert,
  Webhook,
  UserPlus,
  ArrowUpRight,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ChartConfig } from "@/src/components/ui/chart";
import type { Tenant, Invoice, SupportTicket, PlatformStats } from "@/src/lib/types/motee.types";

export const DEMO_TENANTS: Tenant[] = [
  {
    id: "t-001",
    name: "Zenith Bank Nigeria",
    logo: null,
    plan: "enterprise",
    status: "active",
    employeeCount: 2400,
    billingEmail: "finance@zenithbank.com",
    createdAt: "2023-01-12",
    mrr: 2499,
  },
  {
    id: "t-002",
    name: "MTN Nigeria",
    logo: null,
    plan: "enterprise",
    status: "active",
    employeeCount: 1850,
    billingEmail: "billing@mtnnigeria.com",
    createdAt: "2023-03-08",
    mrr: 2499,
  },
  {
    id: "t-003",
    name: "Dangote Industries",
    logo: null,
    plan: "enterprise",
    status: "active",
    employeeCount: 1200,
    billingEmail: "hr@dangote.com",
    createdAt: "2023-02-20",
    mrr: 2499,
  },
  {
    id: "t-004",
    name: "Flutterwave",
    logo: null,
    plan: "growth",
    status: "active",
    employeeCount: 380,
    billingEmail: "ops@flutterwave.com",
    createdAt: "2023-06-15",
    mrr: 999,
  },
  {
    id: "t-005",
    name: "Interswitch",
    logo: null,
    plan: "growth",
    status: "active",
    employeeCount: 520,
    billingEmail: "admin@interswitch.com",
    createdAt: "2023-04-02",
    mrr: 999,
  },
  {
    id: "t-006",
    name: "BrightTech Ltd",
    logo: null,
    plan: "starter",
    status: "active",
    employeeCount: 65,
    billingEmail: "ceo@brighttech.ng",
    createdAt: "2024-01-10",
    mrr: 299,
  },
  {
    id: "t-007",
    name: "Nova Finance",
    logo: null,
    plan: "growth",
    status: "trial",
    employeeCount: 110,
    billingEmail: "billing@novafinance.ng",
    createdAt: "2026-02-28",
    mrr: 0,
  },
  {
    id: "t-008",
    name: "Access Bank",
    logo: null,
    plan: "enterprise",
    status: "active",
    employeeCount: 1600,
    billingEmail: "tech@accessbank.com",
    createdAt: "2023-05-17",
    mrr: 2499,
  },
  {
    id: "t-009",
    name: "Konga",
    logo: null,
    plan: "growth",
    status: "active",
    employeeCount: 240,
    billingEmail: "operations@konga.com",
    createdAt: "2023-09-11",
    mrr: 999,
  },
  {
    id: "t-010",
    name: "Andela Nigeria",
    logo: null,
    plan: "growth",
    status: "active",
    employeeCount: 175,
    billingEmail: "finance@andela.com",
    createdAt: "2023-11-03",
    mrr: 999,
  },
  {
    id: "t-011",
    name: "Sterling Bank",
    logo: null,
    plan: "starter",
    status: "trial",
    employeeCount: 45,
    billingEmail: "admin@sterlingbank.ng",
    createdAt: "2026-03-01",
    mrr: 0,
  },
  {
    id: "t-012",
    name: "TechAdvance",
    logo: null,
    plan: "starter",
    status: "suspended",
    employeeCount: 58,
    billingEmail: "cto@techadvance.ng",
    createdAt: "2024-03-22",
    mrr: 299,
  },
];

export const DEMO_INVOICES: Invoice[] = [
  { id: "inv-001", tenantId: "t-001", tenantName: "Zenith Bank Nigeria", amount: 2499, status: "paid", dueDate: "2026-03-01", issuedDate: "2026-02-15" },
  { id: "inv-002", tenantId: "t-002", tenantName: "MTN Nigeria", amount: 2499, status: "paid", dueDate: "2026-03-01", issuedDate: "2026-02-15" },
  { id: "inv-003", tenantId: "t-003", tenantName: "Dangote Industries", amount: 2499, status: "paid", dueDate: "2026-03-01", issuedDate: "2026-02-15" },
  { id: "inv-004", tenantId: "t-004", tenantName: "Flutterwave", amount: 999, status: "paid", dueDate: "2026-03-05", issuedDate: "2026-02-20" },
  { id: "inv-005", tenantId: "t-005", tenantName: "Interswitch", amount: 999, status: "overdue", dueDate: "2026-03-01", issuedDate: "2026-02-15" },
  { id: "inv-006", tenantId: "t-006", tenantName: "BrightTech Ltd", amount: 299, status: "paid", dueDate: "2026-03-10", issuedDate: "2026-02-25" },
  { id: "inv-007", tenantId: "t-008", tenantName: "Access Bank", amount: 2499, status: "pending", dueDate: "2026-03-15", issuedDate: "2026-03-01" },
  { id: "inv-008", tenantId: "t-009", tenantName: "Konga", amount: 999, status: "paid", dueDate: "2026-02-28", issuedDate: "2026-02-13" },
  { id: "inv-009", tenantId: "t-010", tenantName: "Andela Nigeria", amount: 999, status: "paid", dueDate: "2026-03-03", issuedDate: "2026-02-16" },
  { id: "inv-010", tenantId: "t-012", tenantName: "TechAdvance", amount: 299, status: "overdue", dueDate: "2026-02-01", issuedDate: "2026-01-17" },
  { id: "inv-011", tenantId: "t-001", tenantName: "Zenith Bank Nigeria", amount: 2499, status: "paid", dueDate: "2026-02-01", issuedDate: "2026-01-15" },
  { id: "inv-012", tenantId: "t-002", tenantName: "MTN Nigeria", amount: 2499, status: "paid", dueDate: "2026-02-01", issuedDate: "2026-01-15" },
  { id: "inv-013", tenantId: "t-004", tenantName: "Flutterwave", amount: 999, status: "paid", dueDate: "2026-02-05", issuedDate: "2026-01-20" },
  { id: "inv-014", tenantId: "t-005", tenantName: "Interswitch", amount: 999, status: "overdue", dueDate: "2026-02-01", issuedDate: "2026-01-15" },
  { id: "inv-015", tenantId: "t-009", tenantName: "Konga", amount: 999, status: "pending", dueDate: "2026-03-28", issuedDate: "2026-03-13" },
];

export const DEMO_TICKETS: SupportTicket[] = [
  { id: "tkt-001", tenantName: "Interswitch", subject: "Payroll calculation error for March run", priority: "critical", status: "open", createdAt: "2026-03-12" },
  { id: "tkt-002", tenantName: "BrightTech Ltd", subject: "Cannot export employee report to Excel", priority: "medium", status: "in_progress", createdAt: "2026-03-11" },
  { id: "tkt-003", tenantName: "Konga", subject: "Leave approval not sending email notification", priority: "high", status: "open", createdAt: "2026-03-10" },
  { id: "tkt-004", tenantName: "Andela Nigeria", subject: "Bulk employee upload failing with 500 error", priority: "high", status: "in_progress", createdAt: "2026-03-09" },
  { id: "tkt-005", tenantName: "TechAdvance", subject: "Login not working after password reset", priority: "critical", status: "open", createdAt: "2026-03-08" },
  { id: "tkt-006", tenantName: "Flutterwave", subject: "Payslip PDF showing incorrect department name", priority: "low", status: "resolved", createdAt: "2026-03-06" },
  { id: "tkt-007", tenantName: "Zenith Bank Nigeria", subject: "Request to increase max employee seat limit", priority: "medium", status: "open", createdAt: "2026-03-05" },
  { id: "tkt-008", tenantName: "Nova Finance", subject: "Onboarding: unable to configure org structure", priority: "medium", status: "open", createdAt: "2026-03-04" },
];

export const DEMO_PLATFORM_STATS: PlatformStats & {
  trialTenants: number;
  suspendedTenants: number;
  avgEmployeesPerTenant: number;
} = {
  totalTenants: 48,
  activeTenants: 44,
  trialTenants: 3,
  suspendedTenants: 1,
  mrr: 38420,
  arr: 461040,
  churnRate: 2.3,
  ticketsOpen: 7,
  avgEmployeesPerTenant: 186,
};

export const CMS_STAT_CARDS: {
  label: string;
  link: string;
  icon: LucideIcon;
  value: string | number;
  sub: string;
  trend: string;
  up: boolean;
}[] = [
  { label: "Total Tenants",      link: "/tenants",          icon: Building2,    value: "48",     sub: "Registered companies",        trend: "+3",   up: true  },
  { label: "Active Tenants",     link: "/tenants",          icon: CheckCircle2, value: "44",     sub: "Currently active",            trend: "+2",   up: true  },
  { label: "On Trial",           link: "/tenants",          icon: RefreshCw,    value: "3",      sub: "Trial accounts",              trend: "+1",   up: true  },
  { label: "Total Users",        link: "/support",          icon: Users,        value: "8 942",  sub: "Across all tenants",          trend: "+142", up: true  },
  { label: "Active Subs",        link: "/billing/plans",    icon: CreditCard,   value: "41",     sub: "Paying subscriptions",        trend: "+2",   up: true  },
  { label: "MRR",                link: "/billing/revenue",  icon: TrendingUp,   value: "₦38 420",sub: "Monthly recurring revenue",   trend: "+6.2%",up: true  },
  { label: "New Tenants (Month)",link: "/tenants",          icon: UserPlus,     value: "3",      sub: "Registered this month",       trend: "+1",   up: true  },
  { label: "Open Tickets",       link: "/support/tickets",  icon: AlertTriangle,value: "7",      sub: "Awaiting response",           trend: "+2",   up: false },
];

export const REVENUE_TREND_DATA: { month: string; revenue: number }[] = [
  { month: "May",  revenue: 30100 },
  { month: "Jun",  revenue: 31500 },
  { month: "Jul",  revenue: 32200 },
  { month: "Aug",  revenue: 33400 },
  { month: "Sep",  revenue: 34100 },
  { month: "Oct",  revenue: 34900 },
  { month: "Nov",  revenue: 35600 },
  { month: "Dec",  revenue: 36200 },
  { month: "Jan",  revenue: 36800 },
  { month: "Feb",  revenue: 37300 },
  { month: "Mar",  revenue: 37900 },
  { month: "Apr",  revenue: 38420 },
];

export const REVENUE_TREND_CONFIG: ChartConfig = {
  revenue: { label: "MRR", color: "#ff8b2d" },
};

export const TENANT_REGISTRATIONS_DATA: { month: string; registrations: number }[] = [
  { month: "May",  registrations: 2 },
  { month: "Jun",  registrations: 3 },
  { month: "Jul",  registrations: 4 },
  { month: "Aug",  registrations: 3 },
  { month: "Sep",  registrations: 5 },
  { month: "Oct",  registrations: 4 },
  { month: "Nov",  registrations: 6 },
  { month: "Dec",  registrations: 3 },
  { month: "Jan",  registrations: 5 },
  { month: "Feb",  registrations: 4 },
  { month: "Mar",  registrations: 6 },
  { month: "Apr",  registrations: 3 },
];

export const TENANT_REGISTRATIONS_CONFIG: ChartConfig = {
  registrations: { label: "New Tenants", color: "#4ED251" },
};

export interface SystemHealthItem {
  label: string;
  status: "operational" | "degraded" | "down";
  uptime: string;
}

export const SYSTEM_HEALTH: SystemHealthItem[] = [
  { label: "API Server",       status: "operational", uptime: "99.98%" },
  { label: "Database",         status: "operational", uptime: "99.99%" },
  { label: "Job Queue",        status: "operational", uptime: "99.95%" },
  { label: "File Storage",     status: "operational", uptime: "100%"   },
  { label: "Email Delivery",   status: "degraded",    uptime: "98.20%" },
  { label: "SMS Service",      status: "operational", uptime: "99.80%" },
];

export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  message: string;
  tenant?: string;
  time: string;
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: "a-01", icon: UserPlus,     iconColor: "text-[#4ED251]",  message: "Nova Finance registered a new account",                  tenant: "Nova Finance",       time: "2 min ago"  },
  { id: "a-02", icon: ArrowUpRight, iconColor: "text-[#ff8b2d]",  message: "Flutterwave upgraded from Growth to Enterprise",         tenant: "Flutterwave",        time: "14 min ago" },
  { id: "a-03", icon: AlertTriangle,iconColor: "text-red-500",     message: "Payment failed for Interswitch — invoice INV-005",       tenant: "Interswitch",        time: "31 min ago" },
  { id: "a-04", icon: ShieldAlert,  iconColor: "text-amber-500",   message: "Assisted Access session started on BrightTech Ltd",      tenant: "BrightTech Ltd",     time: "1 hr ago"   },
  { id: "a-05", icon: CheckCircle2, iconColor: "text-[#4ED251]",   message: "Sterling Bank trial extended by 7 days",                 tenant: "Sterling Bank",      time: "1 hr ago"   },
  { id: "a-06", icon: XCircle,      iconColor: "text-red-500",     message: "TechAdvance subscription cancelled",                     tenant: "TechAdvance",        time: "2 hrs ago"  },
  { id: "a-07", icon: Webhook,      iconColor: "text-violet-500",  message: "Failed webhook delivery — Konga endpoint /hr-events",    tenant: "Konga",              time: "3 hrs ago"  },
  { id: "a-08", icon: Mail,         iconColor: "text-sky-500",     message: "Trial expiry warning sent to Nova Finance (7-day notice)",tenant: "Nova Finance",       time: "4 hrs ago"  },
  { id: "a-09", icon: UserPlus,     iconColor: "text-[#4ED251]",   message: "Andela Nigeria added 12 new employee records",           tenant: "Andela Nigeria",     time: "5 hrs ago"  },
  { id: "a-10", icon: CreditCard,   iconColor: "text-[#ff8b2d]",   message: "Invoice INV-007 marked as paid — Access Bank",           tenant: "Access Bank",        time: "6 hrs ago"  },
];

export interface PendingTaskItem {
  id: string;
  label: string;
  sub: string;
  count: number;
  link: string;
  urgent: boolean;
}

export const PENDING_TASKS: PendingTaskItem[] = [
  { id: "pt-01", label: "Company Verification Requests", sub: "Awaiting KYC review",            count: 2,  link: "/tenants",              urgent: true  },
  { id: "pt-02", label: "Support Tickets",               sub: "Open & unassigned",               count: 7,  link: "/support/tickets",      urgent: true  },
  { id: "pt-03", label: "Failed Webhook Deliveries",     sub: "Needs manual retry",              count: 3,  link: "/platform/health",      urgent: false },
  { id: "pt-04", label: "Overdue Invoices",              sub: "Past payment due date",            count: 3,  link: "/billing/invoices",     urgent: true  },
  { id: "pt-05", label: "Trial Accounts Expiring",       sub: "Within next 7 days",              count: 1,  link: "/tenants",              urgent: false },
  { id: "pt-06", label: "Content Blocks Pending Review", sub: "Awaiting second-operator approval",count: 4, link: "/platform/notices",     urgent: false },
];

export interface DemoConversionStat {
  label: string;
  value: string | number;
  sub: string;
}

export const DEMO_CONVERSION_STATS: DemoConversionStat[] = [
  { label: "Active Demo Accounts",   value: 3,     sub: "Currently in trial"         },
  { label: "Conversion Rate",        value: "68%", sub: "Demo → paid (last 30 days)" },
  { label: "Avg Days to Convert",    value: "14d", sub: "Registration to first payment"},
  { label: "Converted This Month",   value: 2,     sub: "Paid conversions in April"  },
];

export interface TenantHealthItem {
  label: string;
  count: number;
  link: string;
  color: string;
  bg: string;
}

export const TENANT_HEALTH: TenantHealthItem[] = [
  { label: "Overdue Payments",           count: 3, link: "/billing/invoices", color: "text-red-600 dark:text-red-400",    bg: "bg-red-500/10"    },
  { label: "Subscriptions Expiring Soon",count: 1, link: "/tenants",          color: "text-amber-600 dark:text-amber-400",bg: "bg-amber-500/10"  },
  { label: "Flagged Activity",           count: 1, link: "/support/activity-logs", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
  { label: "Suspended Tenants",          count: 1, link: "/tenants",          color: "text-slate-600 dark:text-slate-400",bg: "bg-slate-500/10"  },
];

export interface DiscountCode {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  restrictedPlan: TenantPlan | null;
  status: "active" | "expired";
}

export const DEMO_DISCOUNTS: DiscountCode[] = [
  { id: "d-001", code: "LAUNCH50",     type: "percentage", value: 50, maxUses: 20,  usedCount: 14, expiryDate: "2026-06-30", restrictedPlan: null,         status: "active"  },
  { id: "d-002", code: "ENTERPRISE20", type: "percentage", value: 20, maxUses: 10,  usedCount: 4,  expiryDate: "2026-12-31", restrictedPlan: "enterprise",  status: "active"  },
  { id: "d-003", code: "GROWTH100",    type: "fixed",      value: 100, maxUses: 30, usedCount: 30, expiryDate: "2026-01-31", restrictedPlan: "growth",      status: "expired" },
  { id: "d-004", code: "NEWBIZ25",     type: "percentage", value: 25, maxUses: 50,  usedCount: 12, expiryDate: "2026-09-30", restrictedPlan: null,          status: "active"  },
  { id: "d-005", code: "STARTER50",    type: "fixed",      value: 50, maxUses: 100, usedCount: 23, expiryDate: "2026-08-31", restrictedPlan: "starter",     status: "active"  },
];

export interface TaxRate {
  id: string;
  country: string;
  rate: number;
  description: string;
  active: boolean;
}

export const DEMO_TAX_RATES: TaxRate[] = [
  { id: "tax-001", country: "Nigeria",        rate: 7.5,  description: "Value Added Tax (VAT)",    active: true  },
  { id: "tax-002", country: "United Kingdom", rate: 20,   description: "Value Added Tax (VAT)",    active: true  },
  { id: "tax-003", country: "United States",  rate: 0,    description: "No federal sales tax",     active: true  },
  { id: "tax-004", country: "South Africa",   rate: 15,   description: "Value Added Tax (VAT)",    active: true  },
  { id: "tax-005", country: "Kenya",          rate: 16,   description: "Value Added Tax (VAT)",    active: true  },
  { id: "tax-006", country: "Ghana",          rate: 12.5, description: "Value Added Tax (VAT)",    active: true  },
  { id: "tax-007", country: "Germany",        rate: 19,   description: "Mehrwertsteuer (MwSt)",    active: false },
];

export interface ChurnRecord {
  tenantName: string;
  plan: TenantPlan;
  mrr: number;
  cancelledDate: string;
  reason: string;
}

export const DEMO_CHURN_RECORDS: ChurnRecord[] = [
  { tenantName: "TechAdvance",    plan: "starter",    mrr: 299,  cancelledDate: "2026-03-22", reason: "Budget cuts" },
  { tenantName: "PixelCraft Ltd", plan: "growth",     mrr: 999,  cancelledDate: "2026-03-10", reason: "Switched to competitor" },
  { tenantName: "Apex Retail",    plan: "starter",    mrr: 299,  cancelledDate: "2026-02-28", reason: "No longer needed" },
  { tenantName: "SwiftPay Inc",   plan: "enterprise", mrr: 2499, cancelledDate: "2026-02-14", reason: "Contract ended" },
];

export const CHURN_MONTHLY_DATA: { month: string; churnRate: number; churned: number }[] = [
  { month: "May",  churnRate: 1.8, churned: 1 },
  { month: "Jun",  churnRate: 2.1, churned: 1 },
  { month: "Jul",  churnRate: 1.5, churned: 1 },
  { month: "Aug",  churnRate: 2.3, churned: 1 },
  { month: "Sep",  churnRate: 1.9, churned: 1 },
  { month: "Oct",  churnRate: 2.0, churned: 1 },
  { month: "Nov",  churnRate: 1.7, churned: 1 },
  { month: "Dec",  churnRate: 2.5, churned: 2 },
  { month: "Jan",  churnRate: 1.6, churned: 1 },
  { month: "Feb",  churnRate: 2.8, churned: 2 },
  { month: "Mar",  churnRate: 2.3, churned: 2 },
  { month: "Apr",  churnRate: 1.4, churned: 1 },
];

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  category: string;
  scope: "platform" | "plan" | "tenant";
  enabled: boolean;
  betaOnly: boolean;
  rolloutPercent: number | null;
  changedAt: string;
  changedBy: string;
}

export const DEMO_FEATURE_FLAGS: FeatureFlag[] = [
  { id: "ff-001", name: "AI Performance Insights",       description: "AI-powered insights in performance review cycles",                     category: "Performance", scope: "platform", enabled: false, betaOnly: true,  rolloutPercent: 20,   changedAt: "2026-04-15", changedBy: "A. Taiwo"   },
  { id: "ff-002", name: "Multi-Currency Payroll",        description: "Process payroll in multiple currencies per entity",                     category: "Payroll",     scope: "plan",     enabled: true,  betaOnly: false, rolloutPercent: null, changedAt: "2026-04-10", changedBy: "B. Okonkwo" },
  { id: "ff-003", name: "Employee Self-Service v2",      description: "Redesigned employee portal with new navigation and mobile layout",      category: "UI",          scope: "platform", enabled: true,  betaOnly: false, rolloutPercent: null, changedAt: "2026-03-28", changedBy: "A. Taiwo"   },
  { id: "ff-004", name: "Attendance Geofencing",         description: "GPS-based clock-in/out enforcement within defined office zones",        category: "Attendance",  scope: "tenant",   enabled: false, betaOnly: true,  rolloutPercent: null, changedAt: "2026-04-18", changedBy: "C. Mensah"  },
  { id: "ff-005", name: "HRIS API v2",                   description: "Second generation HRIS REST API with expanded endpoints",               category: "API",         scope: "platform", enabled: true,  betaOnly: false, rolloutPercent: 100,  changedAt: "2026-04-01", changedBy: "B. Okonkwo" },
  { id: "ff-006", name: "Custom Report Builder",         description: "Drag-and-drop report builder for HR admins",                            category: "Reports",     scope: "plan",     enabled: false, betaOnly: false, rolloutPercent: null, changedAt: "2026-04-12", changedBy: "A. Taiwo"   },
  { id: "ff-007", name: "Onboarding Checklist Templates",description: "Pre-built onboarding checklist templates for new tenants",              category: "Onboarding",  scope: "platform", enabled: true,  betaOnly: false, rolloutPercent: null, changedAt: "2026-03-20", changedBy: "C. Mensah"  },
  { id: "ff-008", name: "Smart Leave Suggestions",       description: "AI suggests leave approvals based on team capacity",                    category: "Leave",       scope: "platform", enabled: false, betaOnly: true,  rolloutPercent: 10,   changedAt: "2026-04-20", changedBy: "B. Okonkwo" },
];

export interface PlatformModule {
  id: string;
  name: string;
  description: string;
  category: string;
  plans: ("starter" | "growth" | "enterprise")[];
  activeTenantsCount: number;
}

export const DEMO_MODULES: PlatformModule[] = [
  { id: "mod-001", name: "Core HR",                  description: "Employee profiles, org chart, documents",                    category: "Core",        plans: ["starter","growth","enterprise"], activeTenantsCount: 44 },
  { id: "mod-002", name: "Leave Management",          description: "Leave requests, approvals, balances, and calendar",          category: "Core",        plans: ["starter","growth","enterprise"], activeTenantsCount: 44 },
  { id: "mod-003", name: "Payroll Processing",        description: "Salary computation, tax deductions, and payslip generation", category: "Finance",     plans: ["starter","growth","enterprise"], activeTenantsCount: 40 },
  { id: "mod-004", name: "Performance Management",    description: "Review cycles, goals, KPIs, and 360 feedback",               category: "Growth",      plans: ["growth","enterprise"],          activeTenantsCount: 28 },
  { id: "mod-005", name: "Recruitment",               description: "Job postings, applicant tracking, interview scheduling",      category: "Talent",      plans: ["growth","enterprise"],          activeTenantsCount: 25 },
  { id: "mod-006", name: "Learning & Development",    description: "Course library, assignments, and completion tracking",        category: "Growth",      plans: ["growth","enterprise"],          activeTenantsCount: 20 },
  { id: "mod-007", name: "Onboarding & Offboarding",  description: "Task-based onboarding and offboarding workflows",            category: "Core",        plans: ["starter","growth","enterprise"], activeTenantsCount: 38 },
  { id: "mod-008", name: "Asset Management",          description: "Company asset assignment and return tracking",                category: "Operations",  plans: ["growth","enterprise"],          activeTenantsCount: 18 },
  { id: "mod-009", name: "Attendance & Timesheets",   description: "Clock-in/out, shift scheduling, and timesheet review",       category: "Core",        plans: ["starter","growth","enterprise"], activeTenantsCount: 35 },
  { id: "mod-010", name: "Analytics & Reporting",     description: "HR dashboards, headcount analytics, and custom reports",     category: "Reports",     plans: ["growth","enterprise"],          activeTenantsCount: 27 },
  { id: "mod-011", name: "Community & Kudos",         description: "Team feed, kudos badges, and peer recognition",              category: "Engagement",  plans: ["enterprise"],                   activeTenantsCount: 10 },
  { id: "mod-012", name: "Helpdesk & Grievance",      description: "Internal ticket system for employee concerns",               category: "Support",     plans: ["growth","enterprise"],          activeTenantsCount: 15 },
];

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  target: "all" | "plan" | "specific" | "country";
  targetLabel: string;
  channels: ("in-app" | "email")[];
  priority: "standard" | "urgent";
  status: "draft" | "published" | "scheduled" | "expired";
  publishedAt: string;
  expiryDate: string | null;
  recipientCount: number;
  acknowledgementCount: number;
}

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  { id: "ann-001", title: "Scheduled Maintenance — April 30, 2026",   body: "We will perform platform maintenance on April 30 from 2:00 AM to 4:00 AM WAT. The platform will be unavailable during this window.",   category: "System",     target: "all",     targetLabel: "All tenants",       channels: ["in-app","email"], priority: "urgent",   status: "scheduled", publishedAt: "2026-04-30T02:00:00", expiryDate: "2026-05-01", recipientCount: 8942, acknowledgementCount: 0    },
  { id: "ann-002", title: "New Feature: AI Performance Insights",      body: "AI-powered insights are now available in your performance review cycles. Access it from the Performance module in your dashboard.",         category: "Feature",    target: "plan",    targetLabel: "Enterprise plan",   channels: ["in-app"],         priority: "standard", status: "published", publishedAt: "2026-04-20T09:00:00", expiryDate: null,         recipientCount: 3240, acknowledgementCount: 1820 },
  { id: "ann-003", title: "Platform Update — April 2026",              body: "This month's release includes improvements to payroll processing, leave calendar sync, and several bug fixes. Read the full changelog.",    category: "Release",    target: "all",     targetLabel: "All tenants",       channels: ["in-app","email"], priority: "standard", status: "published", publishedAt: "2026-04-01T08:00:00", expiryDate: "2026-05-01", recipientCount: 8942, acknowledgementCount: 6100 },
  { id: "ann-004", title: "GDPR Compliance Update",                    body: "We have updated our data processing agreements in compliance with new GDPR guidelines effective April 1. Please review the updated terms.", category: "Compliance", target: "country", targetLabel: "EU countries",       channels: ["email","in-app"], priority: "urgent",   status: "published", publishedAt: "2026-03-15T10:00:00", expiryDate: null,         recipientCount: 1200, acknowledgementCount: 980  },
  { id: "ann-005", title: "Upcoming: Multi-Currency Payroll",          body: "Multi-currency payroll support is coming in May 2026. Growth and Enterprise customers will get early access. Stay tuned for details.",      category: "Feature",    target: "plan",    targetLabel: "Growth + Enterprise",channels: ["in-app"],         priority: "standard", status: "draft",     publishedAt: "",                    expiryDate: null,         recipientCount: 0,    acknowledgementCount: 0    },
];

export interface SystemIncident {
  id: string;
  title: string;
  severity: "critical" | "major" | "minor";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  component: string;
  startedAt: string;
  resolvedAt: string | null;
  description: string;
}

export const DEMO_INCIDENTS: SystemIncident[] = [
  { id: "inc-001", title: "Email Delivery Degradation",  severity: "major",  status: "monitoring",  component: "Email Delivery", startedAt: "2026-04-23T07:15:00", resolvedAt: null,                    description: "Some outbound emails experiencing delivery delays of up to 15 minutes due to SMTP provider issues. Team is actively monitoring." },
  { id: "inc-002", title: "API Response Time Spike",     severity: "minor",  status: "resolved",    component: "API Server",     startedAt: "2026-04-21T14:30:00", resolvedAt: "2026-04-21T15:10:00",  description: "Elevated p99 response times on /api/payroll endpoints due to a slow query. Fixed with index optimisation." },
  { id: "inc-003", title: "Job Queue Backlog",           severity: "major",  status: "resolved",    component: "Job Queue",      startedAt: "2026-04-18T09:00:00", resolvedAt: "2026-04-18T11:30:00",  description: "Payroll processing queue backed up due to a worker crash. Workers restarted and backlog cleared." },
];

export interface JobQueue {
  name: string;
  depth: number;
  processing: number;
  failed: number;
  status: "healthy" | "warning" | "failing";
}

export const DEMO_JOB_QUEUES: JobQueue[] = [
  { name: "Payroll Processing",  depth: 3,  processing: 1, failed: 0, status: "healthy" },
  { name: "Email Delivery",      depth: 48, processing: 5, failed: 2, status: "warning" },
  { name: "Report Generation",   depth: 2,  processing: 1, failed: 0, status: "healthy" },
  { name: "Webhook Dispatch",    depth: 12, processing: 3, failed: 3, status: "warning" },
  { name: "Data Export Jobs",    depth: 1,  processing: 0, failed: 0, status: "healthy" },
  { name: "Notification Sender", depth: 6,  processing: 2, failed: 0, status: "healthy" },
];

export const API_RESPONSE_TIME_DATA: { month: string; avg: number; p95: number; p99: number }[] = [
  { month: "May",  avg: 112, p95: 290, p99: 450 },
  { month: "Jun",  avg: 108, p95: 280, p99: 430 },
  { month: "Jul",  avg: 115, p95: 300, p99: 460 },
  { month: "Aug",  avg: 105, p95: 270, p99: 410 },
  { month: "Sep",  avg: 118, p95: 310, p99: 480 },
  { month: "Oct",  avg: 102, p95: 265, p99: 400 },
  { month: "Nov",  avg: 109, p95: 285, p99: 440 },
  { month: "Dec",  avg: 120, p95: 315, p99: 490 },
  { month: "Jan",  avg: 107, p95: 278, p99: 425 },
  { month: "Feb",  avg: 113, p95: 295, p99: 455 },
  { month: "Mar",  avg: 110, p95: 288, p99: 442 },
  { month: "Apr",  avg: 116, p95: 302, p99: 465 },
];

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  source: "cms_operator" | "tenant_admin" | "system" | "assisted_access";
  tenantName: string | null;
  actionType: string;
  entityType: string;
  description: string;
  ip: string;
  severity: "info" | "warning" | "critical";
  before?: string;
  after?: string;
}

export const DEMO_ACTIVITY_LOGS: ActivityLog[] = [
  { id: "log-001", timestamp: "2026-04-23T11:42:00", actor: "A. Taiwo",          source: "cms_operator",   tenantName: null,                  actionType: "Feature Flag Toggle",     entityType: "Feature Flag",   description: "Toggled 'Smart Leave Suggestions' from disabled to enabled (beta rollout 10%)",  ip: "102.88.1.14",   severity: "info",     before: "disabled", after: "enabled (10% rollout)" },
  { id: "log-002", timestamp: "2026-04-23T11:10:00", actor: "B. Okonkwo",        source: "cms_operator",   tenantName: "Konga",                actionType: "Tenant Suspended",        entityType: "Tenant",         description: "Suspended tenant Konga due to overdue invoice exceeding 30 days",                ip: "102.88.1.15",   severity: "warning",  before: "active",    after: "suspended"             },
  { id: "log-003", timestamp: "2026-04-23T10:55:00", actor: "System",            source: "system",         tenantName: "Interswitch",          actionType: "Invoice Overdue",         entityType: "Invoice",        description: "Invoice inv-005 for Interswitch marked overdue (due 2026-03-01)",                ip: "internal",      severity: "warning"                                                   },
  { id: "log-004", timestamp: "2026-04-23T10:30:00", actor: "C. Mensah",         source: "assisted_access",tenantName: "BrightTech Ltd",       actionType: "Assisted Access Started", entityType: "Session",        description: "Operator C. Mensah initiated assisted access session for support ticket tkt-002", ip: "196.6.44.22",   severity: "info"                                                       },
  { id: "log-005", timestamp: "2026-04-23T10:08:00", actor: "C. Mensah",         source: "assisted_access",tenantName: "BrightTech Ltd",       actionType: "Assisted Access Ended",   entityType: "Session",        description: "Assisted access session ended after 22 minutes",                                  ip: "196.6.44.22",   severity: "info"                                                       },
  { id: "log-006", timestamp: "2026-04-23T09:45:00", actor: "hr@brighttech.ng",  source: "tenant_admin",   tenantName: "BrightTech Ltd",       actionType: "Employee Created",        entityType: "Employee",       description: "New employee record created: Tunde Adeyemi (EMP-0065)",                           ip: "197.211.62.10", severity: "info"                                                       },
  { id: "log-007", timestamp: "2026-04-23T09:20:00", actor: "A. Taiwo",          source: "cms_operator",   tenantName: null,                  actionType: "Announcement Published",  entityType: "Announcement",   description: "Published platform announcement 'Platform Update — April 2026' to all tenants",  ip: "102.88.1.14",   severity: "info"                                                       },
  { id: "log-008", timestamp: "2026-04-23T08:55:00", actor: "System",            source: "system",         tenantName: null,                  actionType: "Payroll Job Triggered",   entityType: "Job Queue",      description: "Scheduled payroll processing job triggered for 3 tenants",                        ip: "internal",      severity: "info"                                                       },
  { id: "log-009", timestamp: "2026-04-22T17:30:00", actor: "B. Okonkwo",        source: "cms_operator",   tenantName: "Nova Finance",         actionType: "Trial Extended",          entityType: "Subscription",   description: "Trial extended by 14 days. Reason: Enterprise deal pending signature",            ip: "102.88.1.15",   severity: "info",     before: "2026-04-22", after: "2026-05-06"           },
  { id: "log-010", timestamp: "2026-04-22T16:15:00", actor: "admin@andela.com",  source: "tenant_admin",   tenantName: "Andela Nigeria",       actionType: "Bulk Employee Upload",    entityType: "Employee",       description: "Bulk import of 24 employee records via CSV upload",                               ip: "154.113.5.22",  severity: "info"                                                       },
  { id: "log-011", timestamp: "2026-04-22T15:40:00", actor: "A. Taiwo",          source: "cms_operator",   tenantName: "TechAdvance",          actionType: "Tenant Reactivated",      entityType: "Tenant",         description: "Tenant TechAdvance reactivated from suspended status",                            ip: "102.88.1.14",   severity: "info",     before: "suspended", after: "active"               },
  { id: "log-012", timestamp: "2026-04-22T14:00:00", actor: "System",            source: "system",         tenantName: "Flutterwave",          actionType: "Payment Failed",          entityType: "Invoice",        description: "Automatic payment retry for inv-013 failed (card declined)",                       ip: "internal",      severity: "critical"                                                  },
  { id: "log-013", timestamp: "2026-04-22T13:30:00", actor: "C. Mensah",         source: "cms_operator",   tenantName: null,                  actionType: "Module Disabled",         entityType: "Module",         description: "Disabled 'Community & Kudos' module for starter plan tenants",                    ip: "196.6.44.22",   severity: "warning",  before: "enabled",   after: "disabled"             },
  { id: "log-014", timestamp: "2026-04-22T11:00:00", actor: "hr@zenithbank.com", source: "tenant_admin",   tenantName: "Zenith Bank Nigeria",  actionType: "Data Export",             entityType: "Report",         description: "Full employee data export triggered by HR admin",                                  ip: "105.112.4.18",  severity: "warning"                                                   },
  { id: "log-015", timestamp: "2026-04-22T09:15:00", actor: "B. Okonkwo",        source: "cms_operator",   tenantName: null,                  actionType: "Discount Code Created",   entityType: "Discount",       description: "Discount code ENTERPRISE20 created (20% off, Enterprise plan, 10 uses)",          ip: "102.88.1.15",   severity: "info"                                                       },
  { id: "log-016", timestamp: "2026-04-21T16:45:00", actor: "A. Taiwo",          source: "cms_operator",   tenantName: "Interswitch",          actionType: "Invoice Refund",          entityType: "Invoice",        description: "Partial refund of ₦250 processed on invoice inv-005. Reason: Service credit",     ip: "102.88.1.14",   severity: "critical", before: "paid",      after: "partially refunded"   },
  { id: "log-017", timestamp: "2026-04-21T15:10:00", actor: "System",            source: "system",         tenantName: null,                  actionType: "Incident Resolved",       entityType: "Incident",       description: "System incident 'API Response Time Spike' marked resolved",                        ip: "internal",      severity: "info"                                                       },
  { id: "log-018", timestamp: "2026-04-21T10:20:00", actor: "C. Mensah",         source: "cms_operator",   tenantName: "Sterling Bank",        actionType: "Plan Assigned",           entityType: "Subscription",   description: "Plan changed from starter to growth for Sterling Bank",                            ip: "196.6.44.22",   severity: "info",     before: "starter",   after: "growth"               },
  { id: "log-019", timestamp: "2026-04-20T14:30:00", actor: "System",            source: "system",         tenantName: null,                  actionType: "New Tenant Registered",   entityType: "Tenant",         description: "New tenant registered: Paystack (starter plan, trial period started)",             ip: "internal",      severity: "info"                                                       },
  { id: "log-020", timestamp: "2026-04-20T09:00:00", actor: "A. Taiwo",          source: "cms_operator",   tenantName: null,                  actionType: "2FA Enforced",            entityType: "Operator",       description: "Mandatory 2FA enforcement enabled for all CMS operators",                          ip: "102.88.1.14",   severity: "warning"                                                   },
];

export interface CannedResponse {
  id: string;
  title: string;
  category: string;
  body: string;
}

export const DEMO_CANNED_RESPONSES: CannedResponse[] = [
  { id: "cr-001", category: "General",   title: "Acknowledge receipt",         body: "Thank you for reaching out to Motee Support. We have received your ticket and our team is reviewing it. We will respond within 1 business day." },
  { id: "cr-002", category: "Technical", title: "Request more information",    body: "To help us investigate this issue, could you please provide:\n- The exact steps to reproduce the problem\n- Any error messages you are seeing\n- The date and time it first occurred\n- The affected employee or record IDs if applicable" },
  { id: "cr-003", category: "Technical", title: "Escalated to engineering",    body: "We have escalated this issue to our engineering team for further investigation. We will keep you updated as we make progress and aim to have a resolution as soon as possible." },
  { id: "cr-004", category: "Billing",   title: "Invoice clarification",       body: "We have reviewed your billing enquiry. Your invoice reflects the charges for the current billing period based on your active subscription plan. If you believe there is a discrepancy, please share the invoice number and we will investigate promptly." },
  { id: "cr-005", category: "General",   title: "Issue resolved confirmation", body: "We are glad to let you know that the issue you reported has been resolved. Please log in and verify that everything is working as expected. Feel free to reopen this ticket if the problem persists." },
  { id: "cr-006", category: "Technical", title: "Workaround provided",         body: "While our team works on a permanent fix, here is a workaround you can use in the meantime:\n\n[Describe workaround here]\n\nWe will notify you once the underlying issue is permanently resolved." },
  { id: "cr-007", category: "Access",    title: "Password reset triggered",    body: "We have triggered a password reset for the affected user. They should receive an email within the next few minutes with a link to set a new password. The link is valid for 24 hours." },
  { id: "cr-008", category: "General",   title: "Closing — no response",       body: "We have not received a response to our last message. We are closing this ticket for now. Please feel free to open a new ticket if you need further assistance and we will be happy to help." },
];

export interface AssistedAccessSession {
  id: string;
  operator: string;
  tenantName: string;
  tenantId: string;
  reason: string;
  startedAt: string;
  endedAt: string | null;
  duration: string | null;
  status: "active" | "ended" | "expired";
}

export const DEMO_ASSISTED_ACCESS_SESSIONS: AssistedAccessSession[] = [
  { id: "aas-001", operator: "C. Mensah",  tenantName: "BrightTech Ltd",      tenantId: "t-006", reason: "Investigate employee report export failure (tkt-002)",                   startedAt: "2026-04-23T10:30:00", endedAt: "2026-04-23T10:52:00", duration: "22 min", status: "ended"   },
  { id: "aas-002", operator: "A. Taiwo",   tenantName: "Interswitch",          tenantId: "t-005", reason: "Verify payroll configuration for March overdue calculation (tkt-001)",  startedAt: "2026-04-22T14:10:00", endedAt: "2026-04-22T14:40:00", duration: "30 min", status: "ended"   },
  { id: "aas-003", operator: "B. Okonkwo", tenantName: "TechAdvance",          tenantId: "t-012", reason: "Confirm login failure after password reset for tkt-005",                 startedAt: "2026-04-21T11:00:00", endedAt: "2026-04-21T11:18:00", duration: "18 min", status: "ended"   },
  { id: "aas-004", operator: "C. Mensah",  tenantName: "Nova Finance",         tenantId: "t-007", reason: "Assist with org structure configuration during onboarding (tkt-008)",    startedAt: "2026-04-20T15:30:00", endedAt: "2026-04-20T16:05:00", duration: "35 min", status: "ended"   },
  { id: "aas-005", operator: "A. Taiwo",   tenantName: "Andela Nigeria",       tenantId: "t-010", reason: "Diagnose bulk employee upload 500 error (tkt-004)",                      startedAt: "2026-04-19T10:00:00", endedAt: "2026-04-19T10:45:00", duration: "45 min", status: "ended"   },
  { id: "aas-006", operator: "B. Okonkwo", tenantName: "Konga",                tenantId: "t-009", reason: "Verify leave approval email notification config (tkt-003)",               startedAt: "2026-04-18T09:15:00", endedAt: "2026-04-18T09:35:00", duration: "20 min", status: "ended"   },
  { id: "aas-007", operator: "A. Taiwo",   tenantName: "Zenith Bank Nigeria",  tenantId: "t-001", reason: "Review seat limit request and current employee record count (tkt-007)",  startedAt: "2026-04-17T14:00:00", endedAt: null,                  duration: null,     status: "expired" },
  { id: "aas-008", operator: "C. Mensah",  tenantName: "Flutterwave",          tenantId: "t-004", reason: "Confirm department name mismatch on payslip PDF (tkt-006)",               startedAt: "2026-04-16T11:30:00", endedAt: "2026-04-16T11:48:00", duration: "18 min", status: "ended"   },
];

export interface PlatformConfig {
  general: {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    defaultCurrency: string;
    defaultTimezone: string;
    defaultLanguage: string;
    maxFileSizeMB: number;
    allowedFileTypes: string;
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxPasswordAgeDays: number;
    preventReuseCount: number;
  };
  session: {
    timeoutMinutes: number;
    maxConcurrentSessions: number;
    rememberMeDays: number;
  };
  registration: {
    allowSelfRegistration: boolean;
    requireEmailDomainVerification: boolean;
    publicPricingPageEnabled: boolean;
  };
  login: {
    googleEnabled: boolean;
    microsoftEnabled: boolean;
    linkedInEnabled: boolean;
    magicLinkEnabled: boolean;
  };
  email: {
    provider: "sendgrid" | "mailgun" | "ses" | "smtp";
    senderDomain: string;
    senderName: string;
    replyTo: string;
    bounceHandlingEnabled: boolean;
  };
  sms: {
    provider: "twilio" | "sns" | "termii";
    senderId: string;
    enabled: boolean;
  };
  storage: {
    provider: "s3" | "azure" | "local";
    bucketName: string;
    region: string;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    estimatedDowntime: string;
  };
}

export const DEMO_PLATFORM_CONFIG: PlatformConfig = {
  general: {
    platformName: "Motee HR Solutions",
    supportEmail: "support@motee.io",
    supportPhone: "+234 800 000 0001",
    defaultCurrency: "NGN",
    defaultTimezone: "Africa/Lagos",
    defaultLanguage: "en",
    maxFileSizeMB: 25,
    allowedFileTypes: ".pdf, .doc, .docx, .xls, .xlsx, .csv, .png, .jpg, .jpeg",
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
    maxPasswordAgeDays: 90,
    preventReuseCount: 5,
  },
  session: {
    timeoutMinutes: 30,
    maxConcurrentSessions: 3,
    rememberMeDays: 30,
  },
  registration: {
    allowSelfRegistration: true,
    requireEmailDomainVerification: false,
    publicPricingPageEnabled: true,
  },
  login: {
    googleEnabled: true,
    microsoftEnabled: true,
    linkedInEnabled: false,
    magicLinkEnabled: false,
  },
  email: {
    provider: "sendgrid",
    senderDomain: "mail.motee.io",
    senderName: "Motee HR",
    replyTo: "no-reply@motee.io",
    bounceHandlingEnabled: true,
  },
  sms: {
    provider: "twilio",
    senderId: "MoteeHR",
    enabled: true,
  },
  storage: {
    provider: "s3",
    bucketName: "motee-prod-storage",
    region: "af-south-1",
  },
  maintenance: {
    enabled: false,
    message: "Motee HR Solutions is currently undergoing scheduled maintenance. We will be back shortly.",
    estimatedDowntime: "2 hours",
  },
};

