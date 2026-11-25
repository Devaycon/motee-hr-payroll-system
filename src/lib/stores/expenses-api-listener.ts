/**
 * Sends the self-service expense screens' actions to your claims on the API
 * (signed in only):
 *
 * - addClaim      → POST /expenses/claims/mine (+ /submit unless a draft)
 * - updateClaim   → PUT  /expenses/claims/mine/{id} (+ /submit when it leaves draft)
 * - withdrawClaim → POST /expenses/claims/mine/{id}/withdraw
 * - deleteClaim   → DELETE /expenses/claims/mine/{id}
 *
 * The claims are re-read afterwards, replacing the local copy. Receipts are
 * not uploaded (the form keeps them in the browser only).
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { expensesApi } from "@/src/store/services/expenses";
import { getApiErrorMessage } from "@/src/lib/utils";
import { addClaim, deleteClaim, updateClaim, withdrawClaim } from "./expenses-slice";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import type { ExpenseClaimRequest } from "@/src/types/expenses";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isServerId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  expenses: { claims: ExpenseClaim[] };
}

function toRequest(c: ExpenseClaim): ExpenseClaimRequest {
  return {
    title: c.title,
    category: c.category as ExpenseClaimRequest["category"],
    amount: c.amount,
    currency: c.currency ?? null,
    merchant: c.merchant,
    incurredOn: (c.dateSubmitted || new Date().toISOString()).slice(0, 10),
    notes: c.notes ?? null,
  };
}

export const expensesApiListener = createListenerMiddleware();

expensesApiListener.startListening({
  matcher: isAnyOf(addClaim, updateClaim, withdrawClaim, deleteClaim),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const before = listenerApi.getOriginalState() as State;
    const dispatch = listenerApi.dispatch;
    const ep = expensesApi.endpoints;

    try {
      if (addClaim.match(action)) {
        const claim = action.payload.claim;
        const res = await dispatch(ep.createMyExpenseClaim.initiate(toRequest(claim))).unwrap();
        if (claim.status !== "draft") {
          await dispatch(ep.submitMyExpenseClaim.initiate(res.data.id)).unwrap();
        }
      } else if (updateClaim.match(action)) {
        const { id } = action.payload;
        if (!isServerId(id)) return;
        const prev = before.expenses.claims.find((c) => c.id === id);
        const next = state.expenses.claims.find((c) => c.id === id);
        if (!next) return;
        if (prev?.status === "draft" || next.status === "draft") {
          await dispatch(ep.updateMyExpenseClaim.initiate({ id, body: toRequest(next) })).unwrap();
        }
        if (prev?.status === "draft" && next.status !== "draft") {
          await dispatch(ep.submitMyExpenseClaim.initiate(id)).unwrap();
        }
      } else if (withdrawClaim.match(action)) {
        const { id } = action.payload;
        if (!isServerId(id)) return;
        await dispatch(ep.withdrawMyExpenseClaim.initiate(id)).unwrap();
      } else if (deleteClaim.match(action)) {
        if (!isServerId(action.payload)) return;
        await dispatch(ep.deleteMyExpenseClaim.initiate(action.payload)).unwrap();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the expense claim."));
    }
    dispatch(api.util.invalidateTags(["ExpenseClaims"]));
  },
});
