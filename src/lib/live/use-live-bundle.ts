"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  loadLocale,
  setCountry,
  setLocaleData,
} from "@/src/lib/stores/locale-slice";
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
 * Sections with an endpoint (company, departments, branches, employees,
 * roles) come from the server. Everything else keeps the sample content the
 * approved design shipped with, because those screens are still shown —
 * blurred — until they are integrated.
 */
export function useLiveBundle(): void {
  const dispatch = useAppDispatch();
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const country = useAppSelector((s) => s.locale.country);
  const sample = useAppSelector((s) => s.locale.sample);
  const sampleStatus = useAppSelector((s) => s.locale.status);

  const tenant = useGetTenantLocaleQuery(undefined, { skip });
  const departments = useGetDepartmentsQuery(undefined, { skip });
  const branches = useGetBranchesQuery(undefined, { skip });
  const employees = useGetEmployeeDirectoryQuery(undefined, { skip });
  const accessLevels = useGetAccessLevelsQuery(undefined, { skip });

  // The sample content follows the company's country.
  const tenantCountry = tenant.data?.countryCode;
  useEffect(() => {
    if (tenantCountry) dispatch(setCountry(tenantCountry === "NG" ? "ng" : "uk"));
  }, [tenantCountry, dispatch]);

  useEffect(() => {
    if (!skip && !sample && sampleStatus === "idle") {
      dispatch(loadLocale(country));
    }
  }, [skip, sample, sampleStatus, country, dispatch]);

  const settled =
    !skip &&
    [tenant, departments, branches, employees, accessLevels].every(
      (q) => !q.isLoading && !q.isUninitialized,
    );

  const bundle = useMemo(() => {
    if (!settled || !sample) return null;
    const live = buildLiveBundle({
      tenant: tenant.data,
      departments: departments.data?.data ?? undefined,
      branches: branches.data?.data ?? undefined,
      employees: employees.data,
      accessLevels: accessLevels.data?.data ?? undefined,
    });
    return {
      ...sample,
      _meta: live._meta,
      tenant: live.tenant,
      branches: live.branches,
      departments: live.departments,
      employmentTypes: live.employmentTypes,
      accessLevels: live.accessLevels,
      employees: live.employees,
    };
  }, [
    settled,
    sample,
    tenant.data,
    departments.data,
    branches.data,
    employees.data,
    accessLevels.data,
  ]);

  // Roles drive every permission check, so they are mirrored into the slice
  // the guards, the sidebar and `useCan` already read.
  const levels = accessLevels.data?.data;
  useEffect(() => {
    if (levels) dispatch(setLevels(levels.map(accessLevelFromApi)));
  }, [levels, dispatch]);

  useEffect(() => {
    if (bundle) dispatch(setLocaleData(bundle));
  }, [bundle, dispatch]);
}
