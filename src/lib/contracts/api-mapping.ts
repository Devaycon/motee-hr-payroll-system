import type {
  ContractDto,
  ContractRequest,
  SignatureStatus as ApiSignatureStatus,
} from "@/src/types/contracts";
import type {
  Contract,
  ContractSignatory,
  ContractStatus,
  NewContract,
  SignatureStatus,
} from "@/src/lib/types/contracts";
import { getInitials } from "@/src/lib/types/dashboard";

/**
 * The API keeps four lifecycle states and reports "expiring soon" and
 * "expired" as flags on an active contract; the screens show them as
 * statuses of their own.
 */

function toStatus(dto: ContractDto): ContractStatus {
  switch (dto.status) {
    case "draft":
      return "draft";
    case "pendingSignature":
      return "pending_signature";
    case "terminated":
      return "terminated";
    default:
      if (dto.isExpired) return "expired";
      if (dto.isExpiringSoon) return "expiring_soon";
      return "active";
  }
}

const SIGNATURE_STATUS: Record<ApiSignatureStatus, SignatureStatus> = {
  unsigned: "unsigned",
  partiallySigned: "employee_signed",
  fullySigned: "fully_signed",
};

/** The employee and HR signature lines, ticked off as signatures arrive. */
function signatoriesFor(dto: ContractDto): ContractSignatory[] {
  const byEmployee = dto.signatures.find(
    (s) => s.employeeId === dto.employeeId,
  );
  const byHr = dto.signatures.find((s) => s !== byEmployee);
  return [
    {
      name: dto.employeeName,
      initials: getInitials(dto.employeeName),
      role: dto.contractType === "internship" ? "Intern" : "Employee",
      signedAt: byEmployee?.signedAt,
    },
    {
      name: byHr?.signedByName ?? "HR Admin",
      initials: getInitials(byHr?.signedByName ?? "HR Admin"),
      role: byHr?.signedAs ?? "HR Manager",
      signedAt: byHr?.signedAt,
    },
  ];
}

export function toContract(dto: ContractDto): Contract {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description ?? undefined,
    contractType: dto.contractType,
    status: toStatus(dto),
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
    employeeInitials: getInitials(dto.employeeName),
    department: dto.departmentName ?? "—",
    startDate: dto.startDate,
    endDate: dto.endDate ?? undefined,
    autoRenew: dto.autoRenew,
    noticePeriodDays: dto.noticePeriodDays,
    salary: dto.salary ?? undefined,
    contractCurrency: dto.currency,
    signatureStatus: SIGNATURE_STATUS[dto.signatureStatus],
    signatories: signatoriesFor(dto),
    notes: dto.notes.map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt,
      createdBy: n.createdByName ?? "HR Admin",
    })),
    createdAt: dto.createdAt,
    createdBy: "HR Admin",
    lastModifiedAt: dto.createdAt,
    isArchived: dto.isArchived,
    movedToDocuments: !!dto.documentId,
  };
}

export function contractToRequest(input: NewContract): ContractRequest {
  return {
    employeeId: input.employeeId ?? "",
    title: input.title.trim(),
    description: input.description?.trim() || null,
    contractType: input.contractType,
    startDate: input.startDate,
    endDate: input.endDate || null,
    autoRenew: input.autoRenew,
    noticePeriodDays: input.noticePeriodDays,
    salary: input.salary ?? null,
    currency: input.contractCurrency || null,
  };
}
