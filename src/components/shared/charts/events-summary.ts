import { CalendarDays } from "lucide-react";

interface EventCount {
  label: string;
  value: number;
}

const pctOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/** Simple English pluralisation — good enough for event-type labels like "Anniversary"/"Meeting". */
function pluralize(label: string, count: number): string {
  if (count === 1) return label;
  if (/[^aeiou]y$/i.test(label)) return `${label.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(label)) return `${label}es`;
  return `${label}s`;
}

/**
 * The week's event-type mix, read as a plain sentence rather than the
 * generic "X is clearly ahead" wording.
 *
 *   Over the next 7 days, there are 3 upcoming events: 2 Anniversaries
 *   (67%) and 1 Meeting (33%).
 *
 *   Anniversaries account for the majority of scheduled events during
 *   this period.
 */
export function eventsSummaryLines(segments: EventCount[]): string[] {
  const present = segments.filter((s) => s.value > 0);
  const total = present.reduce((n, s) => n + s.value, 0);
  if (total === 0) return ["There are no events on the calendar over the next 7 days."];

  const sorted = [...present].sort((a, b) => b.value - a.value);
  const parts = sorted.map(
    (s) => `${s.value.toLocaleString()} ${pluralize(s.label, s.value)} (${pctOf(s.value, total)}%)`,
  );
  const list =
    parts.length <= 2
      ? parts.join(" and ")
      : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  const composition = `Over the next 7 days, there ${total === 1 ? "is" : "are"} ${total.toLocaleString()} upcoming event${total === 1 ? "" : "s"}: ${list}.`;

  const top = sorted[0];
  const topLabel = pluralize(top.label, 2);
  const leader =
    sorted.length === 1
      ? `${topLabel} account for all scheduled events during this period.`
      : pctOf(top.value, total) >= 50
        ? `${topLabel} account for the majority of scheduled events during this period.`
        : `${topLabel} were the most common event type over this period.`;

  return [composition, leader];
}

/** The props that give a `HeroRingCard` the "Upcoming Events Summary" heading and wording above. */
export function eventsSummaryProps(segments: EventCount[]) {
  return {
    summaryTitle: "Upcoming Events Summary",
    summaryIcon: CalendarDays,
    summaryLines: eventsSummaryLines(segments),
  };
}
