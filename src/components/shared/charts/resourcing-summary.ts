import { Briefcase } from "lucide-react";

interface RoleCount {
  label: string;
  value: number;
}

const pctOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/**
 * Open roles by department, read as a plain sentence rather than the
 * generic "X is clearly ahead" wording.
 *
 *   There are currently 6 open roles across the organisation.
 *   Engineering & Platform accounts for 3 roles (50%), Other accounts
 *   for 2 (33%), and Customer Experience accounts for 1 (17%).
 *
 *   Engineering & Platform currently represents the largest share of
 *   hiring demand.
 */
export function resourcingSummaryLines(segments: RoleCount[]): string[] {
  const present = segments.filter((s) => s.value > 0);
  const total = present.reduce((n, s) => n + s.value, 0);
  if (total === 0) return ["There are no open roles right now."];

  const sorted = [...present].sort((a, b) => b.value - a.value);
  const parts = sorted.map(
    (s) =>
      `${s.label} accounts for ${s.value.toLocaleString()} role${s.value === 1 ? "" : "s"} (${pctOf(s.value, total)}%)`,
  );
  const composition =
    parts.length === 1
      ? `There ${total === 1 ? "is" : "are"} currently ${total.toLocaleString()} open role${total === 1 ? "" : "s"} across the organisation. ${parts[0]}.`
      : parts.length === 2
        ? `There are currently ${total.toLocaleString()} open roles across the organisation. ${parts[0]}, and ${parts[1]}.`
        : `There are currently ${total.toLocaleString()} open roles across the organisation. ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}.`;

  const top = sorted[0];
  const leader = `${top.label} currently represents the largest share of hiring demand.`;

  return [composition, leader];
}

/** The props that give a `HeroRingCard` the "Hiring Demand Summary" heading and wording above. */
export function resourcingSummaryProps(segments: RoleCount[]) {
  return {
    summaryTitle: "Hiring Demand Summary",
    summaryIcon: Briefcase,
    summaryLines: resourcingSummaryLines(segments),
  };
}
