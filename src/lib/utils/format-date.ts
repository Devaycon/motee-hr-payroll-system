/**
 * Canonical date display format for the app: "07 October 2017"
 * (2-digit day, full month name, numeric year).
 *
 * Use for any user-facing date. Do NOT use for `<input type="date">` values,
 * which must stay ISO ("YYYY-MM-DD").
 */
export function formatDate(input: string | number | Date | null | undefined): string {
  if (input === null || input === undefined || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Canonical date-time format: "07 October 2017, 14:30". */
export function formatDateTime(
  input: string | number | Date | null | undefined,
): string {
  if (input === null || input === undefined || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
