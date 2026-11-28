"use client";

// The company profile describes the whole company — including its full list of
// sites — so it never narrows to the branch the navbar is scoped to.
import { useCallback, useMemo } from "react";
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useApiRunner, useIsLive } from "@/src/lib/live/use-is-live";
import {
  orgChartFromApi,
  profileFromApi,
  profileToRequest,
  verificationFromApi,
} from "@/src/lib/company/api-mapping";
import {
  useGetCompanyNoticeQuery,
  useGetCompanyOrgChartQuery,
  useGetCompanyQuery,
  useGetCompanyVerificationQuery,
  useSaveCompanyVerificationMutation,
  useSubmitCompanyVerificationMutation,
  useWithdrawCompanyVerificationMutation,
  useUpdateCompanyMutation,
} from "@/src/store/services/company";
import { useGetFilesQuery, useUploadFileMutation } from "@/src/store/services/files";
import type { VerificationKind } from "@/src/types/company";
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

/** The company profile: from `GET /company` when signed in, the bundle otherwise. */
export function useCompanyProfile() {
  const live = useIsLive();
  const demo = useLocaleSection<ProfileData>(buildProfile);
  const api = useGetCompanyQuery(undefined, { skip: !live });
  const liveData = useMemo(
    () => (api.data?.data ? profileFromApi(api.data.data) : null),
    [api.data],
  );
  if (!live) return demo;
  return { data: liveData, loading: api.isLoading, error: null };
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

/** Registration and tax verification: from the API when signed in. */
export function useCompanyVerification() {
  const live = useIsLive();
  const demo = useDemoCompanyVerification();
  const api = useGetCompanyVerificationQuery(undefined, { skip: !live });
  const files = useGetFilesQuery(
    { purpose: "companyVerificationDocument" },
    { skip: !live },
  );
  const liveData = useMemo(() => {
    const rows = api.data?.data;
    if (!rows) return null;
    const names = Object.fromEntries(
      (files.data?.data ?? []).map((f) => [f.id, f.fileName]),
    );
    return verificationFromApi(rows, names);
  }, [api.data, files.data]);
  if (!live) return demo;
  return { data: liveData, loading: api.isLoading, error: null };
}

function useDemoCompanyVerification() {
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

/** Leadership-overview org chart (top ~3 tiers); from the API when signed in. */
export function useOrgChart() {
  const live = useIsLive();
  const demo = useDemoOrgChart();
  const api = useGetCompanyOrgChartQuery({ maxLevel: 3 }, { skip: !live });
  const liveNodes = useMemo(
    () => (api.data?.data ? orgChartFromApi(api.data.data) : []),
    [api.data],
  );
  return live ? liveNodes : demo;
}

function useDemoOrgChart() {
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

/**
 * The pinned company notice. Signed out `text` is undefined and the page keeps
 * its demo copy; signed in it is the server notice ("" when nothing is pinned).
 */
export function useCompanyNotice(): { live: boolean; text: string | undefined } {
  const live = useIsLive();
  const api = useGetCompanyNoticeQuery(undefined, { skip: !live });
  const notice = api.data?.data;
  let text: string | undefined;
  if (live) text = notice ? [notice.title, notice.body].filter(Boolean).join(" — ") : "";
  return { live, text };
}

/** Writes for the company profile page. Each resolves true on success. */
export function useCompanyActions() {
  const live = useIsLive();
  const run = useApiRunner();
  const current = useGetCompanyQuery(undefined, { skip: !live });
  const [updateCompany] = useUpdateCompanyMutation();
  const [saveVerification] = useSaveCompanyVerificationMutation();
  const [submitVerification] = useSubmitCompanyVerificationMutation();
  const [withdrawVerification] = useWithdrawCompanyVerificationMutation();
  const [upload] = useUploadFileMutation();

  const saveProfile = useCallback(
    (p: ProfileData) =>
      run(
        () => updateCompany(profileToRequest(p, current.data?.data)).unwrap(),
        "Could not save the company profile.",
      ),
    [run, updateCompany, current.data],
  );

  /** Saves the number (and an uploaded document), then submits it for review. */
  const submit = useCallback(
    (kind: VerificationKind, number: string, file: File | null) =>
      run(async () => {
        let documentFileId: string | undefined;
        if (file) {
          const stored = await upload({
            file,
            purpose: "companyVerificationDocument",
          }).unwrap();
          documentFileId = stored.data.id;
        }
        await saveVerification({
          kind,
          body: { number: number || null, ...(documentFileId ? { documentFileId } : {}) },
        }).unwrap();
        await submitVerification(kind).unwrap();
      }, "Could not submit the document for verification."),
    [run, upload, saveVerification, submitVerification],
  );

  /** POST /company/verification/{kind}/withdraw — takes a submission back out of review. */
  const withdraw = useCallback(
    (kind: VerificationKind) =>
      run(() => withdrawVerification(kind).unwrap(), "Could not withdraw the submission."),
    [run, withdrawVerification],
  );

  return { live, saveProfile, submit, withdraw };
}
