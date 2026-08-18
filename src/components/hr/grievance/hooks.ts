"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type { ERCase } from "@/src/lib/types/grievance";
import { buildCases } from "./build-cases";

export function useCasesData() {
  return useLocaleSection<ERCase[]>(buildCases);
}
