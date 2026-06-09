import type { EmploymentType } from "@/src/lib/constants/employment-types";
export type { EmploymentType };

export type EmployeeStatus = "active" | "on_leave" | "probation";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  startDate: string;
  avatar: string | null;
  salary: number;
  managerId: string | null;
}

export type LeaveType =
  | "annual"
  | "sick"
  | "maternity"
  | "paternity"
  | "compassionate";

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  reason: string;
}

export type JobPostingStatus = "open" | "closed" | "paused";

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  applicants: number;
  stage: string;
  postedDate: string;
  status: JobPostingStatus;
}

export type PayrollStatus = "draft" | "processing" | "completed";

export interface PayrollRun {
  id: string;
  period: string;
  totalAmount: number;
  employeeCount: number;
  status: PayrollStatus;
}

export type CandidateStage =
  | "applied"
  | "screened"
  | "interviewed"
  | "offered"
  | "hired"
  | "rejected";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  jobId: string;
  stage: CandidateStage;
  appliedDate: string;
}
