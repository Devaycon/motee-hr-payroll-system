"use client";

import { HeroRingCard, chartColor } from "@/src/components/shared/charts";
import { ENGAGEMENT_TREND_DATA } from "@/src/components/hr/surveys/data";

const DEPT_LABELS = {
  engineering: "Engineering",
  marketing: "Marketing",
  sales: "Sales",
  hr: "HR",
  operations: "Operations",
} as const;

type DeptKey = keyof typeof DEPT_LABELS;

/** How many departments `HeroRingCard` will actually draw a dial for — the summary below is written to match. */
const SHOWN = 3;

/**
 * The Engagement tab's hero card. Unlike the other tabs, department scores
 * aren't parts of one whole (each is its own 0–100 survey result), so every
 * gauge is read against a fixed 100 rather than the sum of the others, and
 * the summary is written directly instead of the shared share-of-total prose
 * (which would wrongly imply the scores add up to something). With five
 * departments and a three-dial cap, `HeroRingCard` keeps only the top three
 * by score — the summary below is computed the same way so the prose never
 * names a department that isn't on screen.
 */
export function EngagementHeroRing() {
  const latest = ENGAGEMENT_TREND_DATA[ENGAGEMENT_TREND_DATA.length - 1];
  if (!latest) return null;

  const deptKeys = Object.keys(DEPT_LABELS) as DeptKey[];
  const segments = deptKeys.map((key, i) => ({
    key,
    label: DEPT_LABELS[key],
    value: latest[key],
    color: chartColor(i),
    total: 100,
  }));

  const shown = [...segments].sort((a, b) => b.value - a.value).slice(0, SHOWN);
  const [top, ...rest] = shown;
  const namedRest = rest.map((s) => `${s.label} at ${s.value}`).join(" and ");

  const summaryLines = [
    `Each gauge shows a department's engagement score out of 100, from the latest (${latest.month}) survey cycle — the three highest-scoring teams.`,
    `${top.label} leads at ${top.value}, ahead of ${namedRest}.`,
    `Company-wide engagement stands at ${latest.companyWide}/100 this month.`,
  ];

  return (
    <HeroRingCard
      title="Engagement Score by Department"
      description="Latest monthly survey score, out of 100"
      segments={segments}
      summaryLines={summaryLines}
      variant="gauge"
    />
  );
}
