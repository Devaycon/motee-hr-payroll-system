"use client";

import { CalendarClock, Plane, Radio, Percent } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { SettingsLinkCard } from "./settings-link-card";
import { HolidayYearPanel } from "./holiday-year-panel";
import { CompanyHolidaysPanel } from "./company-holidays-panel";
import { BlackoutPanel } from "./blackout-panel";
import { HOLIDAY_YEARS, COMPANY_HOLIDAYS, BLACKOUT_PERIODS } from "../data";
import { useLiveBlackouts, useLiveCompanyHolidays, useLiveHolidayYear } from "../live";

export function AbsenceCategory() {
  const year = useLiveHolidayYear();
  const holidays = useLiveCompanyHolidays();
  const blackouts = useLiveBlackouts();
  return (
    <Tabs defaultValue="patterns">
      <PageTabsList
        tabs={[
          { value: "patterns", label: "Working Patterns" },
          { value: "allowance", label: "Holiday Allowance" },
          { value: "year", label: "Holiday Year" },
          { value: "holidays", label: "Company Holidays" },
          { value: "blackout", label: "Company Blackout" },
          { value: "presence", label: "Presence Check-ins" },
          { value: "deductions", label: "Deduction Policy" },
        ]}
      />

      <TabsContent value="patterns" className="mt-6">
        <SettingsLinkCard
          icon={CalendarClock}
          title="Working Patterns"
          description="Standard working hours, shift patterns and break times are managed in the Attendance module."
          actions={[
            { label: "Open Attendance", href: "/time-payroll/attendance" },
          ]}
        />
      </TabsContent>

      <TabsContent value="allowance" className="mt-6">
        <SettingsLinkCard
          icon={Plane}
          title="Holiday Allowance"
          description="Annual leave entitlement, accrual and carryover rules are configured in the Leave module."
          actions={[{ label: "Open Leave", href: "/time-payroll/leave" }]}
        />
      </TabsContent>

      <TabsContent value="year" className="mt-6">
        <HolidayYearPanel
          key={`year-${year.version}`}
          cycles={year.cycles ?? HOLIDAY_YEARS}
          onSetStart={year.live ? year.setStart : undefined}
        />
      </TabsContent>

      <TabsContent value="holidays" className="mt-6">
        <CompanyHolidaysPanel
          key={`holidays-${holidays.version}`}
          holidays={holidays.holidays ?? COMPANY_HOLIDAYS}
          live={holidays.live ? holidays : undefined}
        />
      </TabsContent>

      <TabsContent value="blackout" className="mt-6">
        <BlackoutPanel
          key={`blackout-${blackouts.version}`}
          periods={blackouts.periods ?? BLACKOUT_PERIODS}
          live={blackouts.live ? blackouts : undefined}
        />
      </TabsContent>

      <TabsContent value="presence" className="mt-6">
        <SettingsLinkCard
          icon={Radio}
          title="Presence Check-ins"
          description="Turn on periodic 'are you still there?' prompts for clocked-in employees, and configure the interval range, response window and missed-prompt threshold, in the Attendance module."
          actions={[
            {
              label: "Open Attendance",
              href: "/time-payroll/attendance?tab=presence",
            },
          ]}
        />
      </TabsContent>

      <TabsContent value="deductions" className="mt-6">
        <SettingsLinkCard
          icon={Percent}
          title="Deduction Policy"
          description="Configure the late-arrival grace period, and the late, absence and early-departure deduction rules, in the Attendance module."
          actions={[
            {
              label: "Open Attendance",
              href: "/time-payroll/attendance?tab=deductions",
            },
          ]}
        />
      </TabsContent>
    </Tabs>
  );
}
