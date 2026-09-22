import type {
  ApprovalChainStep,
  ApproverResolver,
  ApprovalSubmitter,
  ApprovalDelegation,
} from "@/src/lib/types/approvals";
import type { LocaleBundle } from "@/src/lib/types/locale";

/** §4.1 — the delegation covering `employeeId` on `today`, if any. */
export function findActiveDelegation(
  employeeId: string,
  delegations: ApprovalDelegation[],
  today: string,
): ApprovalDelegation | null {
  return (
    delegations.find(
      (d) =>
        d.delegatorEmployeeId === employeeId &&
        d.startDate <= today &&
        today <= d.endDate,
    ) ?? null
  );
}

function resolveManagersManager(
  onLeaveEmployeeId: string,
  bundle: LocaleBundle | null,
): ResolvedApprover {
  if (!bundle) return { employeeId: null, employeeName: null };
  const onLeaveEmp = bundle.employees.find((e) => e.id === onLeaveEmployeeId);
  if (!onLeaveEmp?.managerId) return { employeeId: null, employeeName: null };
  const manager = bundle.employees.find((e) => e.id === onLeaveEmp.managerId);
  if (!manager?.managerId) return { employeeId: null, employeeName: null };
  const managersManager = bundle.employees.find((e) => e.id === manager.managerId);
  return {
    employeeId: manager.managerId,
    employeeName: managersManager?.fullName ?? null,
  };
}

function resolveHRHead(bundle: LocaleBundle | null): ResolvedApprover {
  if (!bundle) return { employeeId: null, employeeName: null };
  const hrDept = bundle.departments.find((d) =>
    d.name.toLowerCase().includes("human resources"),
  );
  if (!hrDept?.headEmployeeId) return { employeeId: null, employeeName: null };
  const head = bundle.employees.find((e) => e.id === hrDept.headEmployeeId);
  return {
    employeeId: hrDept.headEmployeeId,
    employeeName: head?.fullName ?? null,
  };
}

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
  /** §4.1 — set when the reassignment came from a pre-configured delegation. */
  delegationReason?: string;
  delegationPeriod?: { start: string; end: string };
}

/**
 * Resolve a chain step's effective approver, applying the configured
 * on-leave fallback if the primary approver is currently on leave.
 *
 * §4.1 — an active pre-configured delegation (mechanism 1) is checked first,
 * ahead of the step's own `onLeaveAction` fallback (mechanism 2), regardless
 * of which fallback kind that step has configured.
 */
export function resolveStepWithOnLeave(
  step: ApprovalChainStep,
  submitter: ApprovalSubmitter,
  bundle: LocaleBundle | null,
  delegations: ApprovalDelegation[] = [],
  today: string = new Date().toISOString().slice(0, 10),
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

  const activeDelegation = findActiveDelegation(originalId, delegations, today);
  if (activeDelegation) {
    return {
      approverEmployeeId: activeDelegation.delegateEmployeeId,
      approverName: activeDelegation.delegateName,
      skipped: false,
      reassignedFromEmployeeId: originalId,
      reassignedFromName: originalName,
      delegationReason:
        activeDelegation.reason ?? `${originalName ?? "The approver"} was on leave`,
      delegationPeriod: { start: activeDelegation.startDate, end: activeDelegation.endDate },
    };
  }

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

  if (step.onLeaveAction.kind === "escalate_hierarchy") {
    for (const hop of step.onLeaveAction.order) {
      // "delegate" was already tried above (and was absent, or we wouldn't
      // be here) — skip straight to the hierarchy hops.
      if (hop === "delegate") continue;
      const resolved =
        hop === "managers_manager"
          ? resolveManagersManager(originalId, bundle)
          : resolveHRHead(bundle);
      if (resolved.employeeId) {
        return {
          approverEmployeeId: resolved.employeeId,
          approverName: resolved.employeeName,
          skipped: false,
          reassignedFromEmployeeId: originalId,
          reassignedFromName: originalName,
        };
      }
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
