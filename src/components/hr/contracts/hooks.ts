"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  Contract,
  ContractStatus,
  ContractType,
} from "@/src/lib/types/contracts";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawContract {
  id?: string;
  type?: string;
  status?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  signedDate?: string;
  template?: string;
  salary?: number;
  autoRenew?: boolean;
  noticePeriodDays?: number;
}

function mapType(t?: string): ContractType {
  switch (t) {
    case "nda":
      return "nda";
    case "contractor":
      return "contractor";
    case "internship":
      return "internship";
    case "consultancy":
      return "consultancy";
    case "amendment":
      return "amendment";
    default:
      return "employment";
  }
}

function mapStatus(s?: string): ContractStatus {
  if (s === "draft" || s === "active" || s === "expired" || s === "terminated") {
    return s;
  }
  if (s === "pending_signature") return "pending_signature";
  if (s === "expiring_soon" || s === "expiring") return "expiring_soon";
  return "active";
}

function buildContracts(bundle: LocaleBundle): Contract[] {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  return bundle.contracts.map((raw, i) => {
    const r = raw as RawContract;
    const emp = r.employeeId ? employeesById.get(r.employeeId) : null;
    const startDate = r.startDate ?? emp?.startDate ?? bundle.tenant.createdAt;
    return {
      id: r.id ?? `CON-${String(i + 1).padStart(3, "0")}`,
      title: r.template ?? `${mapType(r.type)} contract`,
      description: r.template,
      contractType: mapType(r.type),
      status: mapStatus(r.status),
      employeeName: emp?.fullName ?? r.employeeId ?? "Unknown",
      employeeInitials: emp?.initials ?? "??",
      department: emp?.departmentName ?? "—",
      startDate,
      endDate: r.endDate,
      autoRenew: r.autoRenew ?? false,
      noticePeriodDays: r.noticePeriodDays ?? 30,
      salary: emp?.salary?.amount,
      contractCurrency: bundle.tenant.currency,
      signatureStatus: r.status === "active" ? "fully_signed" : "unsigned",
      signatories: emp
        ? [
            { name: emp.fullName, initials: emp.initials, role: "Employee" },
            { name: "HR Admin", initials: "HA", role: "HR Manager" },
          ]
        : [],
      notes: [],
      createdAt: startDate,
      createdBy: "HR Admin",
      lastModifiedAt: startDate,
      isArchived: false,
    } as Contract;
  });
}

export function useContracts() {
  return useLocaleSection<Contract[]>(buildContracts);
}
