import { Flag } from "lucide-react";

interface ActionCount {
  label: string;
  value: number;
}

const pctOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/** "a, b and c" — used for the ranking sentence, no Oxford comma. */
function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Open HR action items by severity, read as a plain sentence rather than
 * the generic "X is clearly ahead" wording. Client also asked for the
 * "Priorities" nav tab to be renamed "HR Actions" — see
 * src/components/hr/dashboard/widgets.ts.
 *
 *   There are currently 56 open HR action items. Of these, 25 (45%) are
 *   Warning, 18 (32%) are Critical, and 13 (23%) are Info.
 *
 *   Warning items represent the largest proportion of open actions,
 *   followed by Critical and Info items.
 */
export function hrActionsSummaryLines(segments: ActionCount[]): string[] {
  const present = segments.filter((s) => s.value > 0);
  const total = present.reduce((n, s) => n + s.value, 0);
  if (total === 0) return ["There are no open HR action items right now."];

  const sorted = [...present].sort((a, b) => b.value - a.value);
  const parts = sorted.map(
    (s) =>
      `${s.value.toLocaleString()} (${pctOf(s.value, total)}%) ${s.value === 1 ? "is" : "are"} ${s.label}`,
  );
  const composition =
    parts.length === 1
      ? `There are currently ${total.toLocaleString()} open HR action items. Of these, all ${parts[0]}.`
      : parts.length === 2
        ? `There are currently ${total.toLocaleString()} open HR action items. Of these, ${parts[0]} and ${parts[1]}.`
        : `There are currently ${total.toLocaleString()} open HR action items. Of these, ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}.`;

  const [top, ...rest] = sorted;
  const ranking =
    rest.length > 0
      ? `${top.label} items represent the largest proportion of open actions, followed by ${joinAnd(rest.map((s) => s.label))} items.`
      : `${top.label} items represent all of the open actions.`;

  return [composition, ranking];
}

/** The props that give a `HeroRingCard` the "HR Action Items by Severity" heading and wording above. */
export function hrActionsSummaryProps(segments: ActionCount[]) {
  return {
    summaryTitle: "HR Action Items by Severity",
    summaryIcon: Flag,
    summaryLines: hrActionsSummaryLines(segments),
  };
}
