import type { AuditEntry, AuditSession, AuditActionType } from "@/src/lib/types/audit-trail";

export const ACTION_TYPE_CONFIG: Record<AuditActionType, { label: string; color: string; bg: string; border: string }> = {
  login:   { label: "Login",   color: "text-indigo-700 dark:text-indigo-400",  bg: "bg-indigo-100 dark:bg-indigo-950/60",  border: "border-indigo-200 dark:border-indigo-800" },
  logout:  { label: "Logout",  color: "text-slate-700 dark:text-slate-400",    bg: "bg-slate-100 dark:bg-slate-800",        border: "border-slate-200 dark:border-slate-700" },
  create:  { label: "Create",  color: "text-emerald-700 dark:text-emerald-400",bg: "bg-emerald-100 dark:bg-emerald-950/60", border: "border-emerald-200 dark:border-emerald-800" },
  update:  { label: "Update",  color: "text-amber-700 dark:text-amber-400",    bg: "bg-amber-100 dark:bg-amber-950/60",     border: "border-amber-200 dark:border-amber-800" },
  delete:  { label: "Delete",  color: "text-red-700 dark:text-red-400",        bg: "bg-red-100 dark:bg-red-950/60",         border: "border-red-200 dark:border-red-800" },
  export:  { label: "Export",  color: "text-cyan-700 dark:text-cyan-400",      bg: "bg-cyan-100 dark:bg-cyan-950/60",       border: "border-cyan-200 dark:border-cyan-800" },
  view:    { label: "View",    color: "text-blue-700 dark:text-blue-400",      bg: "bg-blue-100 dark:bg-blue-950/60",       border: "border-blue-200 dark:border-blue-800" },
  approve: { label: "Approve", color: "text-green-700 dark:text-green-400",    bg: "bg-green-100 dark:bg-green-950/60",     border: "border-green-200 dark:border-green-800" },
  reject:  { label: "Reject",  color: "text-rose-700 dark:text-rose-400",      bg: "bg-rose-100 dark:bg-rose-950/60",       border: "border-rose-200 dark:border-rose-800" },
};

export const ACTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "export", label: "Export" },
  { value: "view", label: "View" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
];

export const MODULE_LABELS: Record<string, string> = {
  auth:         "Authentication",
  employees:    "Employees",
  leave:        "Leave",
  payroll:      "Payroll",
  recruitment:  "Recruitment",
  performance:  "Performance",
  documents:    "Documents",
  settings:     "Settings",
  reports:      "Reports",
  access:       "Access Control",
  departments:  "Departments",
  contracts:    "Contracts",
};

export const MODULE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Modules" },
  ...Object.entries(MODULE_LABELS).map(([value, label]) => ({ value, label })),
];

export const HTTP_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "2xx", label: "2xx Success" },
  { value: "4xx", label: "4xx Client Error" },
  { value: "5xx", label: "5xx Server Error" },
];

