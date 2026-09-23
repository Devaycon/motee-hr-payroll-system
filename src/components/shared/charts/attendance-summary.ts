import { CalendarCheck } from "lucide-react";

interface AttendanceCount {
  label: string;
  value: number;
}

const pctOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/**
 * The weekly Present/Late/Absent mix, read as a plain HR-report sentence
 * rather than the generic "X is clearly ahead, roughly Nx the size of Y"
 * wording (client feedback: that reads like a competition, not an
 * attendance report).
 *
 *   This week, an average of 16 employees were scheduled per day. Of
 *   these, 11 (69%) were Present, 4 (25%) were Late, and 1 (6%) was
 *   Absent.
 */
export function attendanceSummaryLines(segments: AttendanceCount[]): string[] {
  const present = segments.filter((s) => s.value > 0);
  const total = present.reduce((n, s) => n + s.value, 0);
  if (total === 0) return ["No attendance has been recorded for this period yet."];

  const sorted = [...present].sort((a, b) => b.value - a.value);
  const parts = sorted.map(
    (s) =>
      `${s.value.toLocaleString()} (${pctOf(s.value, total)}%) ${s.value === 1 ? "was" : "were"} ${s.label}`,
  );
  const composition =
    parts.length === 1
      ? `This week, an average of ${total.toLocaleString()} employees were scheduled per day. Of these, all ${parts[0]}.`
      : parts.length === 2
        ? `This week, an average of ${total.toLocaleString()} employees were scheduled per day. Of these, ${parts[0]} and ${parts[1]}.`
        : `This week, an average of ${total.toLocaleString()} employees were scheduled per day. Of these, ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}.`;

  return [
    composition,
    "Absences can be further classified as Sickness Absence, Authorised Absence, or Unauthorised Absence, where applicable.",
  ];
}

/** The props that give a `HeroRingCard` the "Attendance Summary" heading and wording above. */
export function attendanceSummaryProps(segments: AttendanceCount[]) {
  return {
    summaryTitle: "Attendance Summary",
    summaryIcon: CalendarCheck,
    summaryLines: attendanceSummaryLines(segments),
  };
}
