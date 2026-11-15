// Calendar overlays for the Leave module (§15.2 / §15.5).
//
// "Company shutdown" is a new data concept the client asked for — a period when
// the whole organisation is closed (e.g. the Christmas break), distinct from an
// individual's booked leave and from public holidays.

export interface PublicHoliday {
  date: string; // ISO yyyy-mm-dd
  name: string;
}

export interface CompanyShutdown {
  startDate: string; // ISO, inclusive
  endDate: string; // ISO, inclusive
  name: string;
}

/** England & Wales public holidays for the 2026 leave year (UK tenant default). */
export const PUBLIC_HOLIDAYS_2026: PublicHoliday[] = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-05-04", name: "Early May Bank Holiday" },
  { date: "2026-05-25", name: "Spring Bank Holiday" },
  { date: "2026-08-31", name: "Summer Bank Holiday" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-28", name: "Boxing Day (substitute)" },
];

/**
 * Nigerian federal public holidays for 2026 (NG tenant). The Islamic holidays
 * follow the moon and are confirmed by the Federal Government nearer the
 * date, so they're marked provisional.
 */
export const NG_PUBLIC_HOLIDAYS_2026: PublicHoliday[] = [
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-03-20", name: "Eid-el-Fitr (provisional)" },
  { date: "2026-03-23", name: "Eid-el-Fitr holiday (provisional)" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-05-01", name: "Workers' Day" },
  { date: "2026-05-27", name: "Eid-el-Kabir (provisional)" },
  { date: "2026-05-28", name: "Eid-el-Kabir holiday (provisional)" },
  { date: "2026-06-12", name: "Democracy Day" },
  { date: "2026-08-26", name: "Eid-el-Maulud (provisional)" },
  { date: "2026-10-01", name: "Independence Day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-28", name: "Boxing Day (substitute)" },
];

/** Each country's public holidays — pick with `usePublicHolidays()`. */
export const PUBLIC_HOLIDAYS_BY_COUNTRY: Record<"uk" | "ng", PublicHoliday[]> = {
  uk: PUBLIC_HOLIDAYS_2026,
  ng: NG_PUBLIC_HOLIDAYS_2026,
};

export const COMPANY_SHUTDOWNS: CompanyShutdown[] = [
  { startDate: "2026-12-24", endDate: "2026-12-31", name: "Christmas Shutdown" },
  { startDate: "2026-08-24", endDate: "2026-08-28", name: "Summer Maintenance Week" },
];
