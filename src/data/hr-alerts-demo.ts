import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  Banknote,
  Briefcase,
  Scale,
  TrendingUp,
  CalendarClock,
  GraduationCap,
  Laptop,
  UserCog,
  AlertTriangle,
} from "lucide-react";

export type HrAlertSeverity = "critical" | "warning" | "info";

export interface HrAlert {
  id: string;
  title: string;
  /** Short context line (who/where/when). */
  description?: string;
  severity: HrAlertSeverity;
  /** Deep link to the page where the alert is actioned. */
  href?: string;
}

export interface HrAlertCategory {
  key: string;
  label: string;
  icon: LucideIcon;
  alerts: HrAlert[];
}

/** Badge styling per severity (rose / amber / blue). */
export const HR_ALERT_SEVERITY_STYLES: Record<HrAlertSeverity, string> = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-600",
};

export const HR_ALERT_SEVERITY_LABELS: Record<HrAlertSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export const HR_ALERT_CATEGORIES: HrAlertCategory[] = [
  {
    key: "compliance",
    label: "Employee Data Compliance",
    icon: ClipboardCheck,
    alerts: [
      { id: "cmp-1", title: "Missing bank account details", description: "Tunde Badmus · Engineering", severity: "warning", href: "/organization/employees" },
      { id: "cmp-2", title: "Missing tax information", description: "Ngozi Obi · Finance", severity: "warning", href: "/organization/employees" },
      { id: "cmp-3", title: "Missing emergency contact information", description: "Aisha Garba · Legal", severity: "info", href: "/organization/employees" },
      { id: "cmp-4", title: "Missing ID card scan", description: "Chiamaka Eze · Operations", severity: "warning", href: "/organization/employees" },
      { id: "cmp-5", title: "Trial period certification pending", description: "Emeka Nwosu · Engineering", severity: "info", href: "/organization/employee-checklist" },
      { id: "cmp-6", title: "Incomplete onboarding steps", description: "3 new hires this month", severity: "critical", href: "/talent/onboarding" },
    ],
  },
  {
    key: "payroll",
    label: "Payroll & Finance",
    icon: Banknote,
    alerts: [
      { id: "pay-1", title: "Employee without payroll setup", description: "Halima Musa · Human Resources", severity: "critical", href: "/organization/employees" },
      { id: "pay-2", title: "Unapproved timesheets", description: "5 timesheets awaiting approval", severity: "warning", href: "/time-payroll/attendance" },
      { id: "pay-3", title: "Pending payroll approvals", description: "February 2026 payroll run", severity: "critical", href: "/hr-action-center/submissions" },
      { id: "pay-4", title: "Salary discrepancy detected", description: "Babatunde Lawal · Marketing", severity: "critical", href: "/organization/employees" },
      { id: "pay-5", title: "Missing pension details", description: "Chukwuebuka Obi · Sales", severity: "warning", href: "/organization/employees" },
      { id: "pay-6", title: "Duplicate bank account detected", description: "2 employees share an account number", severity: "critical", href: "/organization/employees" },
    ],
  },
  {
    key: "recruitment",
    label: "Recruitment & Talent",
    icon: Briefcase,
    alerts: [
      { id: "rec-1", title: "Requisition awaiting approval", description: "Senior Backend Engineer · Engineering", severity: "warning", href: "/talent/recruitment" },
      { id: "rec-2", title: "Interview scheduled today", description: "Sales Representative candidate · 2:00 PM", severity: "info", href: "/talent/recruitment" },
      { id: "rec-3", title: "Offer awaiting approval", description: "Operations Associate", severity: "warning", href: "/talent/recruitment" },
      { id: "rec-4", title: "Offer letter pending review", description: "Frontend Engineer", severity: "info", href: "/talent/recruitment" },
      { id: "rec-5", title: "Verification checks overdue", description: "2 candidates in offer stage", severity: "critical", href: "/talent/recruitment" },
      { id: "rec-6", title: "Candidate without feedback", description: "Interview stage · awaiting scorecard", severity: "warning", href: "/talent/recruitment" },
    ],
  },
  {
    key: "relations",
    label: "Employee Relations",
    icon: Scale,
    alerts: [
      { id: "er-1", title: "Case SLA due", description: "Grievance GR-014 · due today", severity: "critical", href: "/admin/grievance" },
      { id: "er-2", title: "Hearing scheduled today", description: "Disciplinary DC-008 · 11:00 AM", severity: "info", href: "/admin/grievance" },
      { id: "er-3", title: "Appeals awaiting review", description: "Case GR-009", severity: "warning", href: "/admin/grievance" },
      { id: "er-4", title: "High-priority investigation pending", description: "Harassment complaint · unassigned", severity: "critical", href: "/admin/grievance" },
      { id: "er-5", title: "Pending evidence required", description: "Case DC-011", severity: "warning", href: "/admin/grievance" },
    ],
  },
  {
    key: "performance",
    label: "Performance Management",
    icon: TrendingUp,
    alerts: [
      { id: "perf-1", title: "Probation review due", description: "Emeka Nwosu · Engineering", severity: "warning", href: "/talent/performance" },
      { id: "perf-2", title: "Provision review due", description: "Ngozi Obi · Finance", severity: "info", href: "/talent/performance" },
      { id: "perf-3", title: "Performance review overdue", description: "4 reviews past due date", severity: "critical", href: "/talent/performance" },
      { id: "perf-4", title: "Goals not updated", description: "7 employees · current cycle", severity: "info", href: "/talent/performance" },
      { id: "perf-5", title: "Calibration session pending", description: "Q1 2026 review cycle", severity: "warning", href: "/talent/performance" },
    ],
  },
  {
    key: "leave",
    label: "Leave & Attendance",
    icon: CalendarClock,
    alerts: [
      { id: "lv-1", title: "Excessive absence detected", description: "Tunde Badmus · 6 days this month", severity: "critical", href: "/time-payroll/attendance" },
      { id: "lv-2", title: "Unapproved leave request", description: "Halima Musa · annual leave", severity: "warning", href: "/time-payroll/leave" },
      { id: "lv-3", title: "Negative leave balance", description: "Aisha Garba · -2 days", severity: "critical", href: "/time-payroll/leave" },
      { id: "lv-4", title: "Attendance anomaly flagged", description: "Operations team · repeated late clock-ins", severity: "warning", href: "/time-payroll/attendance" },
      { id: "lv-5", title: "Leave threshold exceeded", description: "Marketing department · 40% out", severity: "info", href: "/time-payroll/leave" },
    ],
  },
  {
    key: "learning",
    label: "Learning & Compliance",
    icon: GraduationCap,
    alerts: [
      { id: "ln-1", title: "Training overdue", description: "AML 2026 · 12 employees", severity: "critical", href: "/talent/training" },
      { id: "ln-2", title: "WHMIS certification expiring", description: "3 employees · within 30 days", severity: "warning", href: "/talent/training" },
      { id: "ln-3", title: "Cybersecurity training incomplete", description: "8 employees", severity: "warning", href: "/talent/training" },
      { id: "ln-4", title: "Policy acknowledgment pending", description: "Code of Conduct 2026", severity: "info", href: "/talent/training" },
    ],
  },
  {
    key: "assets",
    label: "IT & Asset",
    icon: Laptop,
    alerts: [
      { id: "it-1", title: "Laptop not assigned to employee", description: "Chiamaka Eze · started this week", severity: "warning", href: "/operations/assets" },
      { id: "it-2", title: "System access not revoked for terminated employee", description: "Former staff · 1 account active", severity: "critical", href: "/operations/assets" },
      { id: "it-3", title: "Company asset overdue (terminated employee)", description: 'MacBook Pro 16" · not returned', severity: "critical", href: "/operations/assets" },
    ],
  },
  {
    key: "management",
    label: "Management Action Items",
    icon: UserCog,
    alerts: [
      { id: "mg-1", title: "Pending approvals (manager level)", description: "4 requests awaiting your decision", severity: "warning", href: "/hr-action-center/submissions" },
      { id: "mg-2", title: "Team check-ins overdue", description: "3 direct reports", severity: "info", href: "/hr-action-center/tasks" },
      { id: "mg-3", title: "One-on-one meeting pending", description: "2 direct reports", severity: "info", href: "/hr-action-center/tasks" },
      { id: "mg-4", title: "Team probation review due", description: "1 direct report", severity: "warning", href: "/talent/performance" },
    ],
  },
  {
    key: "executive",
    label: "Executive / HR Risk",
    icon: AlertTriangle,
    alerts: [
      { id: "ex-1", title: "Headcount exceeding budget", description: "Engineering · +3 over plan", severity: "critical", href: "/organization/headcount" },
      { id: "ex-2", title: "Department diversity targets at risk", description: "Sales · below target", severity: "warning", href: "/organization/headcount" },
      { id: "ex-3", title: "Critical vacancy — urgent", description: "Head of Finance · open 60+ days", severity: "critical", href: "/talent/recruitment" },
    ],
  },
];

/** Total number of outstanding alerts across all categories. */
export const HR_ALERT_TOTAL = HR_ALERT_CATEGORIES.reduce(
  (sum, c) => sum + c.alerts.length,
  0,
);
