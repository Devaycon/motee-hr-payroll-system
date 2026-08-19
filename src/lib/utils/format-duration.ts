/**
 * Duration and wall-clock formatting.
 *
 * Companion to `format-date.ts`: that file formats *dates*, this one formats
 * *elapsed time* and the "HH:MM" strings the attendance domain stores. These
 * started life inside the employee attendance folder; they are shared now
 * because the clock, the timesheet grid and the HR views all need them.
 *
 * Times here are deliberately 24-hour and locale-independent where they feed
 * stored data — a stored "09:15" must not change shape with the viewer's
 * locale. Only the explicitly-named AMPM helper is for display.
 */

export function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, "0");
}

/** Elapsed seconds as a ticking stopwatch: "07:32:11". */
export function secondsToHHMMSS(s: number): string {
  const safe = Math.max(0, Math.floor(s));
  const hrs = Math.floor(safe / 3600);
  const min = Math.floor((safe % 3600) / 60);
  const sec = safe % 60;
  return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
}

/** Elapsed seconds as a human duration: "7h 32m", "45m", "7h". */
export function secondsToHHMM(s: number): string {
  const safe = Math.max(0, Math.floor(s));
  const hrs = Math.floor(safe / 3600);
  const min = Math.floor((safe % 3600) / 60);
  if (hrs === 0) return `${min}m`;
  if (min === 0) return `${hrs}h`;
  return `${hrs}h ${min}m`;
}

/** Decimal hours as a human duration: 7.75 → "7h 45m". */
export function hoursToHHMM(hours: number): string {
  return secondsToHHMM(Math.round(hours * 3600));
}

/** Display-only 12-hour clock with seconds: "09:15:22 AM". */
export function formatTimeAMPM(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Storage-safe 24-hour "HH:MM" — the shape attendance records hold. */
export function formatTimeHHMM(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Shift an "HH:MM" string by a signed number of minutes, clamped to the day. */
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const total = minutesFromTime(timeStr) + minutes;
  const clamped = Math.min(Math.max(total, 0), 24 * 60 - 1);
  return `${pad(clamped / 60)}:${pad(clamped % 60)}`;
}

/** "09:30" → 570. Returns 0 for anything unparseable. */
export function minutesFromTime(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** A `Date` on the same calendar day as `on`, at the given "HH:MM". */
export function timeOnDate(on: Date, timeStr: string): Date {
  const d = new Date(on);
  const total = minutesFromTime(timeStr);
  d.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return d;
}
