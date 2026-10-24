"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, PanelLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/src/components/ui/sheet";
import { cn } from "@/src/lib/utils";
import type { CalEvent } from "@/src/components/shared/calendar";
import { CATEGORY_META, type CalItem, type CalView, type TeamRange } from "./model";
import { isoDay, shiftFor, useCalendarData } from "./use-calendar-data";
import { CalendarSidebar, type TeamKey } from "./sidebar";
import { MonthView } from "./month-view";
import { TimeGrid } from "./time-grid";
import { AgendaView } from "./agenda-view";
import { TeamTimeline } from "./team-timeline";
import { CreateEventDialog, EventDetails, type CreateDraft } from "./dialogs";

const VIEWS: { value: CalView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "agenda", label: "Agenda" },
  { value: "team", label: "Team" },
];

const TEAM_RANGES: { value: TeamRange; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "fortnight", label: "2 weeks" },
  { value: "month", label: "Month" },
];

/** Categories that belong to people's schedules, not the company calendar. */
const PEOPLE_CATEGORIES = new Set(["leave", "leave_request", "cover"]);
const CATEGORY_ORDER = Object.keys(CATEGORY_META);

/**
 * The calendar workspace — one page instead of separate screens. Left: create,
 * mini month, layers, teams, people search and the type legend. Right: one
 * toolbar and the active view (Day / Week / Month / Agenda / Team).
 */
