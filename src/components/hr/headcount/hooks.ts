"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { STATUS_LABELS } from "@/src/data/employees-demo";
import { employmentTypeFromName } from "@/src/lib/constants/employment-types";
import {
  attritionFromApi,
  demographicsFromApi,
  periodFromApi,
  periodToApi,
  planFromApi,
} from "@/src/lib/headcount/api-mapping";
import { useLiveDepartments } from "@/src/lib/hooks/use-live-departments";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  ALL_PLAN_PERIODS,
  type AttritionRisk,
  type DemographicsItem,
  type HeadcountPlan,
  type NewHeadcountPlan,
  type PlanPeriod,
} from "@/src/lib/types/headcount";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetHeadcountPlanBoardsQuery } from "@/src/store/services/collections";
import {
  useDeleteHeadcountPlanMutation,
  useGetHeadcountAttritionQuery,
  useGetHeadcountDemographicsQuery,
  useGetHeadcountSeriesQuery,
  useGetHeadcountTrendQuery,
  useSaveHeadcountPlanMutation,
} from "@/src/store/services/headcount";
import type { TrendComparison } from "@/src/types/headcount";
import type { TrendSummary } from "./trends";

/**
 * §6.24 — plans are read for 2025 as well as 2026 so quarter-on-quarter and
 * year-on-year have a baseline. Only 2026 is offered as an editable target.
 */
const PERIODS: PlanPeriod[] = ALL_PLAN_PERIODS;
const API_PERIODS = PERIODS.map(periodToApi);

interface HeadcountData {
  plans: HeadcountPlan[];
  attritionRisks: AttritionRisk[];
  demographics: {
    employmentType: DemographicsItem[];
    tenure: DemographicsItem[];
    department: DemographicsItem[];
    status: DemographicsItem[];
    age: DemographicsItem[];
    gender: DemographicsItem[];
    grade: DemographicsItem[];
    location: DemographicsItem[];
  };
  /** Headcount the D&I breakdowns are a proportion of. */
  eligibleForDeclaration: number;
  /** employeeId list, so declarations can be tallied without naming anyone. */
  employeeIds: string[];
}

const statusByLabel = new Map(
  Object.entries(STATUS_LABELS).map(([k, v]) => [v, k]),
);

export function useHeadcount() {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  const boards = useGetHeadcountPlanBoardsQuery(API_PERIODS);
  const attrition = useGetHeadcountAttritionQuery({ Limit: 200 });
  const demo = useGetHeadcountDemographicsQuery();

  const data = useMemo<HeadcountData | null>(() => {
    if (!boards.data) return null;
    // Only departments with a target are plans; the board also lists the
    // unplanned ones so the gap report can count them.
    const plans = boards.data.flatMap((board, i) => {
      const period = periodFromApi(board.period) ?? PERIODS[i];
      return board.rows
        .filter((row) => row.id && row.target != null)
        .map((row) => planFromApi(row, period));
    });
    const d = demo.data?.data;
    const people = d?.headcount ?? employees?.length ?? 0;
    return {
      plans,
      attritionRisks: (attrition.data?.data ?? []).map(attritionFromApi),
      eligibleForDeclaration: people,
      employeeIds: (employees ?? []).map((e) => e.id),
      demographics: {
        age: demographicsFromApi(d?.age ?? []),
        gender: demographicsFromApi(d?.gender ?? []),
        grade: demographicsFromApi(d?.grade ?? []),
        tenure: demographicsFromApi(d?.tenure ?? []),
        location: demographicsFromApi(d?.location ?? [], (i) =>
          i.branchId
            ? `/organization/employees?branch=${encodeURIComponent(i.branchId)}`
            : undefined,
        ),
        // §6.25 — each segment drills into the matching employee list.
        employmentType: demographicsFromApi(
          d?.employmentType ?? [],
          (i) => `/organization/employees?employmentType=${employmentTypeFromName(i.label)}`,
        ),
        department: demographicsFromApi(
          d?.department ?? [],
          (i) => `/organization/employees?department=${encodeURIComponent(i.label)}`,
        ),
        status: demographicsFromApi(d?.status ?? [], (i) => {
          const slug = statusByLabel.get(i.label);
          return slug ? `/organization/employees?status=${slug}` : undefined;
        }),
      },
    };
  }, [boards.data, attrition.data, demo.data, employees]);

  return {
    data,
    loading: boards.isLoading,
    error: boards.error ? getApiErrorMessage(boards.error) : null,
  };
}

/** The server's movement for one period against the previous quarter or last year. */
export function useServerTrend(
  period: PlanPeriod,
  comparison: TrendComparison,
): TrendSummary | null {
  const { data } = useGetHeadcountTrendQuery({ period: periodToApi(period), comparison });
  return useMemo(() => {
    const t = data?.data;
    if (!t) return null;
    return {
      comparisonPeriod: t.comparisonPeriod ? periodFromApi(t.comparisonPeriod) : null,
      rows: t.rows.map((r) => ({
        department: r.departmentName,
        current: r.current,
        previous: r.previous,
        delta: r.delta,
        pctChange: r.percentChange ?? null,
        target: r.target ?? 0,
      })),
      totalCurrent: t.totalCurrent,
      totalPrevious: t.totalPrevious,
      totalDelta: t.totalDelta,
      totalPctChange: t.totalPercentChange ?? null,
      grew: t.grew,
      shrank: t.shrank,
      flat: t.flat,
    };
  }, [data]);
}

/** Actual against target, quarter by quarter, for the years the trend chart draws. */
export function useServerSeries(years: number[]) {
  const first = useGetHeadcountSeriesQuery({ year: years[0] });
  const second = useGetHeadcountSeriesQuery(
    { year: years[1] ?? years[0] },
    { skip: years.length < 2 },
  );
  return useMemo(() => {
    if (!first.data?.data) return null;
    const points = [...first.data.data, ...(years.length > 1 ? (second.data?.data ?? []) : [])];
    return points
      .map((p) => ({ period: periodFromApi(p.period) ?? p.period, actual: p.actual, target: p.target ?? 0 }))
      .filter((p) => p.period.startsWith("Q"));
  }, [first.data, second.data, years.length]);
}

export function useHeadcountActions() {
  const { idByName } = useLiveDepartments();
  const [save] = useSaveHeadcountPlanMutation();
  const [remove] = useDeleteHeadcountPlanMutation();

  return {
    /** A department has one plan per period, so creating and editing are the same call. */
    save: useCallback(
      async (plan: NewHeadcountPlan | HeadcountPlan) => {
        const departmentId = idByName.get(plan.department);
        if (!departmentId) {
          toast.error(`No department named "${plan.department}"`);
          return false;
        }
        try {
          await save({
            departmentId,
            period: periodToApi(plan.period),
            target: plan.target,
            budget: "budget" in plan ? (plan.budget ?? null) : null,
          }).unwrap();
          return true;
        } catch (err) {
          toast.error(getApiErrorMessage(err, "Could not save the headcount target."));
          return false;
        }
      },
      [idByName, save],
    ),
    remove: useCallback(
      async (id: string) => {
        try {
          await remove(id).unwrap();
          return true;
        } catch (err) {
          toast.error(getApiErrorMessage(err, "Could not remove the plan."));
          return false;
        }
      },
      [remove],
    ),
  };
}
