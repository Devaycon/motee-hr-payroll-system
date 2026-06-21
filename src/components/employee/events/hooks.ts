"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { EmployeeCalEvent, EmployeeEventType } from "./types";

interface RawEvent {
  id?: string;
  title?: string;
  type?: string;
  start?: string;
  end?: string;
  description?: string;
  allDay?: boolean;
}

function mapType(t?: string): EmployeeEventType {
  if (t === "training" || t === "birthday" || t === "anniversary" || t === "leave" || t === "performance") return t;
  return "company";
}

/** Extract a local "HH:mm" from an ISO datetime, or undefined if it has no time part. */
function toTime(iso?: string): string | undefined {
  if (!iso || !iso.includes("T")) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildEvents(bundle: LocaleBundle): EmployeeCalEvent[] {
  return ((bundle.events ?? []) as RawEvent[]).map((e, i) => {
    const timed = e.allDay !== true;
    return {
      id: e.id ?? `ev-${i + 1}`,
      title: e.title ?? "Event",
      date: (e.start ?? bundle.tenant.createdAt).slice(0, 10),
      type: mapType(e.type),
      description: e.description,
      startTime: timed ? toTime(e.start) : undefined,
      endTime: timed ? toTime(e.end) : undefined,
      allDay: e.allDay,
    };
  });
}

export function useEmployeeEvents() {
  return useLocaleSection<EmployeeCalEvent[]>(buildEvents);
}