export const ALL_ENTRIES: AuditEntry[] = [
  { id: "ae-001", sessionId: "s-001", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "login", module: "auth", description: "User logged in successfully", endpoint: "/api/auth/login", httpMethod: "POST", httpStatus: 200, ipAddress: "102.90.10.11", responseTimeMs: 210, timestamp: "2026-01-15T08:02:00Z", isSuspicious: false },
  { id: "ae-002", sessionId: "s-001", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "view", module: "employees", description: "Viewed employee list", endpoint: "/api/employees", httpMethod: "GET", httpStatus: 200, ipAddress: "102.90.10.11", responseTimeMs: 145, timestamp: "2026-01-15T08:05:00Z", isSuspicious: false },
  { id: "ae-003", sessionId: "s-001", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "update", module: "employees", description: "Updated employee profile: Emeka Nwosu", endpoint: "/api/employees/e-007", httpMethod: "PATCH", httpStatus: 200, ipAddress: "102.90.10.11", responseTimeMs: 320, timestamp: "2026-01-15T08:12:00Z", isSuspicious: false, resourceId: "e-007" },
  { id: "ae-004", sessionId: "s-001", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "export", module: "reports", description: "Exported payroll summary report", endpoint: "/api/reports/payroll/export", httpMethod: "GET", httpStatus: 200, ipAddress: "102.90.10.11", responseTimeMs: 980, timestamp: "2026-01-15T08:30:00Z", isSuspicious: false },
  { id: "ae-005", sessionId: "s-001", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "logout", module: "auth", description: "User logged out", endpoint: "/api/auth/logout", httpMethod: "POST", httpStatus: 200, ipAddress: "102.90.10.11", responseTimeMs: 85, timestamp: "2026-01-15T09:00:00Z", isSuspicious: false },
  { id: "ae-006", sessionId: "s-002", userId: "u-02", userName: "Chidi Eze", userInitials: "CE", userRole: "Manager", actionType: "login", module: "auth", description: "User logged in successfully", endpoint: "/api/auth/login", httpMethod: "POST", httpStatus: 200, ipAddress: "41.58.200.5", responseTimeMs: 190, timestamp: "2026-01-15T09:10:00Z", isSuspicious: false },
  { id: "ae-007", sessionId: "s-002", userId: "u-02", userName: "Chidi Eze", userInitials: "CE", userRole: "Manager", actionType: "approve", module: "leave", description: "Approved leave request for Halima Musa", endpoint: "/api/leave/lr-012/approve", httpMethod: "POST", httpStatus: 200, ipAddress: "41.58.200.5", responseTimeMs: 260, timestamp: "2026-01-15T09:20:00Z", isSuspicious: false, resourceId: "lr-012" },
  { id: "ae-008", sessionId: "s-002", userId: "u-02", userName: "Chidi Eze", userInitials: "CE", userRole: "Manager", actionType: "reject", module: "leave", description: "Rejected leave request for Bola Ahmed", endpoint: "/api/leave/lr-015/reject", httpMethod: "POST", httpStatus: 200, ipAddress: "41.58.200.5", responseTimeMs: 240, timestamp: "2026-01-15T09:25:00Z", isSuspicious: false, resourceId: "lr-015" },
  { id: "ae-009", sessionId: "s-003", userId: "u-03", userName: "Ngozi Obi", userInitials: "NO", userRole: "HR Admin", actionType: "login", module: "auth", description: "User logged in from unusual location", endpoint: "/api/auth/login", httpMethod: "POST", httpStatus: 200, ipAddress: "176.32.99.200", responseTimeMs: 310, timestamp: "2026-01-15T10:00:00Z", isSuspicious: true },
  { id: "ae-010", sessionId: "s-003", userId: "u-03", userName: "Ngozi Obi", userInitials: "NO", userRole: "HR Admin", actionType: "delete", module: "documents", description: "Deleted contract document: CNT-2024-019", endpoint: "/api/documents/doc-019", httpMethod: "DELETE", httpStatus: 200, ipAddress: "176.32.99.200", responseTimeMs: 450, timestamp: "2026-01-15T10:05:00Z", isSuspicious: true, resourceId: "doc-019" },
  { id: "ae-011", sessionId: "s-003", userId: "u-03", userName: "Ngozi Obi", userInitials: "NO", userRole: "HR Admin", actionType: "export", module: "employees", description: "Bulk exported employee records", endpoint: "/api/employees/export", httpMethod: "GET", httpStatus: 200, ipAddress: "176.32.99.200", responseTimeMs: 1200, timestamp: "2026-01-15T10:08:00Z", isSuspicious: true },
  { id: "ae-012", sessionId: "s-004", userId: "u-04", userName: "Tunde Badmus", userInitials: "TB", userRole: "Employee", actionType: "login", module: "auth", description: "User failed login attempt", endpoint: "/api/auth/login", httpMethod: "POST", httpStatus: 401, ipAddress: "102.100.10.5", responseTimeMs: 95, timestamp: "2026-01-15T11:00:00Z", isSuspicious: false },
  { id: "ae-013", sessionId: "s-004", userId: "u-04", userName: "Tunde Badmus", userInitials: "TB", userRole: "Employee", actionType: "login", module: "auth", description: "User logged in successfully", endpoint: "/api/auth/login", httpMethod: "POST", httpStatus: 200, ipAddress: "102.100.10.5", responseTimeMs: 180, timestamp: "2026-01-15T11:01:00Z", isSuspicious: false },
  { id: "ae-014", sessionId: "s-004", userId: "u-04", userName: "Tunde Badmus", userInitials: "TB", userRole: "Employee", actionType: "create", module: "leave", description: "Submitted leave request", endpoint: "/api/leave", httpMethod: "POST", httpStatus: 201, ipAddress: "102.100.10.5", responseTimeMs: 310, timestamp: "2026-01-15T11:10:00Z", isSuspicious: false },
  { id: "ae-015", sessionId: "s-005", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "login", module: "auth", description: "User logged in successfully", endpoint: "/api/auth/login", httpMethod: "POST", httpStatus: 200, ipAddress: "102.90.10.11", responseTimeMs: 200, timestamp: "2026-01-16T08:00:00Z", isSuspicious: false },
  { id: "ae-016", sessionId: "s-005", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "create", module: "recruitment", description: "Created new job requisition: Product Designer", endpoint: "/api/recruitment/requisitions", httpMethod: "POST", httpStatus: 201, ipAddress: "102.90.10.11", responseTimeMs: 420, timestamp: "2026-01-16T08:20:00Z", isSuspicious: false },
  { id: "ae-017", sessionId: "s-005", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "update", module: "settings", description: "Updated company notification settings", endpoint: "/api/settings/notifications", httpMethod: "PUT", httpStatus: 200, ipAddress: "102.90.10.11", responseTimeMs: 190, timestamp: "2026-01-16T08:45:00Z", isSuspicious: false },
  { id: "ae-018", sessionId: "s-005", userId: "u-01", userName: "Adaeze Okonkwo", userInitials: "AO", userRole: "HR Admin", actionType: "view", module: "payroll", description: "Viewed payroll run details", endpoint: "/api/payroll/run-2026-01", httpMethod: "GET", httpStatus: 200, ipAddress: "102.90.10.11", responseTimeMs: 310, timestamp: "2026-01-16T09:00:00Z", isSuspicious: false },
];

