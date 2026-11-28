/**
 * Submissions & Approvals on the API (signed in, server approvals only). The
 * detail page records a decision in the approvals slice first; this sends it
 * and re-reads the approvals, so the server's copy replaces the local one:
 *
 * - approveStep    → POST /approvals/{id}/decide  { decision: "approved" }
 * - rejectStep     → POST /approvals/{id}/decide  { decision: "rejected" }
 * - returnToSender → POST /approvals/{id}/decide  { decision: "returned" }
 * - resubmit       → POST /approvals/{id}/resubmit
 * - cancel         → POST /approvals/{id}/cancel
 * - addComment     → POST /approvals/{id}/comments
 *
 * A reviewer signature drawn while approving is uploaded (POST /files,
 * purpose approvalSignature) and sent as the decision's signatureFileId.
 * Edits made while resubmitting have no API field and are not sent. Demo
 * approvals (non-UUID ids) are left to the demo engine.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { approvalsApi } from "@/src/store/services/approvals";
import { filesApi } from "@/src/store/services/files";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  addComment,
  approveStep,
  cancel,
  rejectStep,
  resubmit,
  returnToSender,
} from "./approvals-slice";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const extension = blob.type.split("/")[1] ?? "png";
  return new File([blob], `${name}.${extension}`, { type: blob.type });
}

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
}

export const approvalsApiListener = createListenerMiddleware();

approvalsApiListener.startListening({
  matcher: isAnyOf(approveStep, rejectStep, returnToSender, resubmit, cancel, addComment),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const { requestId, note } = action.payload as { requestId: string; note?: string };
    if (!UUID.test(requestId)) return;
    const dispatch = listenerApi.dispatch;
    const ep = approvalsApi.endpoints;

    try {
      if (addComment.match(action)) {
        if (!note?.trim()) return;
        await dispatch(
          ep.commentOnApproval.initiate({ id: requestId, body: { message: note.trim() } }),
        ).unwrap();
      } else if (approveStep.match(action) || rejectStep.match(action) || returnToSender.match(action)) {
        const decision = approveStep.match(action)
          ? "approved"
          : rejectStep.match(action)
            ? "rejected"
            : "returned";
        let signatureFileId: string | null = null;
        const signature = approveStep.match(action) ? action.payload.signature : undefined;
        if (signature?.dataUrl) {
          const stored = await dispatch(
            filesApi.endpoints.uploadFile.initiate({
              file: await dataUrlToFile(signature.dataUrl, "approval-signature"),
              purpose: "approvalSignature",
              ownerId: requestId,
            }),
          ).unwrap();
          signatureFileId = stored.data.id;
        }
        await dispatch(
          ep.decideApproval.initiate({
            id: requestId,
            body: { decision, note: note ?? null, signatureFileId },
          }),
        ).unwrap();
      } else if (resubmit.match(action)) {
        await dispatch(ep.resubmitApproval.initiate(requestId)).unwrap();
      } else if (cancel.match(action)) {
        await dispatch(ep.cancelApproval.initiate({ id: requestId })).unwrap();
      }
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          addComment.match(action) ? "Could not post the comment." : "Could not save the decision.",
        ),
      );
      // The mutations refresh on success; a refusal must bring the server's copy back too.
      dispatch(api.util.invalidateTags(["Approvals"]));
    }
  },
});
