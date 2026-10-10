import type { ApiResponse } from "./api";

export type StructureType = "hierarchical" | "flat";

export interface TenantSetupOption {
  id: string;
  label: string;
}

export interface TenantSetupOptions {
  industries: string[];
  companySizes: TenantSetupOption[];
  structureTypes: StructureType[];
  modules: TenantSetupOption[];
  managerTitleSuggestions: string[];
  departmentLabelSuggestions: string[];
}

export interface TenantSetup {
  companyName: string;
  countryCode: string;
  country: string;
  industry: string | null;
  companySize: string | null;
  companyEmailDomain: string | null;
  companyPolicies: string | null;
  managerTitle: string;
  departmentLabel: string;
  structureType: StructureType;
  enabledModules: string[];
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
}

export interface TenantSetupRequest {
  industry: string;
  companySize: string;
  companyEmailDomain?: string | null;
  companyPolicies?: string | null;
  managerTitle: string;
  departmentLabel: string;
  structureType: string;
  enabledModules: string[];
}

export type GetTenantSetupOptionsResponse = ApiResponse<TenantSetupOptions>;
export type GetTenantSetupResponse = ApiResponse<TenantSetup>;
export type UpdateTenantSetupResponse = ApiResponse<null>;
