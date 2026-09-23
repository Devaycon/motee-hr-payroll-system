"use client";

import { Heart } from "lucide-react";
import { HeroRingCard, chartColor } from "@/src/components/shared/charts";
import { ENGAGEMENT_TREND_DATA } from "@/src/components/hr/surveys/data";

/** "a, b and c" — no Oxford comma; matches the other dashboard summary generators. */
function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

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
  const namedRest = joinAnd(rest.map((s) => `${s.label} at ${s.value}`));

  // Plain sentences rather than "leads / ahead of" competitive framing
  // (client feedback: read like a report, not a ranking).
  const summaryLines = [
    `The latest employee engagement survey shows a company-wide score of ${latest.companyWide}/100.`,
    rest.length > 0
      ? `${top.label} recorded the highest departmental score at ${top.value}, followed by ${namedRest}.`
      : `${top.label} recorded the highest departmental score at ${top.value}.`,
  ];

  return (
    <HeroRingCard
      title="Engagement Score by Department"
      description="Latest monthly survey score, out of 100"
      segments={segments}
      summaryTitle="Employee Engagement Summary"
      summaryIcon={Heart}
      summaryLines={summaryLines}
      variant="gauge"
    />
  );
}
