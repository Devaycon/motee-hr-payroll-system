import type {
  ComplianceItemDto,
  ComplianceKey,
  EorEngagementRequest,
  EorInvoiceDto,
  EorProviderDto,
  EorProviderRequest,
  EorWorkerDto,
  PayFrequency,
} from "@/src/types/eor";
import type {
  EorComplianceItem,
  EorComplianceKey,
  EorComplianceStatus,
  EorInvoice,
  EorProvider,
  EorWorker,
} from "@/src/lib/types/eor";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { initials } from "@/src/lib/helpdesk/api-mapping";

const KEY_FROM_API: Record<ComplianceKey, EorComplianceKey> = {
  contract: "contract",
  workPermit: "work_permit",
  taxRegistration: "tax_registration",
  statutoryBenefits: "statutory_benefits",
  localId: "local_id",
};
export const complianceKeyToApi = (k: EorComplianceKey): ComplianceKey =>
  (Object.entries(KEY_FROM_API).find(([, v]) => v === k)?.[0] ?? "contract") as ComplianceKey;

export function complianceFromApi(c: ComplianceItemDto): EorComplianceItem {
  // Expired or expiring evidence needs action, whatever the stored state.
  const status: EorComplianceStatus =
    c.standing === "expired" || c.standing === "expiringSoon" || c.standing === "actionRequired"
      ? "action_required"
      : c.standing === "notApplicable"
        ? "not_applicable"
        : c.standing;
  return { key: KEY_FROM_API[c.key] ?? "contract", label: c.label, status, note: c.note ?? undefined };
}

let NAME_TO_ISO2: Map<string, string> | null = null;

/** ISO-2 code for a country name or code ("Nigeria" → "NG", "ng" → "NG"). */
export function countryCodeOf(country: string): string {
  const value = country.trim();
  if (/^[a-z]{2}$/i.test(value)) return value.toUpperCase();
  if (!NAME_TO_ISO2) {
    NAME_TO_ISO2 = new Map();
    try {
      const names = new Intl.DisplayNames(["en"], { type: "region" });
      const A = 65;
      for (let i = 0; i < 26; i++) {
        for (let j = 0; j < 26; j++) {
          const code = String.fromCharCode(A + i, A + j);
          const name = names.of(code);
          if (name && name !== code) NAME_TO_ISO2.set(name.toLowerCase(), code);
        }
      }
    } catch {
      // No Intl region names: fall through to the first two letters.
    }
    NAME_TO_ISO2.set("united states of america", "US");
    NAME_TO_ISO2.set("uk", "GB");
  }
  return NAME_TO_ISO2.get(value.toLowerCase()) ?? value.slice(0, 2).toUpperCase();
}

const SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", ZAR: "R", KES: "KSh", GHS: "₵", INR: "₹", CAD: "$" };

export function providerFromApi(dto: EorProviderDto): EorProvider {
  return {
    id: dto.id,
    name: dto.name,
    initials: initials(dto.name),
    status: dto.status,
    countriesCovered: dto.countriesCovered,
    workerCount: dto.workerCount,
    managementFeePct: dto.managementFeePercent,
    since: dto.partneredOn ?? "",
    website: dto.website ?? undefined,
  };
}

export function providerToRequest(p: EorProvider): EorProviderRequest {
  return {
    name: p.name,
    status: p.status,
    countriesCovered: p.countriesCovered,
    managementFeePercent: p.managementFeePct,
    partneredOn: p.since || null,
    website: p.website || null,
  };
}

const PAY_FROM_API: Record<PayFrequency, EorWorker["payFrequency"]> = {
  weekly: "weekly",
  biWeekly: "bi_weekly",
  semiMonthly: "bi_weekly",
  monthly: "monthly",
};
const PAY_TO_API: Record<EorWorker["payFrequency"], PayFrequency> = {
  weekly: "weekly",
  bi_weekly: "biWeekly",
  monthly: "monthly",
};

/**
 * An EOR engagement on the API belongs to an existing employee; the personal
 * details the screen shows come from that employee's record.
 */
export function workerFromApi(dto: EorWorkerDto, employee?: LocaleEmployee): EorWorker {
  const extra = employee as (LocaleEmployee & { title?: string; maritalStatus?: string; personalEmail?: string }) | undefined;
  return {
    id: dto.id,
    name: dto.name,
    initials: dto.initials ?? initials(dto.name),
    title: extra?.title ?? "",
    legalFirstName: employee?.firstName ?? dto.name.split(" ")[0] ?? "",
    legalLastName: employee?.lastName ?? dto.name.split(" ").slice(1).join(" "),
    dateOfBirth: employee?.dateOfBirth ?? "",
    gender: employee?.gender ?? "",
    maritalStatus: extra?.maritalStatus ?? "",
    nationality: employee?.nationality ?? "",
    email: dto.email ?? employee?.email ?? "",
    personalEmail: extra?.personalEmail,
    phone: employee?.phone ?? "",
    role: dto.jobTitle ?? employee?.jobTitle ?? "",
    department: dto.department ?? employee?.departmentName ?? "",
    country: dto.countryOfEngagement,
    countryCode: countryCodeOf(dto.countryOfEngagement),
    providerId: dto.providerId,
    providerName: dto.providerName,
    status: dto.stage,
    startDate: dto.startDate,
    endDate: dto.endDate ?? undefined,
    currency: dto.currency,
    currencySymbol: SYMBOLS[dto.currency] ?? dto.currency,
    grossSalaryMonthly: dto.grossMonthly,
    employerCost: dto.employerCostMonthly,
    managementFee: dto.managementFee,
    monthlyCostUsd: dto.totalUsd ?? dto.totalMonthly,
    payFrequency: PAY_FROM_API[dto.payFrequency] ?? "monthly",
    compliance: dto.compliance.map(complianceFromApi),
  };
}

export function workerToRequest(w: EorWorker, employeeId: string): EorEngagementRequest {
  return {
    employeeId,
    providerId: w.providerId,
    countryOfEngagement: w.country,
    currency: w.currency,
    grossMonthly: w.grossSalaryMonthly,
    employerCostMonthly: w.employerCost,
    payFrequency: PAY_TO_API[w.payFrequency] ?? "monthly",
    startDate: w.startDate,
    endDate: w.endDate || null,
  };
}

export function invoiceFromApi(dto: EorInvoiceDto): EorInvoice {
  return {
    id: dto.id,
    providerId: dto.providerId,
    providerName: dto.providerName,
    period: dto.periodLabel || dto.period,
    workerCount: dto.billedWorkerCount,
    grossPay: dto.grossPay,
    employerCosts: dto.employerCosts,
    managementFee: dto.managementFee,
    total: dto.total,
    status: dto.standing,
    issuedAt: dto.issuedOn,
    dueAt: dto.dueOn,
    periodKey: dto.period,
    reference: dto.reference ?? undefined,
    currency: dto.currency,
  };
}
