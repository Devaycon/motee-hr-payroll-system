"use client";

import { useMemo, useState } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  Flag,
  GraduationCap,
  Package,
  Plane,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { cn } from "@/src/lib/utils";
import { personPhotoUrl } from "@/src/lib/utils/avatar";
import { useProfileVariant } from "./variant";
import { useGoToModule } from "./module-navigation";
import { useDemoChangeRequests } from "./use-demo-change-requests";
import {
  Empty,
  LoadingPanel,
  Pill,
  Section,
  StatStrip,
  StatusBadge,
  fmtDate,
  formatDuration,
} from "./ui";
import type { ModuleProps } from "./modules";
import {
  TIMELINE_WINDOW_MONTHS,
  formatMonth,
  monthKeyOf,
  monthsBetween,
  shiftMonth,
  useEmployeeTimeline,
  type TimelineCategory,
  type TimelineEvent,
} from "./timeline-data";

const CATEGORIES: Record<
  TimelineCategory,
  { label: string; icon: LucideIcon; tone: string; dot: string }
> = {
  milestone: {
    label: "Milestones",
    icon: Flag,
    tone: "border-primary/30 bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  kudos: {
    label: "Kudos",
    icon: Award,
    tone: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    dot: "bg-amber-500",
  },
  profile: {
    label: "Profile & docs",
    icon: FileText,
    tone: "border-blue-500/30 bg-blue-500/10 text-blue-600",
    dot: "bg-blue-500",
  },
  leave: {
    label: "Leave",
    icon: Plane,
    tone: "border-sky-500/30 bg-sky-500/10 text-sky-600",
    dot: "bg-sky-500",
  },
  growth: {
    label: "Growth",
    icon: GraduationCap,
    tone: "border-violet-500/30 bg-violet-500/10 text-violet-600",
    dot: "bg-violet-500",
  },
  assets: {
    label: "Assets",
    icon: Package,
    tone: "border-slate-400/30 bg-slate-400/10 text-slate-500",
    dot: "bg-slate-400",
  },
  pay: {
    label: "Pay",
    icon: Coins,
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    dot: "bg-emerald-500",
  },
};

const CATEGORY_ORDER: TimelineCategory[] = [
  "milestone",
  "kudos",
  "profile",
  "leave",
  "growth",
  "assets",
  "pay",
];