export function CalendarWorkspace({
  companyEvents,
  companyTypes,
  canCreateCompany,
  loading,
}: {
  companyEvents: CalEvent[];
  companyTypes: { value: string; label: string }[];
  canCreateCompany: boolean;
  loading?: boolean;
}) {
  const data = useCalendarData();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // ── URL state (with the old ?view=my|team|reports|person|manager links) ──
  const legacy = params.get("view");
  const legacyId = params.get("id") ?? undefined;
  const rawView = (params.get("v") ?? (legacy === "team" || legacy === "reports" || legacy === "manager" ? "team" : legacy && ["my", "person"].includes(legacy) ? "week" : "month")) as CalView;
  const view: CalView = VIEWS.some((v) => v.value === rawView) ? rawView : "month";
  const dateParam = params.get("date");
  const date = useMemo(() => {
    const parsed = dateParam ? parseISO(dateParam) : new Date();
    return isValid(parsed) ? parsed : new Date();
  }, [dateParam]);
  const subjectId = params.get("person") ?? (legacy === "person" ? legacyId : undefined) ?? data.me;
  const team: TeamKey =
    (params.get("team") as TeamKey | null) ??
    (legacy === "reports" ? "reports" : legacy === "manager" && legacyId ? `mgr:${legacyId}` : "mine");
  const teamRange = (params.get("range") as TeamRange | null) ?? "fortnight";

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    sp.delete("view");
    sp.delete("id");
    for (const [k, v] of Object.entries(next)) {
      if (v == null) sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }
  const setDate = (d: Date) => update({ date: isoDay(d) });

  // ── Local UI state ──
  const [layers, setLayers] = useState<Record<CalItem["layer"], boolean>>({ schedule: true, company: true, holidays: true });
  const [hidden, setHidden] = useState<Set<string>>(() => {
    const only = params.get("type");
    return only ? new Set(CATEGORY_ORDER.filter((c) => c !== only)) : new Set();
  });
  const [openItem, setOpenItem] = useState<CalItem | null>(null);
  const [draft, setDraft] = useState<CreateDraft | null>(null);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const subject = subjectId ? data.byId.get(subjectId) : undefined;
  const isMe = !!subjectId && subjectId === data.me;

  // ── Items ──
  const companyItems = useMemo<CalItem[]>(() => {
    const seen = new Set<string>();
    const out: CalItem[] = [];
    for (const e of companyEvents) {
      if (PEOPLE_CATEGORIES.has(e.type)) continue;
      const key = `${e.date}|${e.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: `co-${e.id}`,
        title: e.title,
        date: e.date,
        startTime: e.allDay ? undefined : e.startTime,
        endTime: e.allDay ? undefined : e.endTime,
        allDay: !!e.allDay || !e.startTime,
        category: e.type,
        layer: e.type === "holiday" ? "holidays" : "company",
        description: e.description,
      });
    }
    for (const h of data.holidayItems) {
      const key = `${h.date}|${h.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(h);
      }
    }
    return [...out, ...data.customCompany];
  }, [companyEvents, data.holidayItems, data.customCompany]);

  const allItems = useMemo<CalItem[]>(
    () => [...(layers.schedule && subjectId ? data.scheduleFor(subjectId) : []), ...companyItems.filter((i) => layers[i.layer])],
    [layers, subjectId, data, companyItems],
  );
  const visible = useMemo(() => allItems.filter((i) => !hidden.has(i.category)), [allItems, hidden]);

  const categories = useMemo(() => {
    const present = new Set(allItems.map((i) => i.category));
    if (view === "team") ["leave", "leave_request", "sickness", "cover"].forEach((c) => present.add(c));
    return [...present].sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
  }, [allItems, view]);

  // ── Range & navigation ──
  const range = useMemo(() => {
    switch (view) {
      case "day":
        return { start: date, end: date };
      case "week":
        return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
      case "month":
        return { start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }) };
      case "agenda":
        return { start: date, end: addDays(date, 29) };
      case "team":
        if (teamRange === "month") return { start: startOfMonth(date), end: endOfMonth(date) };
        return { start: startOfWeek(date, { weekStartsOn: 1 }), end: addDays(startOfWeek(date, { weekStartsOn: 1 }), teamRange === "week" ? 6 : 13) };
    }
  }, [view, date, teamRange]);
  const days = useMemo(() => eachDayOfInterval(range), [range]);

  function step(dir: 1 | -1) {
    const next =
      view === "day" ? addDays(date, dir)
      : view === "week" ? addWeeks(date, dir)
      : view === "month" ? addMonths(date, dir)
      : view === "agenda" ? addDays(date, dir * 30)
      : teamRange === "month" ? addMonths(date, dir)
      : addWeeks(date, dir * (teamRange === "week" ? 1 : 2));
    setDate(next);
  }

  const title =
    view === "day" ? format(date, "EEEE d MMMM yyyy")
    : view === "month" ? format(date, "MMMM yyyy")
    : format(range.start, "MMM yyyy") === format(range.end, "MMM yyyy")
      ? `${format(range.start, "d")} – ${format(range.end, "d MMM yyyy")}`
      : `${format(range.start, "d MMM")} – ${format(range.end, "d MMM yyyy")}`;

  const busyDays = useMemo(() => {
    const set = new Set<string>();
    const from = isoDay(addDays(startOfMonth(date), -7));
    const to = isoDay(addDays(endOfMonth(date), 7));
    for (const i of visible) {
      const end = i.endDate ?? i.date;
      if (end < from || i.date > to) continue;
      let d = parseISO(i.date < from ? from : i.date);
      const last = end > to ? to : end;
      for (let n = 0; n < 62 && isoDay(d) <= last; n++, d = addDays(d, 1)) set.add(isoDay(d));
    }
    return set;
  }, [visible, date]);

  // ── Teams ──
  const teams = useMemo(() => {
    const out: Array<{ key: TeamKey; label: string; count: number }> = [];
    if (data.me) {
      out.push({ key: "mine", label: "My team", count: data.teamOf(data.me).length });
      const reports = data.reportsOf(data.me).length;
      if (reports) out.push({ key: "reports", label: "Reporting to me", count: reports });
    }
    if (team.startsWith("mgr:")) {
      const m = data.byId.get(team.slice(4));
      if (m) out.push({ key: team, label: `${m.fullName}'s team`, count: data.reportsOf(m.id).length });
    }
    return out;
  }, [data, team]);

  const members =
    team === "mine" ? (data.me ? data.teamOf(data.me) : [])
    : team === "reports" ? (data.me ? data.reportsOf(data.me) : [])
    : data.reportsOf(team.slice(4));
  const teamTitle = teams.find((t) => t.key === team)?.label ?? "Team";

  const teamItemsFor = (id: string) =>
    [...data.scheduleFor(id), ...(layers.holidays ? companyItems.filter((i) => i.layer === "holidays") : [])].filter((i) => !hidden.has(i.category));

  const shiftOn = (d: Date) => (layers.schedule ? shiftFor(subject?.workPattern, d) : null);
  const createPeople = view === "team" ? members : [subject, data.me && !isMe ? data.byId.get(data.me) : undefined].filter((x): x is NonNullable<typeof x> => !!x);

  const sidebar = (
    <CalendarSidebar
      date={date}
      onDate={(d) => { setDate(d); setMobileSidebar(false); }}
      range={range}
      busyDays={busyDays}
      onCreate={() => setDraft({ date: isoDay(date) })}
      layers={layers}
      onLayers={setLayers}
      categories={categories}
      hidden={hidden}
      onToggleCategory={(c) => setHidden((h) => { const n = new Set(h); if (n.has(c)) n.delete(c); else n.add(c); return n; })}
      onOnlyCategory={(c) => setHidden(new Set(categories.filter((x) => x !== c)))}
      subject={subject}
      isMe={isMe}
      onSubject={(id) => { update({ person: id && id !== data.me ? id : null, v: view === "team" ? "week" : view }); setMobileSidebar(false); }}
      team={view === "team" ? team : null}
      teams={teams}
      onTeam={(t) => { update({ v: "team", team: t }); setMobileSidebar(false); }}
      employees={data.employees}
      reportCount={(id) => data.reportsOf(id).length}
    />
  );

  if (!data.ready || loading) {
    return (
      <div className="grid h-[calc(100dvh-7.5rem)] min-h-[560px] gap-4 pt-4 lg:grid-cols-[272px_1fr]">
        <Skeleton className="hidden h-full rounded-xl lg:block" />
        <Skeleton className="h-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="pb-4 pt-4">
      {/* Fixed height under the app header; each column scrolls on its own. */}
      <div className="grid h-[calc(100dvh-7.5rem)] min-h-[560px] gap-4 lg:grid-cols-[272px_1fr]">
        <div className="hidden min-h-0 overflow-y-auto rounded-xl border border-border bg-card p-4 lg:block">{sidebar}</div>

        <div className="flex min-h-0 min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-3">
          {/* Toolbar */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 lg:hidden" onClick={() => setMobileSidebar(true)} aria-label="Open calendars">
              <PanelLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-9 rounded-full px-4" onClick={() => setDate(new Date())}>Today</Button>
            <div className="flex">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => step(1)} aria-label="Next"><ChevronRight className="h-5 w-5" /></Button>
            </div>
            <h1 className="mr-auto text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>

            {view === "team" && (
              <Segmented options={TEAM_RANGES} value={teamRange} onChange={(v) => update({ range: v })} />
            )}
            <Segmented options={VIEWS} value={view} onChange={(v) => update({ v })} />
          </div>

          {view !== "team" && subject && !isMe && layers.schedule && (
            <div className="flex shrink-0 items-center justify-between rounded-lg border border-primary/30 bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))] px-3 py-2 text-sm">
              <span>Showing <b>{subject.fullName}</b>&apos;s schedule · {subject.jobTitle}</span>
              <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => update({ person: null })}>Back to my calendar</button>
            </div>
          )}

          <div className="min-h-0 flex-1">
          {view === "month" && (
            <MonthView
              days={days}
              month={date}
              items={visible}
              shiftOn={shiftOn}
              onOpenItem={setOpenItem}
              onOpenDay={(d) => update({ v: "day", date: isoDay(d) })}
              onCreateOn={(d) => setDraft({ date: isoDay(d) })}
            />
          )}
          {(view === "week" || view === "day") && (
            <TimeGrid
              days={days}
              items={visible}
              shiftOn={shiftOn}
              onOpenItem={setOpenItem}
              onOpenDay={(d) => update({ v: "day", date: isoDay(d) })}
              onCreateAt={(d, t) => setDraft({ date: isoDay(d), startTime: t })}
            />
          )}
          {view === "agenda" && <AgendaView days={days} items={visible} onOpenItem={setOpenItem} />}
          {view === "team" && (
            <TeamTimeline
              title={teamTitle}
              members={members}
              days={days}
              itemsFor={teamItemsFor}
              onOpenItem={setOpenItem}
              onOpenPerson={(id) => update({ v: "week", person: id === data.me ? null : id })}
            />
          )}

          </div>

          <Legend categories={categories.filter((c) => !hidden.has(c))} />
        </div>
      </div>

      <Sheet open={mobileSidebar} onOpenChange={setMobileSidebar}>
        <SheetContent side="left" className="w-80 overflow-y-auto bg-card p-4">
          <SheetHeader className="p-0"><SheetTitle>Calendars</SheetTitle></SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <EventDetails item={openItem} onClose={() => setOpenItem(null)} onDelete={data.remove} />
      <CreateEventDialog
        draft={draft}
        onClose={() => setDraft(null)}
        canCreateCompany={canCreateCompany}
        companyTypes={companyTypes}
        people={createPeople}
        me={data.me}
        onCreateCompany={data.addCompany}
        onCreatePersonal={data.addPersonal}
      />
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-full border border-border bg-muted p-0.5" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Legend({ categories }: { categories: string[] }) {
  if (!categories.length) return null;
  return (
    <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
      {categories.map((c) => (
        <span key={c} className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-sm", CATEGORY_META[c]?.swatch ?? "bg-slate-500")} />
          {CATEGORY_META[c]?.label ?? c}
        </span>
      ))}
    </div>
  );
}
