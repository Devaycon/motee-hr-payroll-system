"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { seedRequests } from "@/src/lib/stores/profile-edits-slice";
import { demoChangeRequests } from "@/src/data/profile-change-requests-demo";

/**
 * Gives an employee with no change history a plausible one.
 *
 * Lives in its own file rather than beside `ChangeLogModule` so that
 * `modules.tsx` can use it too without the two importing each other.
 * The reducer ignores the seed if the employee already has entries, so calling
 * this from both the Profile tab and the Change Log module is safe.
 */
export function useDemoChangeRequests(employeeId: string, fullName: string) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(seedRequests(demoChangeRequests(employeeId, fullName)));
  }, [dispatch, employeeId, fullName]);
}
