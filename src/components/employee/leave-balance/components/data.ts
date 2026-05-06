import type { LeaveTypeName, LeaveStatus } from "@/src/lib/types/leave";

export interface BalanceEntry {
  type: LeaveTypeName;
  totalEntitlement: number;
  daysUsed: number;
  daysPending: number;
  carryOver?: number;
}

export interface HistoryEntry {
  id: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  notes?: string;
  approvedBy?: string;
  rejectionReason?: string;
  submittedAt: string;
}

export const MY_BALANCES: BalanceEntry[] = [
  { type: "annual", totalEntitlement: 20, daysUsed: 8, daysPending: 0, carryOver: 3 },
  { type: "sick", totalEntitlement: 10, daysUsed: 2, daysPending: 0 },
  { type: "compassionate", totalEntitlement: 3, daysUsed: 0, daysPending: 0 },
  { type: "study", totalEntitlement: 5, daysUsed: 0, daysPending: 0 },
  { type: "paternity", totalEntitlement: 5, daysUsed: 0, daysPending: 0 },
  { type: "maternity", totalEntitlement: 90, daysUsed: 0, daysPending: 0 },
  { type: "unpaid", totalEntitlement: 30, daysUsed: 0, daysPending: 0 },
];

export const MY_HISTORY: HistoryEntry[] = [
  {
    id: "mlr-001",
    leaveType: "annual",
    startDate: "2026-02-03",
    endDate: "2026-02-07",
    totalDays: 5,
    status: "approved",
    notes: "Family trip",
    approvedBy: "Chidinma Okeke",
    submittedAt: "2026-01-24",
  },
  {
    id: "mlr-002",
    leaveType: "sick",
    startDate: "2026-03-11",
    endDate: "2026-03-12",
    totalDays: 2,
    status: "approved",
    notes: "Doctor's visit",
    approvedBy: "Chidinma Okeke",
    submittedAt: "2026-03-11",
  },
  {
    id: "mlr-003",
    leaveType: "annual",
    startDate: "2026-01-06",
    endDate: "2026-01-08",
    totalDays: 3,
    status: "approved",
    notes: "New Year break",
    approvedBy: "Chidinma Okeke",
    submittedAt: "2025-12-27",
  },
  {
    id: "mlr-004",
    leaveType: "study",
    startDate: "2026-05-12",
    endDate: "2026-05-14",
    totalDays: 3,
    status: "pending",
    notes: "ICAN professional exams",
    submittedAt: "2026-04-20",
  },
];

export const TYPE_COLORS: Record<LeaveTypeName, { bar: string; bg: string }> = {
  annual: { bar: "#2563EB", bg: "#2563EB18" },
  sick: { bar: "#EF4444", bg: "#EF444418" },
  maternity: { bar: "#EC4899", bg: "#EC489918" },
  paternity: { bar: "#7C3AED", bg: "#7C3AED18" },
  unpaid: { bar: "#6B7280", bg: "#6B728018" },
  compassionate: { bar: "#D97706", bg: "#D9770618" },
  study: { bar: "#0D9488", bg: "#0D948818" },
};

export function remaining(b: BalanceEntry): number {
  return b.totalEntitlement - b.daysUsed - b.daysPending;
}
