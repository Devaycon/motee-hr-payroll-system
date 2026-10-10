"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { setCountry, setLocaleData } from "@/src/lib/stores/locale-slice";
import { setLevels } from "@/src/lib/stores/access-levels-slice";
import { accessLevelFromApi } from "@/src/lib/access-levels/api-mapping";
import { useGetAccessLevelsQuery } from "@/src/store/services/access-levels";
import { useGetBranchesQuery } from "@/src/store/services/branches";
import { useGetDepartmentsQuery } from "@/src/store/services/departments";
import { useGetEmployeeDirectoryQuery } from "@/src/store/services/employee-directory";
import { useGetTenantLocaleQuery } from "@/src/store/services/locale";
import { buildLiveBundle } from "./build-bundle";

/**
 * Keeps `locale.data` in step with the API. Mounted once by each signed-in
 * shell; every screen that reads the bundle then follows the server, and a
 * mutation's cache invalidation is all it takes to refresh them.
 *
 * A section the caller has no permission to read simply comes back empty.
 */
export function useLiveBundle(): void {
  const dispatch = useAppDispatch();
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );

  const tenant = useGetTenantLocaleQuery(undefined, { skip });
  const departments = useGetDepartmentsQuery(undefined, { skip });
  const branches = useGetBranchesQuery(undefined, { skip });
  const employees = useGetEmployeeDirectoryQuery(undefined, { skip });
  const accessLevels = useGetAccessLevelsQuery(undefined, { skip });

  const settled =
    !skip &&
    [tenant, departments, branches, employees, accessLevels].every(
      (q) => !q.isLoading && !q.isUninitialized,
    );

  const bundle = useMemo(
    () =>
      settled
        ? buildLiveBundle({
            tenant: tenant.data,
            departments: departments.data?.data ?? undefined,
            branches: branches.data?.data ?? undefined,
            employees: employees.data,
            accessLevels: accessLevels.data?.data ?? undefined,
          })
        : null,
    [
      settled,
      tenant.data,
      departments.data,
      branches.data,
      employees.data,
      accessLevels.data,
    ],
  );

  // Roles drive every permission check, so they are mirrored into the slice
  // the guards, the sidebar and `useCan` already read.
  const levels = accessLevels.data?.data;
  useEffect(() => {
    if (levels) dispatch(setLevels(levels.map(accessLevelFromApi)));
  }, [levels, dispatch]);

  useEffect(() => {
    if (!bundle) return;
    dispatch(setCountry(bundle.tenant.countryCode === "NG" ? "ng" : "uk"));
    dispatch(setLocaleData(bundle));
  }, [bundle, dispatch]);
}