export function groupEntriesBySessions(entries: AuditEntry[]): AuditSession[] {
  const sessionMap = new Map<string, AuditSession>();
  for (const entry of entries) {
    if (!sessionMap.has(entry.sessionId)) {
      sessionMap.set(entry.sessionId, {
        id: entry.sessionId,
        userId: entry.userId,
        userName: entry.userName,
        userInitials: entry.userInitials,
        userRole: entry.userRole,
        startTime: entry.timestamp,
        entries: [],
      });
    }
    const session = sessionMap.get(entry.sessionId)!;
    session.entries.push(entry);
    if (entry.timestamp > (session.endTime ?? "")) {
      session.endTime = entry.timestamp;
    }
  }
  return Array.from(sessionMap.values());
}

export function computeAuditStats(entries: AuditEntry[]): {
  totalActions: number;
  sessions: number;
  errorRate: number;
  avgResponseTime: number;
  suspicious: number;
} {
  const sessionIds = new Set(entries.map((e) => e.sessionId));
  const errors = entries.filter((e) => e.httpStatus >= 400).length;
  const totalMs = entries.reduce((sum, e) => sum + e.responseTimeMs, 0);
  return {
    totalActions: entries.length,
    sessions: sessionIds.size,
    errorRate: entries.length > 0 ? Math.round((errors / entries.length) * 100) : 0,
    avgResponseTime: entries.length > 0 ? Math.round(totalMs / entries.length) : 0,
    suspicious: entries.filter((e) => e.isSuspicious).length,
  };
}
