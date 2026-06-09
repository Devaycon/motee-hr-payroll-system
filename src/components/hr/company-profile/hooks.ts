"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type {
  ProfileData,
  CompanyVerificationData,
  CompanyVerificationField,
  OrgNode,
} from "@/src/lib/types/company-profile";

interface RawProfile {
  legalName?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
  supportEmail?: string;
  phone?: string;
  headquarters?: {
    addressLines?: string[];
    city?: string;
    region?: string;
    country?: string;
  };
}

function buildProfile(bundle: LocaleBundle): ProfileData {
  const raw = bundle.companyProfile as RawProfile;
  const employeeCount = bundle.employees.length;
  const size =
    employeeCount < 11 ? "1–10" : employeeCount < 51 ? "11–50" : employeeCount < 201 ? "51–200" : "201+";
  const address = [
    ...(raw.headquarters?.addressLines ?? []),
    raw.headquarters?.city,
    raw.headquarters?.region,
    raw.headquarters?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    name: raw.legalName ?? bundle.tenant.name,
    industry: bundle.tenant.industry,
    size,
    country: raw.headquarters?.country ?? bundle.tenant.country,
    address,
    contactEmail: raw.supportEmail ?? bundle.tenant.billingEmail,
    contactPhone: raw.phone ?? "",
    website: raw.website ?? "",
  };
}

export function useCompanyProfile() {
  return useLocaleSection<ProfileData>(buildProfile);
}

/** Fallback field config when a bundle has no companyVerification block. */
function fallbackField(
  label: string,
  numberLabel: string,
  number: string,
): CompanyVerificationField {
  return {
    label,
    description: "",
    numberLabel,
    authority: "",
    number,
    status: "Draft",
    documentName: "",
    history: [],
  };
}

export function useCompanyVerification() {
  return useLocaleSection<CompanyVerificationData>((bundle) => {
    const profile = bundle.companyProfile as RawProfile;
    const regNumber = profile.registrationNumber ?? "—";
    const taxNumber = profile.taxId ?? "—";
    const cv = (bundle as { companyVerification?: Partial<CompanyVerificationData> })
      .companyVerification;

    if (!cv?.registration || !cv?.tax) {
      return {
        registration: fallbackField("Company Registration", "Registration No.", regNumber),
        tax: fallbackField("Tax ID", "Tax No.", taxNumber),
      };
    }
    // Numbers live in companyProfile; the verification block adds the country-correct
    // labels/authorities/statuses/history/doc names.
    return {
      registration: { ...cv.registration, number: regNumber } as CompanyVerificationField,
      tax: { ...cv.tax, number: taxNumber } as CompanyVerificationField,
      updatedBy: cv.updatedBy,
      updatedAt: cv.updatedAt,
    };
  });
}

interface RawOrgEntry {
  employeeId: string;
  parentEmployeeId: string | null;
  level?: number;
}

/** Leadership-overview org chart (top ~3 tiers) built from the active bundle. */
export function useOrgChart() {
  const { data } = useLocaleSection<OrgNode[]>((bundle) => {
    const empById = new Map(bundle.employees.map((e) => [e.id, e]));
    const org = (bundle.orgStructure ?? []) as unknown as RawOrgEntry[];
    return org
      .filter((o) => (o.level ?? 99) <= 3)
      .map((o) => {
        const e = empById.get(o.employeeId);
        return {
          id: o.employeeId,
          name: e?.fullName ?? o.employeeId,
          initials: e?.initials ?? "",
          role: e?.jobTitle ?? "",
          dept: e?.departmentName ?? "",
          reportsTo: o.parentEmployeeId ?? null,
        };
      });
  });
  return data ?? [];
}
