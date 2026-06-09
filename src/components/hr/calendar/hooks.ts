"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { CalEvent, EventType } from "./types";

interface RawEvent {
  id?: string;
  title?: string;
  type?: string;
  start?: string;
  date?: string;
  description?: string;
  location?: string;
}

function mapType(t?: string): EventType {
  if (t === "deadline" || t === "reminder" || t === "holiday") return t;
  if (t === "training" || t === "all-hands" || t === "meeting") return "meeting";
  if (t === "birthday" || t === "anniversary") return "reminder";
  return "meeting";
}

function buildEvents(bundle: LocaleBundle): CalEvent[] {
  return ((bundle.events ?? []) as RawEvent[]).map((raw, i) => ({
    id: raw.id ?? `ev-${i + 1}`,
    title: raw.title ?? "Event",
    date: (raw.start ?? raw.date ?? bundle.tenant.createdAt).slice(0, 10),
    type: mapType(raw.type),
    description: raw.description ?? raw.location,
  }));
}

export function useCalendarEvents() {
  return useLocaleSection<CalEvent[]>(buildEvents);
}
