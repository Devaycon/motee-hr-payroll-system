"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Check, ChevronLeft, ChevronRight, Plus, Search, UserRound, Users, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { cn } from "@/src/lib/utils";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { LAYER_META, metaFor, type CalItem } from "./model";
import { isoDay } from "./use-calendar-data";

export type TeamKey = "mine" | "reports" | `mgr:${string}`;

interface SidebarProps {
  date: Date;
  onDate: (d: Date) => void;
  /** Range the main view shows — shaded in the mini month. */
  range: { start: Date; end: Date };
  busyDays: Set<string>;
  onCreate: () => void;
  layers: Record<CalItem["layer"], boolean>;
  onLayers: (l: Record<CalItem["layer"], boolean>) => void;
  categories: string[];
  hidden: Set<string>;
  onToggleCategory: (c: string) => void;
  onOnlyCategory: (c: string) => void;
  subject: LocaleEmployee | undefined;
  isMe: boolean;
  onSubject: (id: string | null) => void;
  team: TeamKey | null;
  teams: Array<{ key: TeamKey; label: string; count: number }>;
  onTeam: (t: TeamKey) => void;
  employees: LocaleEmployee[];
  reportCount: (id: string) => number;
}

export function CalendarSidebar(p: SidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-5 text-sm">
      <Button onClick={p.onCreate} className="h-10 w-full justify-start gap-2 rounded-full shadow-sm">
        <Plus className="h-4 w-4" /> Create
      </Button>

      <MiniMonth date={p.date} onDate={p.onDate} range={p.range} busyDays={p.busyDays} />

      <PeopleSearch employees={p.employees} reportCount={p.reportCount} onPerson={(id) => p.onSubject(id)} onTeam={(id) => p.onTeam(`mgr:${id}`)} />

      <Section title="My calendars">
        {p.subject && !p.isMe && (
          <div className="mb-1 flex items-center gap-2 rounded-lg border border-primary/30 bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))] px-2 py-1.5">
            <PersonAvatar name={p.subject.fullName} initials={p.subject.initials} gender={p.subject.gender} className="size-5" fallbackClassName="text-[8px]" />
            <span className="min-w-0 flex-1 truncate text-xs">
              Viewing <b>{p.subject.firstName}</b>&apos;s schedule
            </span>
            <button type="button" onClick={() => p.onSubject(null)} className="text-muted-foreground hover:text-foreground" aria-label="Back to my calendar">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {(Object.keys(LAYER_META) as CalItem["layer"][]).map((l) => (
          <Toggle
            key={l}
            on={p.layers[l]}
            swatch={LAYER_META[l].swatch}
            label={l === "schedule" && p.subject && !p.isMe ? `${p.subject.firstName}'s schedule` : LAYER_META[l].label}
            hint={LAYER_META[l].hint}
            onClick={() => p.onLayers({ ...p.layers, [l]: !p.layers[l] })}
          />
        ))}
      </Section>

      {p.teams.length > 0 && (
        <Section title="Teams">
          {p.teams.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => p.onTeam(t.key)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                p.team === t.key ? "bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))] font-medium text-primary" : "hover:bg-muted",
              )}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{t.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{t.count}</span>
            </button>
          ))}
        </Section>
      )}

      {p.categories.length > 0 && (
        <Section title="Event types">
          {p.categories.map((c) => (
            <div key={c} className="group flex items-center">
              <Toggle on={!p.hidden.has(c)} swatch={metaFor(c).swatch} label={metaFor(c).label} onClick={() => p.onToggleCategory(c)} />
              <button
                type="button"
                onClick={() => p.onOnlyCategory(c)}
                className="ml-auto hidden shrink-0 px-1 text-[10px] font-medium text-primary group-hover:block"
              >
                Only
              </button>
            </div>
          ))}
        </Section>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

function Toggle({ on, swatch, label, hint, onClick }: { on: boolean; swatch: string; label: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={hint} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-muted">
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2", on ? cn(swatch, "border-transparent text-white") : "border-muted-foreground/40")}>
        {on && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className={cn("truncate", !on && "text-muted-foreground")}>{label}</span>
    </button>
  );
}

function MiniMonth({ date, onDate, range, busyDays }: { date: Date; onDate: (d: Date) => void; range: { start: Date; end: Date }; busyDays: Set<string> }) {
  // The mini month follows the main view, but can be paged on its own.
  const [offset, setOffset] = useState(0);
  const [lastDate, setLastDate] = useState(date);
  if (!isSameDay(lastDate, date)) {
    setLastDate(date);
    setOffset(0);
  }
  const month = addMonths(startOfMonth(date), offset);
  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(month, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) }),
    [month],
  );
  const today = new Date();
  const rs = isoDay(range.start);
  const re = isoDay(range.end);
  return (
    <div className="px-1">
      <div className="mb-1 flex items-center justify-between">
        <span className="pl-1 text-sm font-semibold">{format(month, "MMMM yyyy")}</span>
        <div className="flex">
          <button type="button" aria-label="Previous month" onClick={() => setOffset((o) => o - 1)} className="rounded-full p-1 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Next month" onClick={() => setOffset((o) => o + 1)} className="rounded-full p-1 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-medium text-muted-foreground">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
        {days.map((d) => {
          const iso = isoDay(d);
          const inRange = iso >= rs && iso <= re;
          const selected = isSameDay(d, date);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onDate(d)}
              className={cn(
                "relative mx-auto flex h-7 w-7 items-center justify-center rounded-full tabular-nums transition-colors",
                !isSameMonth(d, month) && "text-muted-foreground/50",
                inRange && !selected && "bg-[color-mix(in_oklab,var(--primary)_9%,var(--card))]",
                isToday && !selected && "font-bold text-primary",
                selected ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {format(d, "d")}
              {busyDays.has(iso) && !selected && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeopleSearch({
  employees,
  reportCount,
  onPerson,
  onTeam,
}: {
  employees: LocaleEmployee[];
  reportCount: (id: string) => number;
  onPerson: (id: string) => void;
  onTeam: (managerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const managers = employees.filter((e) => reportCount(e.id) > 0);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm text-muted-foreground hover:border-primary/40">
          <Search className="h-4 w-4" /> Find people or teams
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search by name, role or department…" />
          <CommandList className="max-h-80">
            <CommandEmpty>No one found.</CommandEmpty>
            <CommandGroup heading="People — open their schedule">
              {employees.map((e) => (
                <CommandItem key={e.id} value={`person ${e.fullName} ${e.jobTitle} ${e.departmentName}`} onSelect={() => { onPerson(e.id); setOpen(false); }} className="gap-2">
                  <PersonAvatar name={e.fullName} initials={e.initials} gender={e.gender} className="size-6" fallbackClassName="text-[9px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{e.fullName}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{e.jobTitle}</span>
                  </span>
                  <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Teams — everyone reporting to a manager">
              {managers.map((e) => (
                <CommandItem key={e.id} value={`team ${e.fullName} ${e.departmentName}`} onSelect={() => { onTeam(e.id); setOpen(false); }} className="gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm">{e.fullName}&apos;s team</span>
                  <span className="text-[11px] text-muted-foreground">{reportCount(e.id)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

