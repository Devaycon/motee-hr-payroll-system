"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { reseed } from "@/src/lib/stores/leave-slice";
import { stagesForTemplate, type LeaveStage } from "@/src/lib/leave/stages";
import {
  toLeaveBalance,
  toLeavePolicy,
  toLeaveRequest,
} from "@/src/lib/leave/api-mapping";
import type { ApprovalChainStep } from "@/src/lib/types/approvals";
import type {
  LeaveBalance,
  LeavePolicy,
  LeaveRequest,
} from "@/src/lib/types/leave";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useGetAllLeaveBalancesQuery,
  useGetAllLeaveRequestsQuery,
} from "@/src/store/services/collections";
import { useGetLeaveTypesQuery } from "@/src/store/services/leave-policies";

export interface LeaveData {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  policies: LeavePolicy[];
}

/**
 * Leave types, balances and requests, mirrored from the API into the leave
 * slice the screens read. Writes are sent by `leave-listener`; the refetch
 * that follows lands back here.
 */
export function useLeaveData() {
  const dispatch = useAppDispatch();
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const types = useGetLeaveTypesQuery(undefined, { skip });
  const balances = useGetAllLeaveBalancesQuery(undefined, { skip });
  const requests = useGetAllLeaveRequestsQuery(undefined, { skip });
  const state = useAppSelector((s) => s.leave);

  const data = useMemo<LeaveData | null>(() => {
    if (!types.data || !balances.data || !requests.data) return null;
    const policies = (types.data.data ?? []).map(toLeavePolicy);
    const kindByTypeId = new Map(policies.map((p) => [p.id, p.leaveType]));
    return {
      policies,
      balances: balances.data.map((b) => toLeaveBalance(b, kindByTypeId)),
      requests: requests.data.map((r) => toLeaveRequest(r, kindByTypeId)),
    };
  }, [types.data, balances.data, requests.data]);

  useEffect(() => {
    if (data) dispatch(reseed(data));
  }, [data, dispatch]);

  const error = types.error ?? balances.error ?? requests.error;

  return {
    data: state.seeded
      ? {
          requests: state.requests,
          balances: state.balances,
          policies: state.policies,
        }
      : data,
    loading: types.isLoading || balances.isLoading || requests.isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/**
 * The approval stages leave requests pass through, taken from whichever chain
 * template HR has made active for `leave_request` (§F4/F7).
 */
export function useLeaveStages(): LeaveStage[] {
  const templates = useAppSelector((s) => s.approvals.templates);
  const roles = useAppSelector((s) => s.accessLevels.levels);

  return useMemo(() => {
    const forLeave = templates.filter((t) => t.documentType === "leave_request");
    const active = forLeave.find((t) => t.isDefault) ?? forLeave[0];
    const label = (approver: ApprovalChainStep["approver"]): string => {
      if (approver === "LINE_MANAGER") return "Line manager";
      if (approver === "DEPARTMENT_HEAD") return "Department head";
      const roleId = approver.startsWith("ROLE:") ? approver.slice(5) : approver;
      return roles.find((r) => r.id === roleId)?.name ?? roleId;
    };
    return stagesForTemplate(active, label);
  }, [templates, roles]);
}
