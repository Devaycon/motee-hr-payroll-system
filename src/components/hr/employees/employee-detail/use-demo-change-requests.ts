"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import {
  replaceRequestsFromApi,
  seedRequests,
} from "@/src/lib/stores/profile-edits-slice";
import { demoChangeRequests } from "@/src/data/profile-change-requests-demo";
import { useIsLive, useMyEmployeeId } from "@/src/lib/live/use-is-live";
import { changeRequestsFromApi } from "@/src/lib/profile/change-request-mapping";
import {
  useGetEmployeeChangeRequestsQuery,
  useGetMyChangeRequestsQuery,
} from "@/src/store/services/change-requests";

/**
 * Fills an employee's Profile Change Request Log.
 *
 * Signed in, it is the server's log: your own from
 * `GET /employees/me/change-requests`, anyone else's (HR) from
 * `GET /employees/{id}/change-requests`. Signed out, an employee with no
 * change history is given a plausible one, as in the demo.
 *
 * Lives in its own file rather than beside `ChangeLogModule` so that
 * `modules.tsx` can use it too without the two importing each other. Calling
 * it from several modules at once is safe: the reads are shared, and the demo
 * seed is ignored for an employee who already has entries.
 */
export function useDemoChangeRequests(employeeId: string, fullName: string) {
  const dispatch = useAppDispatch();
  const live = useIsLive();
  const me = useMyEmployeeId();
  const own = live && !!me && employeeId === me;

  const mine = useGetMyChangeRequestsQuery(undefined, { skip: !own });
  const theirs = useGetEmployeeChangeRequestsQuery(employeeId, {
    skip: !live || own || !employeeId,
  });
  const rows = (own ? mine.data : theirs.data)?.data;

  useEffect(() => {
    if (live) return;
    dispatch(seedRequests(demoChangeRequests(employeeId, fullName)));
  }, [dispatch, live, employeeId, fullName]);

  useEffect(() => {
    if (!live || !rows) return;
    dispatch(
      replaceRequestsFromApi({ employeeId, requests: changeRequestsFromApi(rows) }),
    );
  }, [dispatch, live, employeeId, rows]);
}
