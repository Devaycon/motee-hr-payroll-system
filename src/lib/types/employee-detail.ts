// Computed/aggregate types for the Employee Detail page. Raw per-record shapes
// live in locale.ts as Locale* interfaces and are reused directly by the UI.

export interface EmployeeStats {
  leaveRemaining: number;
  openTasks: number;
  pendingApprovals: number;
  assignedAssets: number;
  kudosReceived: number;
}

export interface LeaveSummaryRow {
  policyId: string;
  policyName: string;
  allowance: number;
  adjustments: number;
  /** Days carried over from the previous holiday year under the policy. */
  carryOver: number;
  /** allowance + adjustments — total leave the employee is entitled to. */
  entitlement: number;
  booked: number;
  taken: number;
  /** entitlement − taken (excludes booked future leave). */
  remaining: number;
  /** remaining − booked — what the employee can still book. */
  available: number;
}

export interface SicknessSummary {
  totalDaysThisYear: number;
  longestAbsenceDays: number;
  episodes: number;
  bradfordFactor: number; // S^2 * D
}

export interface TimeLogsSummary {
  monthlyHours: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
}

export interface LeaveUsageBucket {
  month: string; // YYYY-MM
  byType: Record<string, number>;
  total: number;
}

export interface EffectivePermissionRow {
  id: string; // `${employeeId}::${module}`
  module: string;
  label: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
}
