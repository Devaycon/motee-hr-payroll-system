/**
 * Approval decisions in the Submissions hub → the payroll run.
 *
 *  - Chain approved           → run becomes Approved (ready to finalize).
 *  - Rejected / returned / cancelled → back to Draft for the preparer to fix.
 *
 * The run is never finalized automatically: Finalize is a separate, explicit
 * action, because it locks the figures and issues payslips.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { approveStep, cancel as cancelApproval, rejectStep, returnToSender } from "./approvals-slice";
import { pushNotification } from "./notifications-slice";
import { saveRun } from "./payroll-slice";
import { PAYROLL_DOCUMENT_TYPE, PAYROLL_HREF } from "@/src/lib/payroll/constants";

export const payrollListener = createListenerMiddleware();

payrollListener.startListening({
  matcher: isAnyOf(approveStep, rejectStep, returnToSender, cancelApproval),
  effect: (action, api) => {
    const state = api.getState() as RootState;
    const requestId = (action.payload as { requestId?: string }).requestId;
    const req = state.approvals.requests.find((r) => r.id === requestId);
    if (!req || req.documentType !== PAYROLL_DOCUMENT_TYPE) return;
    const actorName = (action.payload as { actorName?: string }).actorName ?? "Approver";
    const actorId = (action.payload as { actorEmployeeId?: string }).actorEmployeeId ?? "";

    for (const [tenantId, t] of Object.entries(state.payroll.byTenant)) {
      const run = t.runs.find((r) => r.id === req.documentId);
      if (!run || run.status !== "in_review") continue;
      if (req.status === "approved") {
        api.dispatch(
          saveRun({
            tenantId,
            actor: actorName,
            note: "Approved through the payroll approval chain",
            run: { ...run, status: "approved", approvedBy: { employeeId: actorId, name: actorName }, approvedAt: new Date().toISOString() },
          }),
        );
      } else if (req.status === "rejected" || req.status === "returned" || req.status === "cancelled") {
        api.dispatch(
          saveRun({
            tenantId,
            actor: actorName,
            note: `Approval ${req.status} — run returned to draft`,
            run: { ...run, status: "draft", approvalRequestId: undefined, submittedAt: undefined },
          }),
        );
      } else {
        continue;
      }
      api.dispatch(
        pushNotification({
          title: req.status === "approved" ? "Payroll approved" : "Payroll sent back",
          description:
            req.status === "approved"
              ? `${run.title} was approved by ${actorName}. It can now be finalized.`
              : `${run.title} was ${req.status} by ${actorName}.`,
          type: req.status === "approved" ? "success" : "warning",
          recipientRoleIds: ["ROLE-HRADMIN", "ROLE-SADMIN", "ROLE-FIN"],
          href: `${PAYROLL_HREF}/${run.id}`,
        }),
      );
    }
  },
});
