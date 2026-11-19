/**
 * Approval decisions in the Submissions hub → payroll.
 *
 * Payroll runs (matched by the run's own request id, so an old rejected
 * request can never move a resubmitted run):
 *  - Chain approved                  → run becomes Approved (ready to finalize).
 *  - Rejected / returned / cancelled → back to Draft for the preparer to fix.
 *  The run is never finalized automatically: Finalize locks the figures and
 *  issues payslips, so it stays an explicit action.
 *
 * Salary changes (the promotion / salary change chain, documents "SS-…"):
 *  - Approved → the new structure version takes effect (back pay follows
 *    automatically in the next draft run if it's back-dated).
 *  - Rejected / cancelled → the pending version is discarded.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { approveStep, cancel as cancelApproval, rejectStep, returnToSender } from "./approvals-slice";
import { pushNotification } from "./notifications-slice";
import { decideSalaryStructure, saveRun } from "./payroll-slice";
import { PAYROLL_DOCUMENT_TYPE, PAYROLL_HREF, SALARY_CHANGE_DOCUMENT_TYPE } from "@/src/lib/payroll/constants";

export const payrollListener = createListenerMiddleware();

payrollListener.startListening({
  matcher: isAnyOf(approveStep, rejectStep, returnToSender, cancelApproval),
  effect: (action, api) => {
    const state = api.getState() as RootState;
    const requestId = (action.payload as { requestId?: string }).requestId;
    const req = state.approvals.requests.find((r) => r.id === requestId);
    if (!req) return;
    const actorName = (action.payload as { actorName?: string }).actorName ?? "Approver";
    const actorId = (action.payload as { actorEmployeeId?: string }).actorEmployeeId ?? "";
    const closedBad = req.status === "rejected" || req.status === "returned" || req.status === "cancelled";

    // Bulk salary review: one request decides every change in the batch.
    if (req.documentType === SALARY_CHANGE_DOCUMENT_TYPE && req.documentId.startsWith("SSB-")) {
      if (req.status !== "approved" && !closedBad) return;
      for (const [tenantId, t] of Object.entries(state.payroll.byTenant)) {
        for (const s of t.structures.filter((x) => x.batchId === req.documentId && x.status === "pending"))
          api.dispatch(decideSalaryStructure({ tenantId, actor: actorName, structureId: s.id, approved: req.status === "approved" }));
      }
      return;
    }

    if (req.documentType === SALARY_CHANGE_DOCUMENT_TYPE && req.documentId.startsWith("SS-")) {
      if (req.status !== "approved" && !closedBad) return;
      for (const [tenantId, t] of Object.entries(state.payroll.byTenant)) {
        if (!t.structures.some((s) => s.id === req.documentId && s.status === "pending")) continue;
        api.dispatch(decideSalaryStructure({ tenantId, actor: actorName, structureId: req.documentId, approved: req.status === "approved" }));
      }
      return;
    }

    if (req.documentType !== PAYROLL_DOCUMENT_TYPE) return;
    for (const [tenantId, t] of Object.entries(state.payroll.byTenant)) {
      const run = t.runs.find((r) => r.id === req.documentId && r.tenantId === tenantId);
      // Only the run's CURRENT request may move it.
      if (!run || run.status !== "in_review" || (run.approvalRequestId && run.approvalRequestId !== req.id)) continue;
      if (req.status === "approved") {
        api.dispatch(
          saveRun({
            tenantId,
            actor: actorName,
            note: "Approved through the payroll approval chain",
            run: { ...run, status: "approved", approvedBy: { employeeId: actorId, name: actorName }, approvedAt: new Date().toISOString() },
          }),
        );
      } else if (closedBad) {
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
          recipientEmployeeIds: [run.preparedBy.employeeId].filter(Boolean),
          recipientRoleIds: ["ROLE-HRADMIN", "ROLE-SADMIN"],
          href: `${PAYROLL_HREF}/${run.id}`,
        }),
      );
    }
  },
});
