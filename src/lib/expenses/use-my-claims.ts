"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { replaceFromApi } from "@/src/lib/stores/expenses-slice";
import { useGetMyExpenseClaimsQuery } from "@/src/store/services/expenses";
import { toExpenseClaim } from "./api-mapping";

/**
 * Signed in: mirrors your claims (`GET /expenses/claims/mine`) into the
 * expenses store the self-service screens read. Writes go out through
 * `expenses-api-listener`.
 */
export function useMyExpenseClaimsLive(): boolean {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const q = useGetMyExpenseClaimsQuery({ PageSize: 200 }, { skip: !live });
  useEffect(() => {
    const rows = q.data?.data?.items;
    if (!live || !rows) return;
    dispatch(
      replaceFromApi(
        rows.map(toExpenseClaim).sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted)),
      ),
    );
  }, [live, q.data, dispatch]);
  return live;
}
