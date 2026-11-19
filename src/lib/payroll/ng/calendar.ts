// Nigerian working-day calendar for payroll: pay days and remittance deadlines.
//
// Salaries are paid on the last working day on or before the scheduled pay
// day, so a 25th that falls on a weekend or a public holiday (25 Dec is
// Christmas Day) moves back, never forward.

import { NG_PUBLIC_HOLIDAYS_2026, type PublicHoliday } from "@/src/data/leave-calendar-demo";

const DAY = 86_400_000;
const toDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const ymd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Easter Sunday (Gregorian, anonymous algorithm). */
function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const cache = new Map<number, PublicHoliday[]>();

/**
 * Federal public holidays for a year. 2026 uses the published list the leave
 * module shows (with the provisional Islamic dates); other years fall back to
 * the fixed-date and Easter holidays, each moved to the next working day when
 * it lands on a weekend.
 */
export function ngPublicHolidays(year: number): PublicHoliday[] {
  const hit = cache.get(year);
  if (hit) return hit;
  let list: PublicHoliday[];
  if (year === 2026) {
    list = NG_PUBLIC_HOLIDAYS_2026;
  } else {
    const fixed: PublicHoliday[] = [
      { date: ymd(year, 1, 1), name: "New Year's Day" },
      { date: ymd(year, 5, 1), name: "Workers' Day" },
      { date: ymd(year, 6, 12), name: "Democracy Day" },
      { date: ymd(year, 10, 1), name: "Independence Day" },
      { date: ymd(year, 12, 25), name: "Christmas Day" },
      { date: ymd(year, 12, 26), name: "Boxing Day" },
    ];
    const taken = new Set(fixed.map((h) => h.date));
    list = [];
    for (const h of fixed) {
      const d = toDate(h.date);
      const dow = d.getUTCDay();
      if (dow !== 0 && dow !== 6) {
        list.push(h);
        continue;
      }
      // Weekend holiday → the next weekday not already a holiday.
      let t = d.getTime();
      do t += DAY;
      while ([0, 6].includes(new Date(t).getUTCDay()) || taken.has(iso(new Date(t))));
      taken.add(iso(new Date(t)));
      list.push({ date: iso(new Date(t)), name: `${h.name} (substitute)` });
    }
    const e = easter(year).getTime();
    list.push({ date: iso(new Date(e - 2 * DAY)), name: "Good Friday" }, { date: iso(new Date(e + DAY)), name: "Easter Monday" });
    list.sort((a, b) => a.date.localeCompare(b.date));
  }
  cache.set(year, list);
  return list;
}

export function holidayOn(date: string): PublicHoliday | undefined {
  return ngPublicHolidays(Number(date.slice(0, 4))).find((h) => h.date === date.slice(0, 10));
}

export function isWorkingDay(date: string): boolean {
  const dow = toDate(date).getUTCDay();
  return dow !== 0 && dow !== 6 && !holidayOn(date);
}

/** Why a day isn't worked ("Sunday", "Christmas Day"), or null on a working day. */
export function nonWorkingReason(date: string): string | null {
  const h = holidayOn(date);
  if (h) return h.name;
  const dow = toDate(date).getUTCDay();
  return dow === 0 ? "Sunday" : dow === 6 ? "Saturday" : null;
}

/** The date itself when worked, otherwise the closest working day before it. */
export function previousWorkingDay(date: string): string {
  let t = toDate(date).getTime();
  while (!isWorkingDay(iso(new Date(t)))) t -= DAY;
  return iso(new Date(t));
}

/** `n` working days after `date` (the date itself doesn't count). */
export function addWorkingDays(date: string, n: number): string {
  let t = toDate(date).getTime();
  let added = 0;
  while (added < n) {
    t += DAY;
    if (isWorkingDay(iso(new Date(t)))) added++;
  }
  return iso(new Date(t));
}
