"use client";

import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import { AttendanceChart } from "./attendance-chart";
import { UpcomingEventsCard } from "./upcoming-events-card";
import { UntakenLeaveCard } from "./employees-at-risk";
import { PeopleKpiRow, LeaveKpiRow } from "./stat-cards";
import { TurnoverGaugeCard } from "./turnover-gauge-card";
import { PeopleHeroRing } from "./gender-split-card";
import { DeptHeadcountChart } from "./dept-headcount-chart";
import { EmploymentTypeTile } from "./employment-type-tile";
import { HeadcountTrendCard } from "./headcount-trend-card";
import { EorMapCard } from "./eor-map-card";
import { AttendanceHeroRing } from "./attendance-summary-cards";
import {
  SickDaysTile,
  AbsenceRateTile,
  AverageSpellTile,
  OhCasesTile,
  SicknessTrendTile,
  SicknessByReasonTile,
  OhFitnessTile,
  TopAbsenteesTile,
  SicknessHeroRing,
} from "./sickness-tiles";
import {
  ActionCentreTotal,
  CriticalAlertsTile,
  WarningAlertsTile,
  InfoAlertsTile,
  PriorityHeroRing,
} from "./action-centre-summary";
import { AlertsByCategoryCard } from "./alerts-by-category-card";
import {
  EventsThisWeekTile,
  EventsByTypeTile,
  EventsHeroRing,
} from "./events-summary-card";
import { OpenRolesChart, ResourcingHeroRing } from "./open-roles-chart";
import { HiringFunnelCard } from "./hiring-funnel-card";
import { EngagementTrendCard } from "./engagement-trend-card";
import { EngagementHeroRing } from "./engagement-hero-ring";

/**
 * Column span out of 12, matching the widths the mockup's rows were built
 * from: a third (4), a half (6) or full width (12).
 */
const SPAN_CLASS: Record<number, string> = {
  3: "sm:col-span-6 lg:col-span-3",
  4: "sm:col-span-6 lg:col-span-4",
  6: "sm:col-span-6 lg:col-span-6",
  8: "sm:col-span-6 lg:col-span-8",
  12: "sm:col-span-12 lg:col-span-12",
};

function Cell({ span, children }: { span: number; children: ReactNode }) {
  // `h-full` is a no-op unless the row's other cell is taller (a grid row
  // stretches every cell to match by default) — it's what lets a cell's own
  // content grow to fill that extra height instead of leaving a gap.
  return <div className={cn(SPAN_CLASS[span], "h-full")}>{children}</div>;
}

/** Shared row wrapper for every tab below. */
function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">{children}</div>
  );
}

/**
 * People — per the client's wireframes: KPIs full width, then the gender
 * hero ring (which now covers what the old gender donut + detail stack
 * showed), then an Employment-Type/Turnover stack beside the EOR map, then
 * Dept. Headcount beside Headcount Trend.
 */
export function PeopleTabLayout() {
  return (
    <Grid>
      <Cell span={12}>
        <PeopleKpiRow />
      </Cell>

      <Cell span={12}>
        <PeopleHeroRing />
      </Cell>

      <Cell span={6}>
        <div className="flex h-full flex-col gap-2">
          <div className="flex-1">
            <EmploymentTypeTile />
          </div>
          <div className="flex-1">
            <TurnoverGaugeCard />
          </div>
        </div>
      </Cell>
      <Cell span={6}>
        <EorMapCard />
      </Cell>

      <Cell span={6}>
        <DeptHeadcountChart />
      </Cell>
      <Cell span={6}>
        <HeadcountTrendCard />
      </Cell>
    </Grid>
  );
}

export function AttendanceTabLayout() {
  return (
    <Grid>
      <Cell span={12}>
        <LeaveKpiRow />
      </Cell>
      <Cell span={12}>
        <AttendanceHeroRing />
      </Cell>
      {/* The full 30-day trend leads — how the month has gone — with the
          untaken-leave action list beneath it. */}
      <Cell span={12}>
        <AttendanceChart />
      </Cell>
      <Cell span={12}>
        <UntakenLeaveCard />
      </Cell>
    </Grid>
  );
}

export function SicknessTabLayout() {
  return (
    <Grid>
      <Cell span={3}>
        <SickDaysTile />
      </Cell>
      <Cell span={3}>
        <AbsenceRateTile />
      </Cell>
      <Cell span={3}>
        <AverageSpellTile />
      </Cell>
      <Cell span={3}>
        <OhCasesTile />
      </Cell>
      <Cell span={12}>
        <SicknessHeroRing />
      </Cell>
      <Cell span={4}>
        <SicknessTrendTile />
      </Cell>
      <Cell span={4}>
        <SicknessByReasonTile />
      </Cell>
      <Cell span={4}>
        <OhFitnessTile />
      </Cell>
      <Cell span={12}>
        <TopAbsenteesTile />
      </Cell>
    </Grid>
  );
}

export function PrioritiesTabLayout() {
  return (
    <Grid>
      <Cell span={12}>
        <ActionCentreTotal />
      </Cell>
      <Cell span={12}>
        <PriorityHeroRing />
      </Cell>
      <Cell span={4}>
        <CriticalAlertsTile />
      </Cell>
      <Cell span={4}>
        <WarningAlertsTile />
      </Cell>
      <Cell span={4}>
        <InfoAlertsTile />
      </Cell>
      <Cell span={12}>
        <AlertsByCategoryCard />
      </Cell>
    </Grid>
  );
}

export function EventsTabLayout() {
  return (
    <Grid>
      <Cell span={12}>
        <EventsHeroRing />
      </Cell>
      <Cell span={6}>
        <EventsThisWeekTile />
      </Cell>
      <Cell span={6}>
        <EventsByTypeTile />
      </Cell>
      <Cell span={12}>
        <UpcomingEventsCard />
      </Cell>
    </Grid>
  );
}

export function ResourcingTabLayout() {
  return (
    <Grid>
      <Cell span={12}>
        <ResourcingHeroRing />
      </Cell>
      <Cell span={6}>
        <OpenRolesChart />
      </Cell>
      <Cell span={6}>
        <HiringFunnelCard />
      </Cell>
    </Grid>
  );
}

export function EngagementTabLayout() {
  return (
    <Grid>
      <Cell span={12}>
        <EngagementHeroRing />
      </Cell>
      <Cell span={12}>
        <EngagementTrendCard />
      </Cell>
    </Grid>
  );
}
