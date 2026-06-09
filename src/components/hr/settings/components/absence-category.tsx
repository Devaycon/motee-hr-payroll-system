"use client";

import { CalendarClock, Plane } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { SettingsLinkCard } from "./settings-link-card";
import { HolidayYearPanel } from "./holiday-year-panel";
import { CompanyHolidaysPanel } from "./company-holidays-panel";
import { BlackoutPanel } from "./blackout-panel";
import { HOLIDAY_YEARS, COMPANY_HOLIDAYS, BLACKOUT_PERIODS } from "../data";

export function AbsenceCategory() {
  return (
    <Tabs defaultValue="patterns">
      <PageTabsList
        tabs={[
          { value: "patterns", label: "Working Patterns" },
          { value: "allowance", label: "Holiday Allowance" },
          { value: "year", label: "Holiday Year" },
          { value: "holidays", label: "Company Holidays" },
          { value: "blackout", label: "Company Blackout" },
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
        <HolidayYearPanel cycles={HOLIDAY_YEARS} />
      </TabsContent>

      <TabsContent value="holidays" className="mt-6">
        <CompanyHolidaysPanel holidays={COMPANY_HOLIDAYS} />
      </TabsContent>

      <TabsContent value="blackout" className="mt-6">
        <BlackoutPanel periods={BLACKOUT_PERIODS} />
      </TabsContent>
    </Tabs>
  );
}
