"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { EmployeeCalEvent, EmployeeEventType } from "./types";

interface RawEvent {
  id?: string;
  title?: string;
  type?: string;
  start?: string;
  description?: string;
}

function mapType(t?: string): EmployeeEventType {
  if (t === "training" || t === "birthday" || t === "anniversary" || t === "leave" || t === "performance") return t;
  return "company";
}

function buildEvents(bundle: LocaleBundle): EmployeeCalEvent[] {
  return ((bundle.events ?? []) as RawEvent[]).map((e, i) => ({
    id: e.id ?? `ev-${i + 1}`,
    title: e.title ?? "Event",
    date: (e.start ?? bundle.tenant.createdAt).slice(0, 10),
    type: mapType(e.type),
    description: e.description,
  }));
}

export function useEmployeeEvents() {
  return useLocaleSection<EmployeeCalEvent[]>(buildEvents);
}
