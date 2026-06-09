"use client";

import { CalendarDays } from "lucide-react";
import { UpcomingEventsWidget } from "@/src/components/shared/upcoming-events-widget";
import { UPCOMING_EVENTS } from "../data";

export function UpcomingEvents() {
  return (
    <UpcomingEventsWidget
      items={UPCOMING_EVENTS}
      headerIcon={CalendarDays}
      manageHref="/hr-action-center/events"
      scroll
    />
  );
}
