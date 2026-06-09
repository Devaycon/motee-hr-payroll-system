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

/** A single company-level verification field (registration or tax), country-driven. */
export interface CompanyVerificationField {
  label: string;
  description: string;
  numberLabel: string;
  authority: string;
  /** The actual number, merged from companyProfile (registrationNumber / taxId). */
  number: string;
  status: VerificationStage;
  documentName: string;
  history: VerificationHistoryEntry[];
}

export interface CompanyVerificationData {
  registration: CompanyVerificationField;
  tax: CompanyVerificationField;
  updatedBy?: string;
  updatedAt?: string;
}

/** A node in the bundle-driven organisation chart. */
export interface OrgNode {
  id: string;
  name: string;
  initials: string;
  role: string;
  dept: string;
  reportsTo: string | null;
}

