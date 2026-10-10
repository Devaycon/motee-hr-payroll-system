"use client";

import { useCallback } from "react";
import {
  employeeDtoToRequest,
  employeeStatusToApi,
} from "@/src/lib/employees/api-mapping";
import type { EmployeeStatus } from "@/src/lib/types/employees";
import {
  employeesApi,
  useChangeEmployeeStatusMutation,
  useDeleteEmployeeMutation,
  useResendEmployeeInvitationMutation,
  useRevokeEmployeeInvitationMutation,
  useUpdateEmployeeMutation,
} from "@/src/store/services/employees";
import type { EmployeeRequest } from "@/src/types/employees";

/**
 * Employee writes shared by every screen that can change a record. Each
 * rejects on failure so the caller decides how to report it.
 */
export function useEmployeeActions() {
  const [fetchEmployee] = employeesApi.useLazyGetEmployeeQuery();
  const [updateEmployee] = useUpdateEmployeeMutation();
  const [changeStatus] = useChangeEmployeeStatusMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [issueInvitation] = useResendEmployeeInvitationMutation();
  const [revokeInvitation] = useRevokeEmployeeInvitationMutation();

  /** Change some fields of a record. The API replaces the whole record, so
   *  the current one is read first and resent with the change applied. */
  const patchEmployee = useCallback(
    async (id: string, patch: Partial<EmployeeRequest>) => {
      const current = (await fetchEmployee(id).unwrap()).data;
      const body = employeeDtoToRequest(current, patch);
      return (await updateEmployee({ id, body }).unwrap()).data;
    },
    [fetchEmployee, updateEmployee],
  );

  const setStatus = useCallback(
    (id: string, status: EmployeeStatus) =>
      changeStatus({
        id,
        body: { status: employeeStatusToApi(status) },
      }).unwrap(),
    [changeStatus],
  );

  const remove = useCallback(
    (id: string) => deleteEmployee(id).unwrap(),
    [deleteEmployee],
  );

  /** Issue (or reissue) the emailed link the person signs in or joins with. */
  const sendInvitation = useCallback(
    (id: string) => issueInvitation(id).unwrap(),
    [issueInvitation],
  );

  const cancelInvitation = useCallback(
    (id: string) => revokeInvitation(id).unwrap(),
    [revokeInvitation],
  );

  return { patchEmployee, setStatus, remove, sendInvitation, cancelInvitation };
}