/** Where an entry's full record lives — kept local to avoid importing the registry. */
const MODULE_LABELS: Record<string, string> = {
  history: "Employment History",
  job: "Job",
  kudos: "Kudos",
  "change-log": "Change Log",
  documents: "Documents",
  leave: "Leave",
  learn: "Learning",
  training: "Certifications",
  performance: "Performance",
  assets: "Assets",
  compensation: "Compensation",
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

function EventCard({ event }: { event: TimelineEvent }) {
  const meta = CATEGORIES[event.category];
  const Icon = meta.icon;
  const goToModule = useGoToModule();
  const openLabel = MODULE_LABELS[event.module];
  const photo = event.person ? personPhotoUrl(event.person) : undefined;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-blue-500">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border",
              meta.tone,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              {event.tag && (
                <Pill className="border-primary/30 bg-primary/10 text-primary">
                  {event.tag}
                </Pill>
              )}
              {event.status && <StatusBadge status={event.status} />}
            </div>
            {event.detail && (
              <p className="mt-0.5 text-xs text-muted-foreground wrap-break-word">
                {event.detail}
              </p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
          {fmtDate(event.date)}
        </span>
      </div>

      {event.person && (
        <div className="mt-2 flex items-center gap-2 pl-8.5">
          <Avatar className="h-6 w-6">
            {photo && <AvatarImage src={photo} alt="" />}
            <AvatarFallback className="text-[9px]">
              {initialsOf(event.person)}
            </AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-xs font-medium text-foreground">{event.person}</p>
            {event.personRole && (
              <p className="text-[10px] text-muted-foreground">
                {event.personRole}
              </p>
            )}
          </div>
        </div>
      )}

      {event.quote && (
        <p className="mt-2 border-l-2 border-border pl-3 text-xs italic text-muted-foreground wrap-break-word">
          &ldquo;{event.quote}&rdquo;
        </p>
      )}

      {goToModule && openLabel && (
        <button
          type="button"
          onClick={() => goToModule(event.module)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          Open in {openLabel}
          <ArrowUpRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/**
 * The employee's journey on one spine — milestones, kudos, profile changes,
 * leave, growth, assets and pay, newest first.
 *
 * Shows a five-month window at a time and pages backwards from there, all the
 * way to the month they were onboarded, so a long-serving record stays
 * readable instead of rendering years of entries at once.
 */
export function TimelineModule({ employeeId, employee }: ModuleProps) {
  const variant = useProfileVariant();
  useDemoChangeRequests(employeeId, employee.fullName);
  const { data, loading } = useEmployeeTimeline(employeeId, employee);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<TimelineCategory | "all">("all");

  const view = useMemo(() => {
    if (!data) return null;
    const span = Math.max(
      0,
      monthsBetween(data.earliestMonth, data.latestMonth),
    );
    const maxPage = Math.floor(span / TIMELINE_WINDOW_MONTHS);
    const safePage = Math.min(page, maxPage);
    const end = shiftMonth(data.latestMonth, -safePage * TIMELINE_WINDOW_MONTHS);
    const start = shiftMonth(end, -(TIMELINE_WINDOW_MONTHS - 1));
    const inWindow = data.events.filter((e) => {
      const m = monthKeyOf(e.date);
      return m >= start && m <= end;
    });
    const months = Array.from({ length: TIMELINE_WINDOW_MONTHS }, (_, i) =>
      shiftMonth(end, -i),
    ).filter((m) => m >= data.earliestMonth);
    return { maxPage, page: safePage, start, end, inWindow, months };
  }, [data, page]);

  if (loading && !data) return <LoadingPanel />;
  if (!data || !view) return <Empty label="No timeline yet." />;

  const matching =
    filter === "all"
      ? data.events
      : data.events.filter((e) => e.category === filter);
  const shown = matching.filter((e) => {
    const m = monthKeyOf(e.date);
    return m >= view.start && m <= view.end;
  });

  /**
   * Where to send someone whose window came up empty: the next entry *older*
   * than it, so paging back through a long, sparse record doesn't mean
   * clicking "Older" through years of quiet months. Falls back to the newest
   * entry when there's nothing further back.
   */
  const jumpTarget = (() => {
    const match =
      matching.find((e) => monthKeyOf(e.date) < view.start) ?? matching[0];
    if (!match) return null;
    const distance = monthsBetween(monthKeyOf(match.date), data.latestMonth);
    return {
      page: Math.floor(distance / TIMELINE_WINDOW_MONTHS),
      date: match.date,
    };
  })();

  const counts = CATEGORY_ORDER.map((c) => ({
    category: c,
    total: view.inWindow.filter((e) => e.category === c).length,
  }));

  const who = variant.audience === "employee" ? "Your" : `${employee.fullName}'s`;

  const pager = (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => setPage(view.page + 1)}
        disabled={view.page >= view.maxPage}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Older
      </Button>
      <span className="px-1 text-xs font-medium text-foreground whitespace-nowrap tabular-nums">
        {formatMonth(view.start)} – {formatMonth(view.end)}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => setPage(Math.max(0, view.page - 1))}
        disabled={view.page === 0}
      >
        Newer
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <Section
      title="Timeline"
      description={`${who} journey so far — ${TIMELINE_WINDOW_MONTHS} months at a time, back to day one.`}
      action={pager}
    >
      {/* Whole-journey snapshot — independent of the window being viewed. */}
      <StatStrip
        items={[
          {
            label: "At the company",
            value: formatDuration(data.joinedDate),
            accent: "text-primary",
          },
          {
            label: "Entries on record",
            value: data.events.length,
            onClick: () => {
              setFilter("all");
              setPage(0);
            },
            ariaLabel: `${data.events.length} timeline entries — show all`,
          },
          ...(["milestone", "kudos", "growth", "profile"] as TimelineCategory[]).map(
            (c) => ({
              label: CATEGORIES[c].label,
              value: data.events.filter((e) => e.category === c).length,
              onClick: () => {
                setFilter(c);
                setPage(0);
              },
              ariaLabel: `${CATEGORIES[c].label} — filter the timeline`,
            }),
          ),
        ]}
      />

      {/* Category filters, counted within the window on screen. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
            filter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          All ({view.inWindow.length})
        </button>
        {counts.map(({ category, total }) => {
          const meta = CATEGORIES[category];
          const Icon = meta.icon;
          const active = filter === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(active ? "all" : category)}
              disabled={total === 0 && !active}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
                total === 0 && !active && "opacity-40 hover:bg-transparent",
              )}
            >
              <Icon className="h-3 w-3" />
              {meta.label} ({total})
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <Empty
          label={`Nothing in ${formatMonth(view.start)} – ${formatMonth(view.end)}.`}
          description={
            jumpTarget && jumpTarget.page !== view.page
              ? `The most recent entry here is from ${fmtDate(jumpTarget.date)}.`
              : "Entries land here as milestones, kudos and profile changes happen."
          }
        />
      ) : (
        <div className="flex flex-col">
          {view.months.map((month) => {
            const monthEvents = shown.filter(
              (e) => monthKeyOf(e.date) === month,
            );
            const [y, m] = month.split("-");
            return (
              <div key={month} className="grid grid-cols-[54px_1fr] gap-x-3">
                <div className="pt-0.5 text-right">
                  <p className="text-xs font-semibold text-foreground">
                    {formatMonth(month).split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    {y}
                    <span className="sr-only"> month {m}</span>
                  </p>
                </div>
                <div className="relative flex flex-col gap-3 border-l border-border pb-6 pl-6">
                  {monthEvents.length === 0 ? (
                    <div className="relative">
                      <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-border ring-4 ring-background" />
                      <p className="py-0.5 text-[11px] text-muted-foreground/70">
                        No activity
                      </p>
                    </div>
                  ) : (
                    monthEvents.map((e) => (
                      <div key={e.id} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[29px] top-3.5 h-3 w-3 rounded-full ring-4 ring-background",
                            CATEGORIES[e.category].dot,
                          )}
                        />
                        <EventCard event={e} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Foot of the window: either page further back, or the start of record. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground">
          {view.page >= view.maxPage
            ? `Start of the record — joined ${fmtDate(data.joinedDate)}.`
            : `Older entries go back to ${fmtDate(data.joinedDate)}.`}
        </p>
        <div className="flex items-center gap-1.5">
          {shown.length === 0 && jumpTarget && jumpTarget.page !== view.page && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(jumpTarget.page)}
            >
              Jump to {formatMonth(monthKeyOf(jumpTarget.date))}
            </Button>
          )}
          {view.page > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setPage(0)}>
              Back to latest
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setPage(view.page + 1)}
            disabled={view.page >= view.maxPage}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Older
          </Button>
        </div>
      </div>
    </Section>
  );
}
