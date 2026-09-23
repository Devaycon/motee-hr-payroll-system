import { Stethoscope } from "lucide-react";

interface SicknessCount {
  label: string;
  value: number;
}

const pctOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/**
 * Sickness absence by clinical category, read as a plain sentence rather
 * than the generic "X is clearly ahead" wording.
 *
 *   Over the last 12 months, 61 sickness absence days were recorded.
 *   Mental Health accounted for 25 days (41%), Other accounted for 20
 *   days (33%), and Musculoskeletal accounted for 16 days (26%).
 *
 *   Mental Health was the largest contributor to sickness absence,
 *   accounting for 41% of all recorded sick days.
 */
export function sicknessSummaryLines(segments: SicknessCount[]): string[] {
  const present = segments.filter((s) => s.value > 0);
  const total = present.reduce((n, s) => n + s.value, 0);
  if (total === 0) return ["No sickness absence has been recorded in the last 12 months."];

  const sorted = [...present].sort((a, b) => b.value - a.value);
  const parts = sorted.map(
    (s) => `${s.label} accounted for ${s.value.toLocaleString()} days (${pctOf(s.value, total)}%)`,
  );
  const composition =
    parts.length === 1
      ? `Over the last 12 months, ${total.toLocaleString()} sickness absence days were recorded. ${parts[0]}.`
      : parts.length === 2
        ? `Over the last 12 months, ${total.toLocaleString()} sickness absence days were recorded. ${parts[0]}, and ${parts[1]}.`
        : `Over the last 12 months, ${total.toLocaleString()} sickness absence days were recorded. ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}.`;

  const top = sorted[0];
  const leader = `${top.label} was the largest contributor to sickness absence, accounting for ${pctOf(top.value, total)}% of all recorded sick days.`;

  return [composition, leader];
}

/** The props that give a `HeroRingCard` the "Sickness Absence by Clinical Category" heading and wording above. */
export function sicknessSummaryProps(segments: SicknessCount[]) {
  return {
    summaryTitle: "Sickness Absence by Clinical Category",
    summaryIcon: Stethoscope,
    summaryLines: sicknessSummaryLines(segments),
  };
}
