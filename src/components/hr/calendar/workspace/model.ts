/**
 * The calendar workspace's shared model — one item shape for company events,
 * personal events, leave, sickness and holidays, and one colour per category
 * so the legend, the month grid, the week grid and the team timeline agree.
 */

export type CalView = "day" | "week" | "month" | "agenda" | "team";
export type TeamRange = "week" | "fortnight" | "month";

export interface CalItem {
  id: string;
  title: string;
  /** yyyy-MM-dd */
  date: string;
  /** Last day for multi-day items (inclusive). */
  endDate?: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  /** Colour/legend key — see CATEGORY_META. */
  category: string;
  /** Which sidebar layer it belongs to. */
  layer: "schedule" | "company" | "holidays";
  description?: string;
  /** Person the item is about (leave, sickness, personal events). */
  personId?: string;
  personName?: string;
  /** Items the viewer created and may delete. */
  deletable?: "personal" | "company";
  pending?: boolean;
}

export interface CategoryMeta {
  label: string;
  /** Solid swatch for dots, checkboxes and bars. */
  swatch: string;
  /** Solid tinted chip for month/agenda/all-day rows and bars. */
  chip: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  meeting: { label: "Meeting", swatch: "bg-indigo-500", chip: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800" },
  one_to_one: { label: "One-to-one", swatch: "bg-violet-500", chip: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-800" },
  company: { label: "Company", swatch: "bg-blue-600", chip: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800" },
  deadline: { label: "Deadline", swatch: "bg-red-500", chip: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800" },
  reminder: { label: "Reminder", swatch: "bg-amber-500", chip: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800" },
  training: { label: "Training", swatch: "bg-cyan-600", chip: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-800" },
  performance: { label: "Performance", swatch: "bg-emerald-600", chip: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800" },
  holiday: { label: "Public holiday", swatch: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800" },
  birthday: { label: "Birthday", swatch: "bg-pink-500", chip: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-800" },
  anniversary: { label: "Work anniversary", swatch: "bg-fuchsia-500", chip: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-200 dark:border-fuchsia-800" },
  leave: { label: "Leave", swatch: "bg-sky-500", chip: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800" },
  leave_request: { label: "Leave (pending)", swatch: "bg-orange-400", chip: "border-dashed bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800" },
  cover: { label: "Covering", swatch: "bg-teal-500", chip: "border-dashed bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800" },
  sickness: { label: "Sickness", swatch: "bg-rose-500", chip: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800" },
  personal: { label: "My events", swatch: "bg-blue-500", chip: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800" },
};

const FALLBACK: CategoryMeta = {
  label: "Other",
  swatch: "bg-slate-500",
  chip: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-950 dark:text-slate-200 dark:border-slate-800",
};

export function metaFor(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? FALLBACK;
}

export const LAYER_META: Record<CalItem["layer"], { label: string; swatch: string; hint: string }> = {
  schedule: { label: "My schedule", swatch: "bg-blue-500", hint: "Working hours, leave, sickness and my events" },
  company: { label: "Company events", swatch: "bg-indigo-500", hint: "Meetings, deadlines, training, celebrations" },
  holidays: { label: "Public holidays", swatch: "bg-emerald-500", hint: "Bank and public holidays" },
};

export function toMinutes(t?: string): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
}

export function timeLabel(item: CalItem): string {
  if (item.allDay || !item.startTime) return "All day";
  return item.endTime ? `${item.startTime} – ${item.endTime}` : item.startTime;
}

/** Sort: all-day first, then by start time, then title. */
export function byTime(a: CalItem, b: CalItem): number {
  const am = a.allDay ? -1 : (toMinutes(a.startTime) ?? -1);
  const bm = b.allDay ? -1 : (toMinutes(b.startTime) ?? -1);
  return am - bm || a.title.localeCompare(b.title);
}

/** Does a (possibly multi-day) item fall on `iso`? */
export function onDay(item: CalItem, iso: string): boolean {
  return iso >= item.date && iso <= (item.endDate ?? item.date);
}
