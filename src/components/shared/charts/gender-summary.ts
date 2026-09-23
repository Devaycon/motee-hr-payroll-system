import { Users } from "lucide-react";

interface GenderCount {
  label: string;
  value: number;
}

const pctOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/** "a, b and c" — no Oxford comma; used for the ranking sentence. */
function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Two short paragraphs describing a gender breakdown: who makes up the
 * workforce, then how the groups rank. Worded for a person to read, not for a
 * chart legend — "Other" reads as "recorded as Other", and the leader is called
 * out with the groups that follow it.
 *
 *   Across the workforce of 20 employees, 12 (60%) are Male, 6 (30%) are
 *   Female, and 2 (10%) are recorded as Other.
 *
 *   Male employees represent the largest proportion of the workforce at 60%,
 *   followed by Female employees at 30% and Other at 10%.
 */
export function genderSummaryLines(segments: GenderCount[]): string[] {
  const present = segments.filter((s) => s.value > 0);
  const total = present.reduce((n, s) => n + s.value, 0);
  if (total === 0) return ["No gender data has been recorded for the workforce yet."];

  const sorted = [...present].sort((a, b) => b.value - a.value);
  const pct = (s: GenderCount) => pctOf(s.value, total);

  const counts = sorted.map(
    (s) =>
      `${s.value.toLocaleString()} (${pct(s)}%) ${s.label === "Other" ? "are recorded as Other" : `are ${s.label}`}`,
  );
  const composition =
    counts.length === 1
      ? `Across the workforce of ${total.toLocaleString()} employees, all ${counts[0]}.`
      : counts.length === 2
        ? `Across the workforce of ${total.toLocaleString()} employees, ${counts[0]} and ${counts[1]}.`
        : `Across the workforce of ${total.toLocaleString()} employees, ${counts.slice(0, -1).join(", ")}, and ${counts[counts.length - 1]}.`;

  // A tie for the lead is called out as such, not as one group "leading".
  const lead = sorted.filter((s) => s.value === sorted[0].value);
  const rest = sorted.slice(lead.length);
  const leadPct = pct(lead[0]);

  const ranking =
    lead.length === 1
      ? `${lead[0].label} employees represent the largest proportion of the workforce at ${leadPct}%`
      : `${joinAnd(lead.map((s) => s.label))} employees are equally represented, at ${leadPct}% each`;

  const followers = rest.map((s, i) =>
    i === 0 ? `${s.label} employees at ${pct(s)}%` : `${s.label} at ${pct(s)}%`,
  );

  return [
    composition,
    followers.length > 0
      ? `${ranking}, followed by ${joinAnd(followers)}.`
      : `${ranking}.`,
  ];
}

/**
 * The props that give a `HeroRingCard` the "Gender Distribution" summary:
 * title, icon and the wording above.
 */
export function genderSummaryProps(segments: GenderCount[]) {
  return {
    summaryTitle: "Gender Distribution",
    summaryIcon: Users,
    summaryLines: genderSummaryLines(segments),
  };
}
