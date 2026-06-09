import type {
  ApprovalChainStep,
  ApproverResolver,
  ApprovalSubmitter,
} from "@/src/lib/types/approvals";
import type { LocaleBundle } from "@/src/lib/types/locale";

export interface ResolvedApprover {
  employeeId: string | null;
  employeeName: string | null;
}

export function resolveApprover(
  resolver: ApproverResolver,
  submitter: ApprovalSubmitter,
  bundle: LocaleBundle | null,
): ResolvedApprover {
  if (!bundle) return { employeeId: null, employeeName: null };

  if (resolver === "LINE_MANAGER") {
    const me = bundle.employees.find((e) => e.id === submitter.employeeId);
    if (!me?.managerId) return { employeeId: null, employeeName: null };
    const manager = bundle.employees.find((e) => e.id === me.managerId);
    return {
      employeeId: me.managerId,
      employeeName: manager?.fullName ?? null,
    };
  }

  if (resolver === "DEPARTMENT_HEAD") {
    const me = bundle.employees.find((e) => e.id === submitter.employeeId);
    if (!me) return { employeeId: null, employeeName: null };
    const dept = bundle.departments.find((d) => d.id === me.departmentId);
    if (!dept?.headEmployeeId) return { employeeId: null, employeeName: null };
    const head = bundle.employees.find((e) => e.id === dept.headEmployeeId);
    return {
      employeeId: dept.headEmployeeId,
      employeeName: head?.fullName ?? null,
    };
  }

  if (resolver.startsWith("ROLE:")) {
    const roleId = resolver.slice(5);
    const role = bundle.roles.find((r) => r.id === roleId);
    if (!role?.linkedEmployeeId) {
      return { employeeId: null, employeeName: null };
    }
    const emp = bundle.employees.find((e) => e.id === role.linkedEmployeeId);
    return {
      employeeId: role.linkedEmployeeId,
      employeeName: emp?.fullName ?? null,
    };
  }

  return { employeeId: null, employeeName: null };
}

export function isOnLeave(
  employeeId: string | null,
  bundle: LocaleBundle | null,
): boolean {
  if (!employeeId || !bundle) return false;
  const e = bundle.employees.find((x) => x.id === employeeId);
  return e?.status === "on_leave";
}

export interface ResolvedStep {
  approverEmployeeId: string | null;
  approverName: string | null;
  skipped: boolean;
  reassignedFromEmployeeId?: string;
  reassignedFromName?: string;
}

/**
 * Resolve a chain step's effective approver, applying the configured
 * on-leave fallback if the primary approver is currently on leave.
 */
export function resolveStepWithOnLeave(
  step: ApprovalChainStep,
  submitter: ApprovalSubmitter,
  bundle: LocaleBundle | null,
): ResolvedStep {
  const primary = resolveApprover(step.approver, submitter, bundle);
  if (!primary.employeeId || !isOnLeave(primary.employeeId, bundle)) {
    return {
      approverEmployeeId: primary.employeeId,
      approverName: primary.employeeName,
      skipped: false,
    };
  }

  const originalName = primary.employeeName ?? undefined;
  const originalId = primary.employeeId;

  if (step.onLeaveAction.kind === "skip") {
    return {
      approverEmployeeId: null,
      approverName: null,
      skipped: true,
      reassignedFromEmployeeId: originalId,
      reassignedFromName: originalName,
    };
  }

  if (step.onLeaveAction.kind === "reassign_to_manager") {
    const onLeaveEmp = bundle?.employees.find((e) => e.id === originalId);
    if (onLeaveEmp?.managerId) {
      const mgr = bundle?.employees.find((e) => e.id === onLeaveEmp.managerId);
      return {
        approverEmployeeId: onLeaveEmp.managerId,
        approverName: mgr?.fullName ?? null,
        skipped: false,
        reassignedFromEmployeeId: originalId,
        reassignedFromName: originalName,
      };
    }
    return {
      approverEmployeeId: null,
      approverName: null,
      skipped: true,
      reassignedFromEmployeeId: originalId,
      reassignedFromName: originalName,
    };
  }

  // reassign_to_role
  const alt = resolveApprover(step.onLeaveAction.approver, submitter, bundle);
  return {
    approverEmployeeId: alt.employeeId,
    approverName: alt.employeeName,
    skipped: alt.employeeId == null,
    reassignedFromEmployeeId: originalId,
    reassignedFromName: originalName,
  };
}

/**
 * Returns true if `userEmployeeId` may act on the step. This covers:
 *   - The directly resolved employee (e.g., the specific Line Manager).
 *   - Any user whose own roleId matches a ROLE-based step (e.g., any
 *     HR Manager can act on a ROLE:ROLE-HRMGR step, even if the resolved
 *     employee is unavailable).
 */
export function canActOnStep(
  resolver: ApproverResolver,
  resolvedEmployeeId: string | null,
  userEmployeeId: string | undefined,
  userRoleId: string | undefined,
): boolean {
  if (!userEmployeeId) return false;
  if (resolvedEmployeeId && resolvedEmployeeId === userEmployeeId) return true;
  if (resolver.startsWith("ROLE:") && userRoleId) {
    return resolver.slice(5) === userRoleId;
  }
  return false;
}
