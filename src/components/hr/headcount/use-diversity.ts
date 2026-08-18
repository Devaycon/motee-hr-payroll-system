"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  declarationRate,
  diversityCategories,
  tallyWithSuppression,
  type DiversityCategory,
  type Jurisdiction,
  type SuppressedBreakdown,
} from "@/src/lib/types/diversity";

export interface DiversityBreakdown {
  category: DiversityCategory;
  breakdown: SuppressedBreakdown;
}

export interface DiversityReport {
  jurisdiction: Jurisdiction;
  breakdowns: DiversityBreakdown[];
  /** How many of the eligible workforce have answered anything at all. */
  declaredAny: number;
  eligible: number;
  ratePercent: number;
}

/**
 * §6.23 — the aggregate D&I picture.
 *
 * Takes employee ids only so it can count declarations without ever pairing a
 * name to an answer, and runs every category through the small-number
 * suppression before anything reaches a component.
 */
export function useDiversityReport(
  employeeIds: string[],
  eligible: number,
): DiversityReport {
  const declarations = useAppSelector((s) => s.diversity.declarations);
  const country = useAppSelector((s) => s.locale.country);
  const jurisdiction: Jurisdiction = country === "ng" ? "ng" : "uk";

  return useMemo(() => {
    const categories = diversityCategories(jurisdiction);
    const held = employeeIds
      .map((id) => declarations[id])
      .filter((d): d is NonNullable<typeof d> => Boolean(d));

    const breakdowns = categories.map((category) => ({
      category,
      breakdown: tallyWithSuppression(
        held.map((d) => d[category.key]),
        eligible,
      ),
    }));

    const declaredAny = held.length;

    return {
      jurisdiction,
      breakdowns,
      declaredAny,
      eligible,
      ratePercent: declarationRate(declaredAny, eligible),
    };
  }, [declarations, employeeIds, eligible, jurisdiction]);
}
