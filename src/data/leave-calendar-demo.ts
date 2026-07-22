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

export const COMPANY_SHUTDOWNS: CompanyShutdown[] = [
  { startDate: "2026-12-24", endDate: "2026-12-31", name: "Christmas Shutdown" },
  { startDate: "2026-08-24", endDate: "2026-08-28", name: "Summer Maintenance Week" },
];
