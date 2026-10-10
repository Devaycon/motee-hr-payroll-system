/**
 * Sends leave changes to the API.
 *
 * Same arrangement as offboarding: the leave screens dispatch slice actions,
 * this turns each into its API call, and the refetch that follows replaces the
 * slice's optimistic copy. A refused call refetches as well, which undoes it.
 */
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { toast } from "sonner";
import type { AppDispatch, RootState } from "./store";
import {
  addPolicy,
  addRequest,
  addRequests,
  adjustBalance,
  advanceRequest,
  cancelRequest,
  deletePolicy,
  rejectRequest,
  updatePolicy,
  updateRequest,
} from "./leave-slice";
import {
  leavePolicyToRequest,
  parseBalanceId,
} from "@/src/lib/leave/api-mapping";
import type { LeaveRequest } from "@/src/lib/types/leave";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  leaveAdjustmentSchema,
  leaveRequestSchema,
  leaveTypeSchema,
} from "@/src/lib/validations/leave";
import api from "@/src/store/services/api";
import { approvalsApi } from "@/src/store/services/approvals";
import { leaveApi } from "@/src/store/services/leave";
import { leaveBalancesApi } from "@/src/store/services/leave-balances";
import { leavePoliciesApi } from "@/src/store/services/leave-policies";

const LEAVE_TAGS = ["Leave", "LeaveBalances", "LeavePolicies"] as const;

export const leaveListener = createListenerMiddleware();

leaveListener.startListening({
  predicate: (action) => action.type.startsWith("leave/"),
  effect: async (action, listenerApi) => {
    const dispatch = listenerApi.dispatch as AppDispatch;
    const before = (listenerApi.getOriginalState() as RootState).leave;
    const after = (listenerApi.getState() as RootState).leave;
    const resync = () => dispatch(api.util.invalidateTags([...LEAVE_TAGS]));

    const send = async (call: () => Promise<unknown>, fallback: string) => {
      try {
        await call();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
        resync();
        return false;
      }
    };

    /** The server checks notice, balance, overlaps and blackouts; ask it
     *  first so a refusal comes back as a reason rather than an error. */
    const submit = async (request: LeaveRequest): Promise<boolean> => {
      const leaveTypeId =
        request.leaveTypeId ??
        after.policies.find((p) => p.leaveType === request.leaveType)?.id;
      const parsed = leaveRequestSchema.safeParse({
        employeeId: request.employeeId,
        leaveTypeId,
        startDate: request.startDate,
        endDate: request.endDate,
        isHalfDay: request.isHalfDay,
        halfDayPeriod: request.halfDayPeriod ?? null,
        reason: request.reason || null,
        notes: request.notes || null,
        reliefEmployeeId: request.reliefEmployeeId || null,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return false;
      }
      const body = parsed.data;
      try {
        const quote = (
          await dispatch(
            leaveApi.endpoints.quoteLeaveRequest.initiate({
              employeeId: body.employeeId,
              leaveTypeId: body.leaveTypeId,
              startDate: body.startDate,
              endDate: body.endDate,
              isHalfDay: body.isHalfDay,
            }),
          ).unwrap()
        ).data;
        const problems = quote.problems.filter((p) => p !== "succeeded");
        if (problems.length) {
          toast.error(quote.message ?? "This leave cannot be booked.", {
            description: `${request.employeeName}: ${problems.join(", ")}`,
          });
          return false;
        }
        await dispatch(
          leaveApi.endpoints.createLeaveRequest.initiate(body),
        ).unwrap();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not submit the leave request."));
        return false;
      }
    };

    if (addRequest.match(action)) {
      await submit(action.payload.request);
      resync();
      return;
    }

    if (addRequests.match(action)) {
      let saved = 0;
      for (const request of action.payload.requests) {
        if (await submit(request)) saved++;
      }
      if (saved) toast.success(`${saved} leave request(s) submitted`);
      resync();
      return;
    }

    if (advanceRequest.match(action) || rejectRequest.match(action)) {
      const listed = before.requests.find((r) => r.id === action.payload.id);
      // A returned request gets a new approval when it is resubmitted, so the
      // id to decide is read from the request as it stands now.
      let approvalId = listed?.approvalId;
      const read = dispatch(
        leaveApi.endpoints.getLeaveRequest.initiate(action.payload.id, {
          forceRefetch: true,
        }),
      );
      try {
        approvalId = (await read.unwrap()).data.approval?.id ?? approvalId;
      } catch {
        // Fall back to the id from the list.
      } finally {
        read.unsubscribe();
      }
      const request = listed ? { ...listed, approvalId } : undefined;
      if (!request?.approvalId) {
        toast.error("This request has no approval to decide.");
        resync();
        return;
      }
      const rejecting = rejectRequest.match(action);
      await send(
        () =>
          dispatch(
            approvalsApi.endpoints.decideApproval.initiate({
              id: request.approvalId as string,
              body: {
                decision: rejecting ? "rejected" : "approved",
                note: rejecting
                  ? action.payload.reason
                  : (action.payload.comment ?? null),
              },
            }),
          ).unwrap(),
        "Could not record the decision.",
      );
      return;
    }

    if (cancelRequest.match(action)) {
      await send(
        () =>
          dispatch(
            leaveApi.endpoints.cancelLeaveRequest.initiate({
              id: action.payload.id,
              body: { reason: action.payload.reason ?? null },
            }),
          ).unwrap(),
        "Could not cancel the leave request.",
      );
      return;
    }

    if (updateRequest.match(action)) {
      // A submitted request cannot be edited on the server: cancel and rebook.
      toast.info("A submitted request cannot be edited. Cancel it and book again.");
      resync();
      return;
    }

    if (addPolicy.match(action) || updatePolicy.match(action)) {
      const id = addPolicy.match(action) ? action.payload.id : action.payload.id;
      const policy = after.policies.find((p) => p.id === id);
      if (!policy) return;
      const body = leavePolicyToRequest(policy);
      const parsed = leaveTypeSchema.safeParse(body);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        resync();
        return;
      }
      await send(
        () =>
          addPolicy.match(action)
            ? dispatch(
                leavePoliciesApi.endpoints.createLeaveType.initiate(body),
              ).unwrap()
            : dispatch(
                leavePoliciesApi.endpoints.updateLeaveType.initiate({ id, body }),
              ).unwrap(),
        "Could not save the leave policy.",
      );
      return;
    }

    if (deletePolicy.match(action)) {
      await send(
        () =>
          dispatch(
            leavePoliciesApi.endpoints.deleteLeaveType.initiate(action.payload),
          ).unwrap(),
        "Could not delete the leave policy.",
      );
      return;
    }

    if (adjustBalance.match(action)) {
      const parsed = leaveAdjustmentSchema.safeParse({
        ...parseBalanceId(action.payload.id),
        days: action.payload.delta,
        reason: "Manual adjustment",
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        resync();
        return;
      }
      await send(
        () =>
          dispatch(
            leaveBalancesApi.endpoints.adjustLeaveBalance.initiate(parsed.data),
          ).unwrap(),
        "Could not adjust the balance.",
      );
    }
  },
});
