import type {
  LeaveBalance,
  LeaveHistoryEntry,
  LeavePolicy,
  LeaveRequest,
  LeaveStatus,
  LeaveTypeName,
} from "@/src/lib/types/leave";
import type { LeaveBalanceDto } from "@/src/types/leave-balances";
import type { LeaveRequestDto } from "@/src/types/leave";
import type {
  LeaveTypeDto,
  LeaveTypeRequest,
} from "@/src/types/leave-policies";

/**
 * Leave types are free-form records on the API, while the screens group them
 * into a fixed set of kinds (for colours, icons and filters). A type is
 * matched to a kind by its code or name; anything unrecognised reads as annual.
 */
export function leaveKindOf(nameOrCode: string | null | undefined): LeaveTypeName {
  const text = (nameOrCode ?? "").toLowerCase();
  if (text.includes("sick")) return "sick";
  if (text.includes("matern")) return "maternity";
  if (text.includes("patern")) return "paternity";
  if (text.includes("unpaid")) return "unpaid";
  if (text.includes("compassion") || text.includes("bereave")) {
    return "compassionate";
  }
  if (text.includes("study") || text.includes("exam")) return "study";
  return "annual";
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function toLeavePolicy(type: LeaveTypeDto): LeavePolicy {
  const policy = type.policy;
  return {
    id: type.id,
    name: type.name,
    leaveType: leaveKindOf(type.code ?? type.name),
    description: policy?.description ?? undefined,
    maxDaysPerYear: policy?.daysPerYear ?? 0,
    minNoticeDays: policy?.minNoticeDays ?? 0,
    maxConsecutiveDays: policy?.maxConsecutiveDays ?? 0,
    requiresMedicalCertificate: policy?.requiresMedicalCertificate ?? false,
    carryOverAllowed: policy?.carryOverAllowed ?? false,
    maxCarryOverDays: policy?.maxCarryOverDays ?? 0,
    eligibility: policy?.eligibility ?? undefined,
    publicHolidayRule: policy?.publicHolidayNote ?? undefined,
    attachmentRequirement: policy?.attachmentRequirement ?? undefined,
    documentUrl: policy?.documentUrl ?? undefined,
    createdAt: "",
  };
}

export function leavePolicyToRequest(policy: LeavePolicy): LeaveTypeRequest {
  return {
    name: policy.name,
    isPaid: policy.leaveType !== "unpaid",
    isActive: true,
    policy: {
      description: policy.description || null,
      daysPerYear: policy.maxDaysPerYear,
      minNoticeDays: policy.minNoticeDays,
      maxConsecutiveDays: policy.maxConsecutiveDays,
      requiresMedicalCertificate: policy.requiresMedicalCertificate,
      carryOverAllowed: policy.carryOverAllowed,
      maxCarryOverDays: policy.maxCarryOverDays,
      eligibility: policy.eligibility || null,
      publicHolidayNote: policy.publicHolidayRule || null,
      attachmentRequirement: policy.attachmentRequirement || null,
      documentUrl: policy.documentUrl || null,
    },
  };
}

/** A balance has no id of its own: it is one person's standing in one type. */
export function balanceId(employeeId: string, leaveTypeId: string): string {
  return `${employeeId}:${leaveTypeId}`;
}

export function parseBalanceId(id: string): {
  employeeId: string;
  leaveTypeId: string;
} {
  const [employeeId = "", leaveTypeId = ""] = id.split(":");
  return { employeeId, leaveTypeId };
}

export function toLeaveBalance(
  balance: LeaveBalanceDto,
  kindByTypeId: Map<string, LeaveTypeName>,
): LeaveBalance {
  return {
    id: balanceId(balance.employeeId, balance.leaveTypeId),
    employeeId: balance.employeeId,
    leaveTypeId: balance.leaveTypeId,
    employeeName: balance.employeeName,
    employeeInitials: initialsOf(balance.employeeName),
    department: balance.departmentName ?? "—",
    leaveType:
      kindByTypeId.get(balance.leaveTypeId) ?? leaveKindOf(balance.leaveTypeName),
    totalEntitlement: balance.entitlement,
    daysUsed: balance.used,
    daysPending: balance.pending,
    carriedOver: balance.carriedOver,
    accruedToDate: balance.accrued,
    carryOverExpiresAt: balance.carryOverExpiresOn ?? undefined,
    adjustments: balance.adjustments,
  };
}

export function toLeaveRequest(
  request: LeaveRequestDto,
  kindByTypeId: Map<string, LeaveTypeName>,
): LeaveRequest {
  const approval = request.approval;
  const history: LeaveHistoryEntry[] = (approval?.history ?? []).map((event) => ({
    id: event.id,
    at: event.at,
    action: event.type,
    actor: event.actorName ?? "—",
    comment: event.note ?? undefined,
  }));
  const status: LeaveStatus = request.status;
  const rejection = [...(approval?.history ?? [])]
    .reverse()
    .find((event) => event.note);

  return {
    id: request.id,
    employeeId: request.employeeId,
    leaveTypeId: request.leaveTypeId,
    approvalId: approval?.id,
    employeeName: request.employeeName,
    employeeInitials: initialsOf(request.employeeName),
    department: request.departmentName ?? "—",
    jobTitle: request.jobTitle ?? "",
    leaveType:
      kindByTypeId.get(request.leaveTypeId) ?? leaveKindOf(request.leaveTypeName),
    startDate: request.startDate,
    endDate: request.endDate,
    totalDays: request.totalDays,
    isHalfDay: request.isHalfDay,
    halfDayPeriod:
      request.halfDayPeriod === "morning" || request.halfDayPeriod === "afternoon"
        ? request.halfDayPeriod
        : undefined,
    status,
    reason: request.reason ?? undefined,
    notes: request.notes ?? undefined,
    reliefEmployeeId: request.reliefEmployeeId ?? undefined,
    reliefEmployeeName: request.reliefEmployeeName ?? undefined,
    documents: (approval?.attachments ?? []).map((file) => ({
      id: file.id,
      name: file.fileName,
      size: file.sizeBytes,
      url: file.url ?? undefined,
      uploadedAt: file.uploadedAt,
    })),
    history,
    submittedAt: request.submittedAt,
    submittedBy: request.employeeName,
    createdAt: request.submittedAt,
    approvedAt: status === "approved" ? (request.decidedAt ?? undefined) : undefined,
    rejectionReason: status === "rejected" ? (rejection?.note ?? undefined) : undefined,
    cancelledAt: request.cancelledAt ?? undefined,
  };
}
