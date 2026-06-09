import {
  type EmploymentType,
  employmentTypeLabel,
} from "@/src/lib/constants/employment-types";
export type { EmploymentType };

export type AttendanceStatus = "present" | "absent" | "late" | "on_leave";

export type LeaveType = "annual" | "sick" | "maternity" | "paternity" | "unpaid";

export function employmentLabel(type: string): string {
  return employmentTypeLabel(type);
}

export function leaveTypeLabel(type: string): string {
  const map: Record<string, string> = {
    annual: "Annual",
    sick: "Sick",
    maternity: "Maternity",
    paternity: "Paternity",
    unpaid: "Unpaid",
  };
  return map[type] ?? type;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface EmployeeRow {
  id: number;
  empId: string;
  name: string;
  initials: string;
  email: string;
  city: string;
  title: string;
  department: string;
  workMode: string;
  teamLead: string;
  employmentType: EmploymentType;
  status: string;
  startDate: string;
  managerName: string | null;
}

export interface AttendanceRow {
  id: number;
  name: string;
  status: string;
  clockIn: string;
  department: string;
}

export interface LeaveRow {
  id: number;
  name: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

