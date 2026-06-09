"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";

export function useAccessLevels() {
  return useAppSelector((s) => s.accessLevels.levels);
}
