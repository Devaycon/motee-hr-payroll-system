const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

/** §6.23 — standard reporting bands rather than raw ages. */
export const AGE_BANDS = [
  "Under 25",
  "25–34",
  "35–44",
  "45–54",
  "55–64",
  "65+",
] as const;

export const TENURE_BANDS = ["<1y", "1-3y", "3-5y", "5+y"] as const;

export function ageBand(
  dateOfBirth: string | undefined,
  now: Date = new Date(),
): string | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const age = Math.floor((now.getTime() - dob.getTime()) / MS_PER_YEAR);
  if (age < 25) return "Under 25";
  if (age < 35) return "25–34";
  if (age < 45) return "35–44";
  if (age < 55) return "45–54";
  if (age < 65) return "55–64";
  return "65+";
}

export function tenureYears(startDate: string, now: Date = new Date()): number {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;
  return (now.getTime() - start.getTime()) / MS_PER_YEAR;
}

export function tenureBand(years: number): string {
  if (years < 1) return "<1y";
  if (years < 3) return "1-3y";
  if (years < 5) return "3-5y";
  return "5+y";
}
