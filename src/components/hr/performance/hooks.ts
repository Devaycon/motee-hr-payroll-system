"use client";

import {
  usePerformanceActions,
  usePerformanceData,
} from "@/src/lib/performance/use-performance";

/** Reviews and goals for everyone the viewer's role and branch view cover. */
export function usePerformance() {
  return usePerformanceData();
}

export { usePerformanceActions };
