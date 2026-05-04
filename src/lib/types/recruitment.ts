export type RequisitionStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "closed"
  | "filled";

export type RequisitionEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship";

export type ApplicationStage =
  | "applied"
  | "screening"
  | "interview"
  | "assessment"
  | "offer"
  | "hired"
  | "rejected";

export interface JobRequisition {
  id: string;
  positionTitle: string;
  department: string;
  hiringManager: string;
  employmentType: RequisitionEmploymentType;
  status: RequisitionStatus;
  openings: number;
  salaryMin: number;
  salaryMax: number;
  jobDescription: string;
  requiredSkills: string[];
  targetStartDate: string;
  applicantCount: number;
  createdAt: string;
}

export interface NewJobRequisition {
  positionTitle: string;
  department: string;
  hiringManager: string;
  employmentType: RequisitionEmploymentType;
  openings: number;
  salaryMin: number;
  salaryMax: number;
  jobDescription: string;
  requiredSkills: string[];
  targetStartDate: string;
}

export interface Applicant {
  id: string;
  requisitionId: string;
  requisitionTitle: string;
  name: string;
  initials: string;
  email: string;
  phone?: string;
  source: string;
  stage: ApplicationStage;
  appliedAt: string;
  applicationDate?: string;
  updatedAt: string;
  notes?: string;
}

