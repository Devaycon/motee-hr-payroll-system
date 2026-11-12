"use client";

import { useMemo } from "react";
import { periodFromApi } from "@/src/lib/headcount/api-mapping";
import type {
  HiringMetric,
  TurnoverPeriod,
  TurnoverRecord,
} from "@/src/lib/types/workforce";
import {
  useGetHeadcountAttritionQuery,
  useGetHeadcountDemographicsQuery,
} from "@/src/store/services/headcount";
import {
  useGetWorkforceHiringQuery,
  useGetWorkforceOverviewQuery,
  useGetWorkforceTurnoverQuery,
} from "@/src/store/services/workforce";
import { attritionFromApi } from "@/src/lib/headcount/api-mapping";

interface WorkforceOverview {
  totalHeadcount: number;
  avgTenureYears: number;
  openVacancies: number;
  /** Rolling twelve-month rate, when the server has enough history. */
  turnoverRatePercent: number | null;
  leaversLastTwelveMonths: number;
}

export function useWorkforceOverview() {
  const { data, isLoading } = useGetWorkforceOverviewQuery();
  const overview = useMemo<WorkforceOverview | null>(() => {
    const d = data?.data;
    if (!d) return null;
    return {
      totalHeadcount: d.headcount,
      avgTenureYears: Math.round(d.averageTenureYears * 10) / 10,
      openVacancies: d.openVacancies,
      turnoverRatePercent: d.turnoverRatePercent ?? null,
      leaversLastTwelveMonths: d.leaversLastTwelveMonths,
    };
  }, [data]);
  return { data: overview, loading: isLoading };
}

/** The years the turnover periods cover (see TURNOVER_PERIODS). */
const TURNOVER_YEARS = [2025, 2026];

/** Leavers per department per quarter, for the turnover tab and its trend. */
export function useTurnoverRecords(): TurnoverRecord[] {
  const first = useGetWorkforceTurnoverQuery({ Year: TURNOVER_YEARS[0] });
  const second = useGetWorkforceTurnoverQuery({ Year: TURNOVER_YEARS[1] });
  return useMemo(
    () =>
      [...(first.data?.data ?? []), ...(second.data?.data ?? [])].flatMap((row, i) => {
        const period = periodFromApi(row.period);
        // Only department rows for a quarter: company totals would double-count.
        if (!period?.startsWith("Q") || !row.departmentName) return [];
        return [
          {
            id: `${row.departmentId ?? i}:${row.period}`,
            period: period as TurnoverPeriod,
            department: row.departmentName,
            totalHeadcount: Math.round(row.averageHeadcount),
            voluntary: row.voluntary,
            // Exits with no recorded reason are counted with the involuntary ones.
            involuntary: row.involuntary + row.unclassified,
          },
        ];
      }),
    [first.data, second.data],
  );
}

/** Hiring velocity per department over the last quarter. */
export function useHiringMetrics(): HiringMetric[] {
  const { data } = useGetWorkforceHiringQuery({ Months: 3 });
  return useMemo(
    () =>
      (data?.data ?? []).map((row) => ({
        id: row.departmentId,
        department: row.departmentName,
        openRequisitions: row.openRequisitions,
        avgDaysToFill: Math.round(row.averageDaysToFill ?? 0),
        offersExtended: row.offersExtended,
        offersAccepted: row.offersAccepted,
        filledThisQuarter: row.filledThisQuarter,
      })),
    [data],
  );
}

/** Flight-risk employees, as Headcount Planning scores them. */
export function useAttritionRisks() {
  const { data } = useGetHeadcountAttritionQuery({ Limit: 200 });
  return useMemo(() => (data?.data ?? []).map(attritionFromApi), [data]);
}

type Slice = { label: string; count: number; percentage: number }[];

/** The workforce breakdowns, from the same server figures as Headcount Planning. */
export function useWorkforceDemographics(): {
  gender: Slice;
  ageGroup: Slice;
  employmentType: Slice;
  tenure: Slice;
} | null {
  const { data } = useGetHeadcountDemographicsQuery();
  return useMemo(() => {
    const d = data?.data;
    if (!d) return null;
    const pick = (items: typeof d.gender) =>
      items.map((i) => ({ label: i.label, count: i.count, percentage: Math.round(i.percentage) }));
    return {
      gender: pick(d.gender),
      ageGroup: pick(d.age),
      employmentType: pick(d.employmentType),
      tenure: pick(d.tenure),
    };
  }, [data]);
}
