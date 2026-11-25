import type {
  CompanyProfileDto,
  CompanyProfileRequest,
  OrgChartView,
  VerificationDto,
  VerificationStage as ApiStage,
} from "@/src/types/company";
import type {
  CompanyVerificationData,
  CompanyVerificationField,
  OrgNode,
  ProfileData,
  VerificationHistoryEntry,
  VerificationStage,
} from "@/src/lib/types/company-profile";

const STAGE_FROM_API: Record<ApiStage, VerificationStage> = {
  draft: "Draft",
  submitted: "Submitted",
  underReview: "Under Review",
  verified: "Verified",
  rejected: "Rejected",
};

export const stageFromApi = (s: ApiStage | string | null | undefined): VerificationStage =>
  STAGE_FROM_API[s as ApiStage] ?? "Draft";

/** The spec types the country code as `{ value }`; the server may send a bare string. */
function countryText(dto: CompanyProfileDto): string {
  const code = dto.countryCode as unknown;
  if (dto.countryName) return dto.countryName;
  if (typeof code === "string") return code;
  return (code as { value?: string | null } | null)?.value ?? "";
}

export function profileFromApi(dto: CompanyProfileDto): ProfileData {
  return {
    name: dto.legalName || dto.name,
    industry: dto.industry ?? "",
    size: dto.sizeBand ?? "",
    country: countryText(dto),
    address: dto.address ?? "",
    contactEmail: dto.contactEmail ?? "",
    contactPhone: dto.contactPhone ?? "",
    website: dto.website ?? "",
  };
}

/** Size, country and address are not editable through `PUT /company`. */
export function profileToRequest(p: ProfileData, current?: CompanyProfileDto): CompanyProfileRequest {
  return {
    name: current?.name || p.name,
    legalName: p.name || null,
    industry: p.industry || null,
    contactEmail: p.contactEmail || null,
    contactPhone: p.contactPhone || null,
    website: p.website || null,
  };
}

/** History events are free text ("submitted", "verified", …); map the ones we know. */
function historyStage(event: string): VerificationStage {
  const e = event.toLowerCase().replace(/[\s_-]/g, "");
  if (e.includes("underreview") || e.includes("review")) return "Under Review";
  if (e.includes("verif") || e.includes("approv")) return "Verified";
  if (e.includes("reject")) return "Rejected";
  if (e.includes("submit")) return "Submitted";
  return "Draft";
}

function fieldFromApi(dto: VerificationDto, documentName: string): CompanyVerificationField {
  const history: VerificationHistoryEntry[] = dto.history.map((h) => ({
    stage: historyStage(h.event),
    date: h.at,
    reviewer: h.by ?? "",
  }));
  return {
    label: dto.label,
    description: dto.description,
    numberLabel: dto.numberLabel,
    authority: dto.authority,
    number: dto.number ?? "",
    status: stageFromApi(dto.stage),
    documentName,
    history,
  };
}

export function verificationFromApi(
  rows: VerificationDto[],
  fileNames: Record<string, string> = {},
): CompanyVerificationData | null {
  const reg = rows.find((r) => r.kind === "registration");
  const tax = rows.find((r) => r.kind === "tax");
  if (!reg || !tax) return null;
  const name = (d: VerificationDto) =>
    d.documentFileId ? fileNames[d.documentFileId] ?? "Supporting document" : "";
  const latest = [reg, tax]
    .map((d) => d.reviewedOn ?? d.submittedOn)
    .filter(Boolean)
    .sort()
    .pop();
  return {
    registration: fieldFromApi(reg, name(reg)),
    tax: fieldFromApi(tax, name(tax)),
    updatedBy: reg.reviewedByName ?? tax.reviewedByName ?? undefined,
    updatedAt: latest ?? undefined,
  };
}

export function orgChartFromApi(view: OrgChartView, maxLevel = 3): OrgNode[] {
  return view.nodes
    .filter((n) => n.level <= maxLevel)
    .map((n) => ({
      id: n.id,
      name: n.name,
      initials: n.initials ?? initialsOf(n.name),
      role: n.role ?? "",
      dept: n.department ?? "",
      reportsTo: n.reportsTo ?? null,
    }));
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
