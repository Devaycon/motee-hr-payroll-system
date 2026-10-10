"use client";

import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { setRecords } from "@/src/lib/stores/onboarding-records-slice";
import {
  bulkRowToImportRow,
  manualDataToEmployeeRequest,
  onboardingStageToApi,
  toOnboardingRecord,
} from "@/src/lib/onboarding/api-mapping";
import type {
  BulkOnboardingRow,
  InviteOnboardingData,
  ManualOnboardingData,
  OnboardingRecord,
  OnboardingStage,
} from "@/src/lib/types/onboarding";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  employeeSchema,
  importRowSchema,
  inviteEmployeeSchema,
} from "@/src/lib/validations/employees";
import { useDecideApprovalMutation } from "@/src/store/services/approvals";
import { useGetAllOnboardingsQuery } from "@/src/store/services/collections";
import {
  useCreateEmployeeMutation,
  useImportEmployeesMutation,
  useInviteEmployeeMutation,
  useResendEmployeeInvitationMutation,
  useRevokeEmployeeInvitationMutation,
} from "@/src/store/services/employees";
import {
  useCompleteOnboardingMutation,
  useMoveOnboardingStageMutation,
} from "@/src/store/services/onboarding";

/**
 * Keeps the onboarding slice in step with the API. The pipeline and the
 * detail page both read that slice, so either can be landed on directly.
 */
export function useOnboardingRecords() {
  const dispatch = useAppDispatch();
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const { data, isLoading, error } = useGetAllOnboardingsQuery(undefined, {
    skip,
  });
  const mapped = useMemo(() => data?.map(toOnboardingRecord), [data]);

  useEffect(() => {
    if (mapped) dispatch(setRecords(mapped));
  }, [mapped, dispatch]);

  return {
    loading: isLoading,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/** A join link for the person just invited, from the token the API returns. */
function joinLink(token: string | null | undefined): string | null {
  if (!token || typeof window === "undefined") return null;
  return `${window.location.origin}/join/${token}`;
}

export function useOnboardingActions() {
  const departments = useAppSelector((s) => s.locale.data?.departments);
  const employees = useAppSelector((s) => s.locale.data?.employees);
  const [createEmployee] = useCreateEmployeeMutation();
  const [inviteEmployee] = useInviteEmployeeMutation();
  const [importEmployees] = useImportEmployeesMutation();
  const [issueInvitation] = useResendEmployeeInvitationMutation();
  const [revokeInvitation] = useRevokeEmployeeInvitationMutation();
  const [moveStage] = useMoveOnboardingStageMutation();
  const [completeOnboarding] = useCompleteOnboardingMutation();
  const [decideApproval] = useDecideApprovalMutation();

  const org = useMemo(
    () => ({ departments: departments ?? [], employees: employees ?? [] }),
    [departments, employees],
  );

  /** HR enters the whole record themselves. */
  const createManually = useCallback(
    async (data: ManualOnboardingData): Promise<boolean> => {
      const body = manualDataToEmployeeRequest(data, org);
      const parsed = employeeSchema.safeParse(body);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return false;
      }
      try {
        await createEmployee(body).unwrap();
        toast.success(`Onboarding initiated for ${data.firstName} ${data.lastName}`);
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not create the employee."));
        return false;
      }
    },
    [org, createEmployee],
  );

  /** The joiner is emailed a link and fills in their own details. */
  const invite = useCallback(
    async (data: InviteOnboardingData): Promise<boolean> => {
      const department = org.departments.find(
        (d) => d.name.toLowerCase() === data.department.trim().toLowerCase(),
      );
      const parsed = inviteEmployeeSchema.safeParse({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        jobTitle: data.jobTitle,
        departmentId: department?.id ?? "",
        employmentType: "fullTime",
        startDate: data.startDate || null,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return false;
      }
      try {
        const invited = (await inviteEmployee(parsed.data).unwrap()).data;
        const link = joinLink(invited.joinToken);
        toast.success(`Invite sent to ${data.email}`, {
          description: link
            ? "They have also been emailed this link."
            : undefined,
          action: link
            ? {
                label: "Copy link",
                onClick: () => void navigator.clipboard.writeText(link),
              }
            : undefined,
        });
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not send the invite."));
        return false;
      }
    },
    [org, inviteEmployee],
  );

  const importRows = useCallback(
    async (rows: BulkOnboardingRow[]): Promise<boolean> => {
      const mapped = rows.map(bulkRowToImportRow);
      const invalid = mapped.findIndex(
        (row) => !importRowSchema.safeParse(row).success,
      );
      if (invalid !== -1) {
        toast.error(`Row ${invalid + 1} is missing a required field.`);
        return false;
      }
      try {
        const result = (
          await importEmployees({ rows: mapped, sendInvitations: true }).unwrap()
        ).data;
        if (result.imported) {
          toast.success(
            `${result.imported} employee${result.imported !== 1 ? "s" : ""} imported`,
            { description: `${result.invited} invitation(s) sent.` },
          );
        }
        if (result.failed) {
          toast.error(`${result.failed} row(s) could not be imported`, {
            description: result.errors
              .slice(0, 3)
              .map((e) => `Row ${e.row}: ${e.message}`)
              .join(" · "),
          });
        }
        return result.imported > 0;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not import the employees."));
        return false;
      }
    },
    [importEmployees],
  );

  const resendInvite = useCallback(
    async (record: OnboardingRecord) => {
      if (!record.employeeId) return;
      try {
        await issueInvitation(record.employeeId).unwrap();
        toast.success(`Invitation sent to ${record.employeeName}`);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not send the invitation."));
      }
    },
    [issueInvitation],
  );

  /** Withdraws the join link; the employee record itself is kept. */
  const cancelInvite = useCallback(
    async (record: OnboardingRecord) => {
      if (!record.employeeId) return;
      try {
        await revokeInvitation(record.employeeId).unwrap();
        toast.success("Invitation withdrawn");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not withdraw the invitation."));
      }
    },
    [revokeInvitation],
  );

  const setStage = useCallback(
    async (id: string, stage: OnboardingStage) => {
      try {
        await moveStage({
          id,
          body: { stage: onboardingStageToApi(stage) },
        }).unwrap();
        toast.success("Onboarding stage updated");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not move the stage."));
      }
    },
    [moveStage],
  );

  const complete = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await completeOnboarding(id).unwrap();
        toast.success("Onboarding completed");
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not complete the onboarding."));
        return false;
      }
    },
    [completeOnboarding],
  );

  /** HR's decision on the pack the joiner submitted. */
  const review = useCallback(
    async (
      record: OnboardingRecord,
      decision: "approved" | "returned" | "rejected",
      note?: string,
    ): Promise<boolean> => {
      if (!record.approvalId) {
        toast.error("There is no submitted pack to review yet.");
        return false;
      }
      try {
        await decideApproval({
          id: record.approvalId,
          body: { decision, note: note || null },
        }).unwrap();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not record the decision."));
        return false;
      }
    },
    [decideApproval],
  );

  return {
    createManually,
    invite,
    importRows,
    resendInvite,
    cancelInvite,
    setStage,
    complete,
    review,
  };
}
