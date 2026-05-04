export type VerificationStage = "Draft" | "Submitted" | "Under Review" | "Verified" | "Rejected";

export interface ProfileData {
  name: string;
  industry: string;
  size: string;
  country: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

export interface VerificationHistoryEntry {
  stage: VerificationStage;
  date: string;
  reviewer: string;
}

